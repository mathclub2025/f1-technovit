import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "race.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn
if __name__ == "__main__":
    conn = get_connection()
    print("Connected to:", DB_PATH)
    print("Database connection successful!")
    conn.close()
def fetch_all(query, params=()):
    conn = get_connection()
    try:
        cursor = conn.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def fetch_one(query, params=()):
    conn = get_connection()
    try:
        cursor = conn.execute(query, params)
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def execute(query, params=()):
    conn = get_connection()
    try:
        cursor = conn.execute(query, params)
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()
def get_standings():
    conn = get_connection()

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

    rows = conn.execute(query).fetchall()

    standings = [dict(row) for row in rows]

    conn.close()

    return standings
def get_race(race_id):
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
    return execute(
        """
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
            action = excluded.action,
            pit_lap = excluded.pit_lap,
            new_compound = excluded.new_compound,
            admin_override = excluded.admin_override
        """,
        (
            team_id,
            block_id,
            action,
            pit_lap,
            new_compound,
            admin_override
        )
    )

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
    return execute(
        """
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
            lap_time = excluded.lap_time,
            cumulative_time = excluded.cumulative_time,
            position = excluded.position,
            compound = excluded.compound,
            tire_age = excluded.tire_age,
            pit_stop = excluded.pit_stop,
            pit_penalty = excluded.pit_penalty,
            status = excluded.status
        """,
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
        raise ValueError(
            f"Lap {lap_number} does not exist for block {block_id}"
        )

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

