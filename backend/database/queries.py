from database.database import get_connection


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
    # Hash password using sha256 to store in password_hash
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # 1. Insert into teams (color defaults to '#ffffff')
        cursor.execute(
            "INSERT INTO teams (name, color) VALUES (?, ?)",
            (team_name, '#ffffff')
        )
        team_id = cursor.lastrowid
        
        # 2. Insert into users
        cursor.execute(
            "INSERT INTO users (username, password_hash, role, team_id) VALUES (?, ?, 'TEAM', ?)",
            (email, password_hash, team_id)
        )
        
        # 3. Initialize team car in team_cars
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
            VALUES (?, 'MEDIUM', 0, 0.0, 100.0, 0, 0)
            """,
            (team_id,)
        )
        
        # 4. Insert members if provided, otherwise insert captain as member
        if members:
            for member in members:
                m_name = member.name if hasattr(member, 'name') else member.get('name')
                m_email = member.email if hasattr(member, 'email') else member.get('email')
                cursor.execute(
                    """
                    INSERT INTO team_members (team_id, name, email, registration_no)
                    VALUES (?, ?, ?, ?)
                    """,
                    (team_id, m_name, m_email, f"{registration_number}_{m_email}")
                )
        else:
            cursor.execute(
                """
                INSERT INTO team_members (team_id, name, email, registration_no)
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


