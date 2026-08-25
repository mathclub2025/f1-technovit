from pydantic import BaseModel
from typing import Optional, Literal, List
from enum import Enum


class Compound(str, Enum):
    SOFT = "SOFT"
    MEDIUM = "MEDIUM"
    HARD = "HARD"
    INTER = "INTER"
    WET = "WET"


class TrackState(str, Enum):
    DRY = "DRY"
    WET = "WET"
    DRYING = "DRYING"


class ActionType(str, Enum):
    STAY_OUT = "STAY_OUT"
    PIT = "PIT"


class PowerType(str, Enum):
    NONE = "NONE"
    HAMMERTIME = "HAMMERTIME"
    BLITZKRIEG = "BLITZKRIEG"
    RAINMASTER = "RAINMASTER"
    PLAN_E = "PLAN_E"
    MINISTER_OF_DEFENCE = "MINISTER_OF_DEFENCE"


class Car(BaseModel):
    team_id: str
    driver: str = ""
    compound: Compound = Compound.MEDIUM
    next_compound: Optional[Compound] = None
    tire_age: int = 0
    total_race_time: float = 0.0
    last_lap_time: float = 0.0
    action: ActionType = ActionType.STAY_OUT
    pit_lap: Optional[int] = None
    active_power: PowerType = PowerType.NONE
    is_hammertime: bool = False
    is_blitzkrieg: bool = False
    is_rainmaster: bool = False
    is_plan_e: bool = False
    is_pit_blocked: bool = False
    plan_e_custom_penalty: Optional[float] = None
    has_used_power: bool = False
    pit_stop_count: int = 0
    has_submitted: bool = False
    status: str = "TRACK"


class StrategySubmission(BaseModel):
    team_id: str
    round_number: int
    action: ActionType
    pit_lap: Optional[int] = None
    new_compound: Optional[Compound] = None


class PowerAssignment(BaseModel):
    team_id: str
    power: PowerType
    target_team_id: Optional[str] = None
    plan_e_penalty: Optional[float] = None


class ExecuteBlockPayload(BaseModel):
    block_number: int
    start_lap: int
    end_lap: int
    track_state: TrackState
    active_modifiers: List[PowerAssignment] = []


class GodModeOverride(BaseModel):
    team_id: str
    total_race_time: Optional[float] = None
    tire_age: Optional[int] = None
    compound: Optional[Compound] = None


class TokenPayload(BaseModel):
    email: str
    teamId: Optional[str] = None
    role: Literal["team", "admin"] = "team"