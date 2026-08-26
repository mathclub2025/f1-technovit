PRAGMA foreign_keys = ON;

-- =========================
-- TEAMS
-- =========================

CREATE TABLE teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- USERS
-- =========================

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'TEAM')),
    team_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- =========================
-- RACES
-- =========================

CREATE TABLE races (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    total_laps INTEGER NOT NULL DEFAULT 50,
    total_blocks INTEGER NOT NULL DEFAULT 10,
    current_lap INTEGER NOT NULL DEFAULT 0,
    current_block INTEGER NOT NULL DEFAULT 0,
    track_state TEXT NOT NULL DEFAULT 'DRY'
        CHECK (track_state IN ('DRY', 'WET', 'DRYING')),
    status TEXT NOT NULL DEFAULT 'UPCOMING'
        CHECK (status IN ('UPCOMING', 'RUNNING', 'COMPLETED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- BLOCKS
-- =========================

CREATE TABLE blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL,
    block_number INTEGER NOT NULL,
    start_lap INTEGER NOT NULL,
    end_lap INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'LOCKED'
        CHECK (status IN ('LOCKED', 'LIVE', 'COMPLETED')),

    FOREIGN KEY (race_id) REFERENCES races(id),
    UNIQUE (race_id, block_number)
);

-- =========================
-- LAPS
-- =========================

CREATE TABLE laps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_id INTEGER NOT NULL,
    lap_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'LOCKED'
        CHECK (status IN ('LOCKED', 'LIVE', 'COMPLETED')),

    FOREIGN KEY (block_id) REFERENCES blocks(id),
    UNIQUE (block_id, lap_number)
);

-- =========================
-- TEAM VEHICLES
-- =========================

CREATE TABLE team_cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL UNIQUE,
    compound TEXT NOT NULL DEFAULT 'MEDIUM'
        CHECK (compound IN ('SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET')),
    tire_age INTEGER NOT NULL DEFAULT 0,
    total_race_time REAL NOT NULL DEFAULT 0,
    vehicle_health REAL NOT NULL DEFAULT 100,
    pit_stops INTEGER NOT NULL DEFAULT 0,
    has_used_power INTEGER NOT NULL DEFAULT 0
        CHECK (has_used_power IN (0, 1)),

    FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- =========================
-- STRATEGY SUBMISSIONS
-- =========================

CREATE TABLE strategy_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    block_id INTEGER NOT NULL,

    action TEXT NOT NULL
        CHECK (action IN ('STAY_OUT', 'PIT')),

    pit_lap INTEGER,
    new_compound TEXT,
    admin_override INTEGER NOT NULL DEFAULT 0
        CHECK (admin_override IN (0, 1)),

    admin_pit_lap INTEGER,
    admin_new_compound TEXT,

    admin_updated_at DATETIME,
    admin_updated_by INTEGER,

    status TEXT NOT NULL DEFAULT 'SUBMITTED'
        CHECK (status IN ('SUBMITTED', 'LOCKED', 'PROCESSED')),

    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (admin_updated_by) REFERENCES users(id),
    FOREIGN KEY (block_id) REFERENCES blocks(id),

    UNIQUE (team_id, block_id)
);

-- =========================
-- SUPERPOWERS
-- =========================

CREATE TABLE superpowers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- =========================
-- TEAM POWERS
-- =========================

CREATE TABLE team_powers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    block_id INTEGER NOT NULL,
    power_id INTEGER NOT NULL,
    target_team_id INTEGER,
    custom_penalty REAL,
    used INTEGER NOT NULL DEFAULT 0
        CHECK (used IN (0, 1)),

    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (block_id) REFERENCES blocks(id),
    FOREIGN KEY (power_id) REFERENCES superpowers(id),
    FOREIGN KEY (target_team_id) REFERENCES teams(id)
);

-- =========================
-- LAP RESULTS
-- =========================

CREATE TABLE lap_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    lap_id INTEGER NOT NULL,

    lap_time REAL NOT NULL,
    cumulative_time REAL NOT NULL,
    position INTEGER,

    compound TEXT,
    tire_age INTEGER,

    pit_stop INTEGER NOT NULL DEFAULT 0
        CHECK (pit_stop IN (0, 1)),

    pit_penalty REAL NOT NULL DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'COMPLETED'
        CHECK (status IN ('CALCULATED', 'COMPLETED')),

    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (lap_id) REFERENCES laps(id),

    UNIQUE (team_id, lap_id)
);

-- =========================
-- INDEXES
-- =========================

CREATE INDEX idx_users_team
ON users(team_id);

CREATE INDEX idx_blocks_race
ON blocks(race_id);

CREATE INDEX idx_laps_block
ON laps(block_id);

CREATE INDEX idx_laps_number
ON laps(lap_number);

CREATE INDEX idx_submissions_team
ON strategy_submissions(team_id);

CREATE INDEX idx_submissions_block
ON strategy_submissions(block_id);

CREATE INDEX idx_results_team
ON lap_results(team_id);

-- ==========================================
-- TEAM MEMBERS
-- ==========================================

CREATE TABLE team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    registration_no TEXT NOT NULL UNIQUE,

    FOREIGN KEY (team_id) REFERENCES teams(id)
);


CREATE INDEX idx_results_lap
ON lap_results(lap_id);

CREATE INDEX idx_powers_team
ON team_powers(team_id);
