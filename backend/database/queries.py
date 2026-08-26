try:
    from .database import get_connection, is_postgres, fetch_all, fetch_one, execute
except ImportError:
    from database.database import get_connection, is_postgres, fetch_all, fetch_one, execute


def get_teams():
    return fetch_all("""
        SELECT *
        FROM teams
    """)


def get_race():
    return fetch_all("""
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
        ORDER BY id
    """)


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


def create_team_with_members(registration_number, email, password, team_name, members=None):
    import hashlib
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    conn = get_connection()
    try:
        if is_postgres():
            from psycopg2.extras import RealDictCursor
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # 1. Insert or get team
                cursor.execute(
                    "INSERT INTO teams (name, color) VALUES (%s, %s) ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color RETURNING id",
                    (team_name, '#ffffff')
                )
                team_id = cursor.fetchone()["id"]

                # 2. Insert or update user
                cursor.execute(
                    """
                    INSERT INTO users (username, password_hash, role, team_id) 
                    VALUES (%s, %s, 'TEAM', %s)
                    ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, team_id = EXCLUDED.team_id
                    """,
                    (email, password_hash, team_id)
                )

                # 3. Initialize team car
                cursor.execute(
                    """
                    INSERT INTO team_cars (
                        team_id,
                        compound,
                        tire_age,
                        total_race_time,
                        vehicle_health,
                        pit_stops,
                        has_used_power
                    )
                    VALUES (%s, 'MEDIUM', 0, 0.0, 100.0, 0, 0)
                    ON CONFLICT (team_id) DO NOTHING
                    """,
                    (team_id,)
                )

                # 4. Insert members
                if members:
                    for member in members:
                        m_name = member.name if hasattr(member, 'name') else member.get('name')
                        m_email = member.email if hasattr(member, 'email') else member.get('email')
                        cursor.execute(
                            """
                            INSERT INTO team_members (team_id, name, email, registration_no)
                            VALUES (%s, %s, %s, %s)
                            ON CONFLICT (email) DO NOTHING
                            """,
                            (team_id, m_name, m_email, f"{registration_number}_{m_email}")
                        )
                else:
                    cursor.execute(
                        """
                        INSERT INTO team_members (team_id, name, email, registration_no)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (email) DO NOTHING
                        """,
                        (team_id, team_name, email, registration_number)
                    )
                conn.commit()
                return team_id
        else:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT OR IGNORE INTO teams (name, color) VALUES (?, ?)",
                (team_name, '#ffffff')
            )
            cursor.execute("SELECT id FROM teams WHERE name = ?", (team_name,))
            row = cursor.fetchone()
            team_id = row[0] if isinstance(row, (tuple, list)) else row["id"]

            cursor.execute(
                "INSERT OR REPLACE INTO users (username, password_hash, role, team_id) VALUES (?, ?, 'TEAM', ?)",
                (email, password_hash, team_id)
            )

            cursor.execute(
                """
                INSERT OR IGNORE INTO team_cars (
                    team_id,
                    compound,
                    tire_age,
                    total_race_time,
                    vehicle_health,
                    pit_stops,
                    has_used_power
                )
                VALUES (?, 'MEDIUM', 0, 0.0, 100.0, 0, 0)
                """,
                (team_id,)
            )

            if members:
                for member in members:
                    m_name = member.name if hasattr(member, 'name') else member.get('name')
                    m_email = member.email if hasattr(member, 'email') else member.get('email')
                    cursor.execute(
                        """
                        INSERT OR IGNORE INTO team_members (team_id, name, email, registration_no)
                        VALUES (?, ?, ?, ?)
                        """,
                        (team_id, m_name, m_email, f"{registration_number}_{m_email}")
                    )
            else:
                cursor.execute(
                    """
                    INSERT OR IGNORE INTO team_members (team_id, name, email, registration_no)
                    VALUES (?, ?, ?, ?)
                    """,
                    (team_id, team_name, email, registration_number)
                )
            conn.commit()
            return team_id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()



