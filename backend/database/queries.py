from database import get_connection


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