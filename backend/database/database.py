import os
import sqlite3
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "race.db"


def is_postgres():
    return bool(DATABASE_URL and (DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://")))


def get_connection():
    if is_postgres():
        import psycopg2
        from psycopg2.extras import RealDictCursor
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn


def _format_query(query: str) -> str:
    if is_postgres():
        # Convert SQLite ? placeholders to PostgreSQL %s
        return query.replace("?", "%s")
    return query


def fetch_all(query, params=()):
    conn = get_connection()
    formatted = _format_query(query)
    try:
        if is_postgres():
            from psycopg2.extras import RealDictCursor
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(formatted, params)
                return [dict(row) for row in cursor.fetchall()]
        else:
            cursor = conn.execute(formatted, params)
            return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def fetch_one(query, params=()):
    conn = get_connection()
    formatted = _format_query(query)
    try:
        if is_postgres():
            from psycopg2.extras import RealDictCursor
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(formatted, params)
                row = cursor.fetchone()
                return dict(row) if row else None
        else:
            cursor = conn.execute(formatted, params)
            row = cursor.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()


def execute(query, params=(), return_id=False):
    conn = get_connection()
    formatted = _format_query(query)
    try:
        if is_postgres():
            from psycopg2.extras import RealDictCursor
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(formatted, params)
                last_id = None
                if return_id:
                    try:
                        row = cursor.fetchone()
                        last_id = row["id"] if row and "id" in row else None
                    except Exception:
                        pass
                conn.commit()
                return last_id
        else:
            cursor = conn.execute(formatted, params)
            conn.commit()
            return cursor.lastrowid
    finally:
        conn.close()


def get_standings():
    query = """
    SELECT
        t.id AS team_id,
        t.name AS team_name,
        tc.compound,
        tc.tire_age,
        tc.total_race_time,
        tc.pit_stops,
        lr.lap_time,
        lr.cumulative_time,
        lr.position,
        lr.lap_id
    FROM teams t
    JOIN team_cars tc
        ON tc.team_id = t.id
    LEFT JOIN lap_results lr
        ON lr.id = (
            SELECT lr2.id
            FROM lap_results lr2
            WHERE lr2.team_id = t.id
            ORDER BY lr2.lap_id DESC
            LIMIT 1
        )
    ORDER BY
        COALESCE(lr.position, 999999),
        tc.total_race_time ASC;
    """
    return fetch_all(query)


def get_race(race_id=1):
    return fetch_one(
        """
        SELECT
            id,
            name,
            total_laps,
            total_blocks,
            current_lap,
            current_block,
            track_state,
            status,
            created_at
        FROM races
        WHERE id = ?
        """,
        (race_id,)
    )


def save_strategy(
    team_id,
    block_id,
    action,
    pit_lap=None,
    new_compound=None,
    admin_override=0
):
    query = """
        INSERT INTO strategy_submissions
        (
            team_id,
            block_id,
            action,
            pit_lap,
            new_compound,
            admin_override
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(team_id, block_id)
        DO UPDATE SET
            action = EXCLUDED.action,
            pit_lap = EXCLUDED.pit_lap,
            new_compound = EXCLUDED.new_compound,
            admin_override = EXCLUDED.admin_override
    """
    return execute(query, (team_id, block_id, action, pit_lap, new_compound, admin_override))


def save_lap_result(
    team_id,
    lap_id,
    lap_time,
    cumulative_time,
    position,
    compound=None,
    tire_age=None,
    pit_stop=0,
    pit_penalty=0
):
    query = """
        INSERT INTO lap_results (
            team_id,
            lap_id,
            lap_time,
            cumulative_time,
            position,
            compound,
            tire_age,
            pit_stop,
            pit_penalty,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED')
        ON CONFLICT(team_id, lap_id)
        DO UPDATE SET
            lap_time = EXCLUDED.lap_time,
            cumulative_time = EXCLUDED.cumulative_time,
            position = EXCLUDED.position,
            compound = EXCLUDED.compound,
            tire_age = EXCLUDED.tire_age,
            pit_stop = EXCLUDED.pit_stop,
            pit_penalty = EXCLUDED.pit_penalty,
            status = EXCLUDED.status
    """
    return execute(
        query,
        (
            team_id,
            lap_id,
            lap_time,
            cumulative_time,
            position,
            compound,
            tire_age,
            pit_stop,
            pit_penalty
        )
    )


def get_strategy(team_id, block_id):
    return fetch_one(
        """
        SELECT
            id,
            team_id,
            block_id,
            action,
            pit_lap,
            new_compound,
            admin_override,
            status,
            submitted_at
        FROM strategy_submissions
        WHERE team_id = ?
          AND block_id = ?
        """,
        (team_id, block_id)
    )


def get_block_id(race_id, block_number):
    row = fetch_one(
        """
        SELECT id
        FROM blocks
        WHERE race_id = ? AND block_number = ?
        """,
        (race_id, block_number)
    )
    return row["id"] if row else None


def get_lap_id(block_id, lap_number):
    row = fetch_one(
        """
        SELECT id
        FROM laps
        WHERE block_id = ? AND lap_number = ?
        """,
        (block_id, lap_number)
    )
    return row["id"] if row else None


def update_team_car(
    team_id,
    compound,
    tire_age,
    total_race_time,
    pit_stops,
    has_used_power
):
    execute(
        """
        UPDATE team_cars
        SET compound = ?,
            tire_age = ?,
            total_race_time = ?,
            pit_stops = ?,
            has_used_power = ?
        WHERE team_id = ?
        """,
        (
            compound,
            tire_age,
            total_race_time,
            pit_stops,
            int(has_used_power),
            team_id
        )
    )


def update_lap_status(lap_id, status):
    execute(
        """
        UPDATE laps
        SET status = ?
        WHERE id = ?
        """,
        (status, lap_id)
    )


def update_block_status(block_id, status):
    execute(
        """
        UPDATE blocks
        SET status = ?
        WHERE id = ?
        """,
        (status, block_id)
    )


def update_race_state(
    race_id,
    current_lap,
    current_block,
    track_state,
    status
):
    execute(
        """
        UPDATE races
        SET current_lap = ?,
            current_block = ?,
            track_state = ?,
            status = ?
        WHERE id = ?
        """,
        (
            current_lap,
            current_block,
            track_state,
            status,
            race_id
        )
    )


def get_block_strategy(block_id, team_id):
    return get_strategy(team_id, block_id)


def save_car_lap_result(
    team_id,
    block_id,
    lap_number,
    lap_time,
    cumulative_time,
    position,
    compound,
    tire_age,
    pit_stop,
    pit_penalty=0
):
    lap_id = get_lap_id(block_id, lap_number)

    if lap_id is None:
        return None

    result_id = save_lap_result(
        team_id=team_id,
        lap_id=lap_id,
        lap_time=lap_time,
        cumulative_time=cumulative_time,
        position=position,
        compound=compound,
        tire_age=tire_age,
        pit_stop=pit_stop,
        pit_penalty=pit_penalty
    )

    update_lap_status(lap_id, "COMPLETED")
    return result_id


def register_team_member(team_id, name, email, registration_no):
    return execute("""
        INSERT INTO team_members (
            team_id,
            name,
            email,
            registration_no
        )
        VALUES (?, ?, ?, ?)
    """, (team_id, name, email, registration_no))


def init_race_schema(race_id=1, total_laps=50, total_blocks=10):
    """Ensures a race record with its blocks and laps exists in PostgreSQL or SQLite."""
    conn = get_connection()
    try:
        if is_postgres():
            from psycopg2.extras import RealDictCursor
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT id FROM races WHERE id = %s", (race_id,))
                if not cursor.fetchone():
                    cursor.execute(
                        """
                        INSERT INTO races (id, name, total_laps, total_blocks, current_lap, current_block, track_state, status)
                        VALUES (%s, 'F1 Technovit Grand Prix', %s, %s, 0, 1, 'DRY', 'UPCOMING')
                        ON CONFLICT (id) DO NOTHING
                        """,
                        (race_id, total_laps, total_blocks)
                    )
                    for b in range(1, total_blocks + 1):
                        start_l = (b - 1) * 5 + 1
                        end_l = b * 5
                        cursor.execute(
                            """
                            INSERT INTO blocks (race_id, block_number, start_lap, end_lap, status)
                            VALUES (%s, %s, %s, %s, 'LOCKED')
                            ON CONFLICT (race_id, block_number) DO NOTHING
                            RETURNING id
                            """,
                            (race_id, b, start_l, end_l)
                        )
                        row = cursor.fetchone()
                        block_id = row["id"] if row else None
                        if not block_id:
                            cursor.execute("SELECT id FROM blocks WHERE race_id = %s AND block_number = %s", (race_id, b))
                            r = cursor.fetchone()
                            block_id = r["id"] if r else None
                        if block_id:
                            for l in range(start_l, end_l + 1):
                                cursor.execute(
                                    """
                                    INSERT INTO laps (block_id, lap_number, status)
                                    VALUES (%s, %s, 'LOCKED')
                                    ON CONFLICT (block_id, lap_number) DO NOTHING
                                    """,
                                    (block_id, l)
                                )
            conn.commit()
        else:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM races WHERE id = ?", (race_id,))
            if not cursor.fetchone():
                cursor.execute(
                    """
                    INSERT INTO races (id, name, total_laps, total_blocks, current_lap, current_block, track_state, status)
                    VALUES (?, 'F1 Technovit Grand Prix', ?, ?, 0, 1, 'DRY', 'UPCOMING')
                    """,
                    (race_id, total_laps, total_blocks)
                )
                for b in range(1, total_blocks + 1):
                    start_l = (b - 1) * 5 + 1
                    end_l = b * 5
                    cursor.execute(
                        """
                        INSERT INTO blocks (race_id, block_number, start_lap, end_lap, status)
                        VALUES (?, ?, ?, ?, 'LOCKED')
                        """,
                        (race_id, b, start_l, end_l)
                    )
                    block_id = cursor.lastrowid
                    for l in range(start_l, end_l + 1):
                        cursor.execute(
                            """
                            INSERT INTO laps (block_id, lap_number, status)
                            VALUES (?, ?, 'LOCKED')
                            """,
                            (block_id, l)
                        )
            conn.commit()
    finally:
        conn.close()


def get_or_create_team(team_id_str: str, driver_name: str = "") -> int:
    """Safely retrieves or inserts team into database and returns its integer ID."""
    conn = get_connection()
    try:
        if is_postgres():
            from psycopg2.extras import RealDictCursor
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                if str(team_id_str).isdigit():
                    t_id = int(team_id_str)
                    cursor.execute("SELECT id FROM teams WHERE id = %s", (t_id,))
                    if cursor.fetchone():
                        return t_id

                cursor.execute("SELECT id FROM teams WHERE name = %s", (str(team_id_str),))
                row = cursor.fetchone()
                if row:
                    return row["id"]

                cursor.execute(
                    "INSERT INTO teams (name, color) VALUES (%s, '#ffffff') ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color RETURNING id",
                    (str(team_id_str),)
                )
                new_id = cursor.fetchone()["id"]
                cursor.execute(
                    """
                    INSERT INTO team_cars (team_id, compound, tire_age, total_race_time, vehicle_health, pit_stops, has_used_power)
                    VALUES (%s, 'MEDIUM', 0, 0.0, 100.0, 0, 0)
                    ON CONFLICT (team_id) DO NOTHING
                    """,
                    (new_id,)
                )
                conn.commit()
                return new_id
        else:
            cursor = conn.cursor()
            if str(team_id_str).isdigit():
                t_id = int(team_id_str)
                cursor.execute("SELECT id FROM teams WHERE id = ?", (t_id,))
                if cursor.fetchone():
                    return t_id

            cursor.execute("SELECT id FROM teams WHERE name = ?", (str(team_id_str),))
            row = cursor.fetchone()
            if row:
                return row["id"]

            cursor.execute("INSERT INTO teams (name, color) VALUES (?, '#ffffff')", (str(team_id_str),))
            new_id = cursor.lastrowid
            cursor.execute(
                """
                INSERT OR IGNORE INTO team_cars (team_id, compound, tire_age, total_race_time, vehicle_health, pit_stops, has_used_power)
                VALUES (?, 'MEDIUM', 0, 0.0, 100.0, 0, 0)
                """,
                (new_id,)
            )
            conn.commit()
            return new_id
    finally:
        conn.close()


def delete_team(team_name: str) -> bool:
    """Delete a team and all records that reference it."""
    conn = get_connection()
    placeholder = "%s" if is_postgres() else "?"
    try:
        cursor = conn.cursor()
        cursor.execute(f"SELECT id FROM teams WHERE name = {placeholder}", (team_name,))
        row = cursor.fetchone()
        if not row:
            cursor.execute("SELECT id, name FROM teams")
            normalized_name = str(team_name).lower().replace(" ", "_")
            for candidate in cursor.fetchall():
                candidate_name = candidate[1] if isinstance(candidate, (tuple, list)) else candidate["name"]
                if str(candidate_name).lower().replace(" ", "_") == normalized_name:
                    row = candidate
                    break
        if not row:
            return False

        team_id = row[0] if isinstance(row, (tuple, list)) else row["id"]
        for table in ("strategy_submissions", "team_powers", "lap_results", "team_members", "team_cars", "users"):
            cursor.execute(f"DELETE FROM {table} WHERE team_id = {placeholder}", (team_id,))
        cursor.execute(f"DELETE FROM teams WHERE id = {placeholder}", (team_id,))
        conn.commit()
        return True
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def clear_database() -> None:
    """Remove all application data while preserving the database schema."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        for table in (
            "strategy_submissions",
            "team_powers",
            "lap_results",
            "team_members",
            "team_cars",
            "users",
            "laps",
            "blocks",
            "races",
            "teams",
            "superpowers",
        ):
            cursor.execute(f"DELETE FROM {table}")
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()



