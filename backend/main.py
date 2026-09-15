import os
import time
import asyncio
from typing import Any, Dict, List, Optional, Set
from collections import defaultdict
import sqlite3

from dotenv import load_dotenv

load_dotenv()

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    Query,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import engine
import database
from models import (
    Car,
    Compound,
    TrackState,
    ActionType,
    PowerType,
    StrategySubmission,
    PowerAssignment,
    ExecuteBlockPayload,
    GodModeOverride,
    TokenPayload,

)
from auth import get_current_user, require_admin, get_current_user_ws

# -----------------------------------------------------------------------------
# App Initialization
# -----------------------------------------------------------------------------
app = FastAPI(
    title="PIT OR STAY — F1 Technovit Race API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = "team"
    teamId: Optional[str] = None
    password: Optional[str] = None
    members: Optional[List[Any]] = None


@app.post("/api/auth/login")
@app.post("/api/auth/mock-login")
async def auth_login(payload: LoginRequest):
    admin_password = os.getenv("ADMIN_PASSWORD", "PitOrStay@28")
    if payload.role == "admin":
        if payload.password != admin_password:
            raise HTTPException(status_code=401, detail="Invalid admin password")
    
    secret = os.getenv("SHARED_JWT_SECRET", "technovit_f1_shared_jwt_secret_key_2026")
    try:
        from jose import jwt
    except ImportError:
        import jwt

    token_data = {
        "email": payload.email or (f"{payload.teamId}@f1.com" if payload.teamId else "admin@technovit.com"),
        "teamId": payload.teamId or None,
        "role": payload.role or "team",
    }
    encoded_token = jwt.encode(token_data, secret, algorithm="HS256")
    return {"token": encoded_token}


# -----------------------------------------------------------------------------
# In-Memory Event State
# -----------------------------------------------------------------------------
cars: Dict[str, Car] = {}
current_block: int = 1
current_lap: int = 0
track_state: TrackState = TrackState.DRY
window_open: bool = False
window_expires_at: Optional[float] = None
window_duration_seconds: int = 180
window_timer_task: Optional[asyncio.Task] = None
is_executing_block: bool = False

# Active WebSocket connections
race_websockets: Set[WebSocket] = set()
team_websockets: Dict[str, Set[WebSocket]] = defaultdict(set)


# -----------------------------------------------------------------------------
# WebSocket Broadcast Helpers
# -----------------------------------------------------------------------------
async def broadcast_race(event_type: str, data: Any) -> None:
    message = {"type": event_type, "data": data}
    disconnected = set()
    for ws in list(race_websockets):
        try:
            await ws.send_json(message)
        except Exception:
            disconnected.add(ws)
    for ws in disconnected:
        race_websockets.discard(ws)


async def broadcast_team(team_id: str, event_type: str, data: Any) -> None:
    message = {"type": event_type, "data": data}
    disconnected = set()
    for ws in list(team_websockets.get(team_id, set())):
        try:
            await ws.send_json(message)
        except Exception:
            disconnected.add(ws)
    for ws in disconnected:
        team_websockets[team_id].discard(ws)


async def broadcast_all_team_feeds(event_type: str, data: Any) -> None:
    for team_id in list(team_websockets.keys()):
        await broadcast_team(team_id, event_type, data)


# -----------------------------------------------------------------------------
# Server-Authoritative Timer & State Transitions
# -----------------------------------------------------------------------------
async def _auto_lock_timer(duration_seconds: float) -> None:
    global window_open, window_expires_at
    try:
        await asyncio.sleep(duration_seconds)
        if window_open:
            window_open = False
            window_expires_at = None

            # Fallback STAY_OUT for any car that didn't submit
            for car in cars.values():
                if not car.has_submitted:
                    car.action = ActionType.STAY_OUT
                    car.pit_lap = None
                    car.next_compound = None
                    car.has_submitted = True

            standings = engine.build_standings(cars)
            event_payload = {
                "message": "Submission window locked. Non-submitted teams defaulted to STAY_OUT.",
                "window_open": False,
                "current_block": current_block,
                "standings": standings,
                "cars": {k: v.model_dump() for k, v in cars.items()},
            }
            await broadcast_race("WINDOW_LOCKED", event_payload)
            await broadcast_all_team_feeds("WINDOW_LOCKED", event_payload)
    except asyncio.CancelledError:
        pass


def _default_teams() -> List[Dict[str, Any]]:
    return [
        {"team_id": "team-1", "driver": "Max Verstappen", "compound": Compound.MEDIUM},
        {"team_id": "team-2", "driver": "Lewis Hamilton", "compound": Compound.MEDIUM},
        {"team_id": "team-3", "driver": "Fernando Alonso", "compound": Compound.MEDIUM},
        {"team_id": "team-4", "driver": "Charles Leclerc", "compound": Compound.MEDIUM},
        {"team_id": "team-5", "driver": "Lando Norris", "compound": Compound.MEDIUM},
        {"team_id": "team-6", "driver": "Pierre Gasly", "compound": Compound.MEDIUM},
        {"team_id": "team-7", "driver": "Nico Hülkenberg", "compound": Compound.MEDIUM},
        {"team_id": "team-8", "driver": "Alexander Albon", "compound": Compound.MEDIUM},
    ]


# -----------------------------------------------------------------------------
# Request Models
# -----------------------------------------------------------------------------
class InitGridPayload(BaseModel):
    teams: Optional[List[Dict[str, Any]]] = None


class GridSelectPayload(BaseModel):
    team_id: str
    compound: Compound


class StartWindowPayload(BaseModel):
    duration_seconds: int = 180
    block_number: Optional[int] = None


class ForceSubmitPayload(BaseModel):
    team_id: Optional[str] = None


class TrackStatePayload(BaseModel):
    track_state: TrackState


class AdminStrategyOverride(BaseModel):
    """Admin can manually change a team's strategy: action, pit lap, and compound."""
    team_id: str
    action: ActionType
    pit_lap: Optional[int] = None
    new_compound: Optional[Compound] = None


class DeleteTeamPayload(BaseModel):
    team_id: str

class TeamMember(BaseModel):
    name: str
    reg_no: Optional[str] = None
    email: Optional[str] = None

class TeamRegistration(BaseModel):
    teamId: str
    captain_name: Optional[str] = None
    captain_reg_no: Optional[str] = None
    password: Optional[str] = None
    email: Optional[str] = None
    members: list[TeamMember] = []


@app.get("/")
def root():
    return {"message": "F1-Technovit Race API", "status": "running"}

@app.on_event("startup")
async def startup_event():
    try:
        database.database.init_race_schema(1, 50, 10)
        # Pre-seed default cars in memory
        db_teams = database.queries.get_teams()
        raw_teams = [
            {
                "team_id": str(t.get("name", f"team_{t.get('id')}")).lower().replace(" ", "_"),
                "driver": t.get("name", f"Team {t.get('id')}"),
                "compound": Compound.MEDIUM
            }
            for t in db_teams
        ] if db_teams and len(db_teams) > 0 else _default_teams()

        for item in raw_teams:
            t_id = str(item.get("team_id") or item.get("id"))
            driver = item.get("driver") or item.get("driverName") or ""
            cars[t_id] = Car(
                team_id=t_id,
                driver=driver,
                compound=Compound.MEDIUM,
                tire_age=0,
                total_race_time=0.0,
                last_lap_time=0.0,
                action=ActionType.STAY_OUT,
                pit_stop_count=0,
                status="TRACK",
                has_submitted=False,
                has_used_power=False,
            )
            database.database.get_or_create_team(t_id, driver)
    except Exception as e:
        print(f"Startup initialization note: {e}")

@app.post("/api/register")
async def register_team(payload: TeamRegistration):
    try:
        captain_reg = payload.captain_reg_no or payload.password or "22BCE1001"
        pw = payload.password or captain_reg
        email = payload.email or f"{captain_reg.lower()}@technovit.vit.ac.in"
        
        database.queries.create_team_with_members(
            registration_number=captain_reg,
            email=email,
            password=pw,
            team_name=payload.teamId,
            members=[m.dict() for m in payload.members],
        )
        
        # Add immediately to in-memory cars
        t_id = str(payload.teamId).lower().replace(" ", "_")
        if t_id not in cars:
            cars[t_id] = Car(
                team_id=t_id,
                driver=payload.teamId,
                compound=Compound.MEDIUM,
                tire_age=0,
                total_race_time=0.0,
                last_lap_time=0.0,
                action=ActionType.STAY_OUT,
                pit_stop_count=0,
                status="TRACK",
                has_submitted=False,
                has_used_power=False,
            )
            standings = engine.build_standings(cars)
            event_payload = {
                "message": f"New team {payload.teamId} registered on grid.",
                "current_block": current_block,
                "current_lap": current_lap,
                "track_state": track_state,
                "window_open": window_open,
                "window_expires_at": window_expires_at,
                "standings": standings,
                "cars": {k: v.model_dump() for k, v in cars.items()},
            }
            await broadcast_race("GRID_INITIALIZED", event_payload)
            await broadcast_all_team_feeds("GRID_INITIALIZED", event_payload)

        return {
            "status": "ok",
            "message": "Team member registered successfully",
            "id": new_id,
        }
    except Exception as e:
        print(f"Register error: {e}")
        # Even if DB already has it, ensure car exists in memory
        t_id = str(payload.teamId).lower().replace(" ", "_")
        if t_id not in cars:
            cars[t_id] = Car(
                team_id=t_id,
                driver=payload.teamId,
                compound=Compound.MEDIUM,
                tire_age=0,
                total_race_time=0.0,
                last_lap_time=0.0,
                action=ActionType.STAY_OUT,
                pit_stop_count=0,
                status="TRACK",
                has_submitted=False,
                has_used_power=False,
            )
        return {
            "status": "ok",
            "message": "Team registered",
            "id": payload.teamId,
        }

@app.post("/api/admin/init-grid")
async def init_grid(
    payload: Optional[InitGridPayload] = None,
    user: TokenPayload = Depends(require_admin),
):
    global cars, current_block, current_lap, track_state, window_open, window_expires_at, window_timer_task, is_executing_block

    if window_timer_task and not window_timer_task.done():
        window_timer_task.cancel()

    cars = {}
    current_block = 1
    current_lap = 0
    track_state = TrackState.DRY
    window_open = False
    window_expires_at = None
    is_executing_block = False

    if payload and payload.teams:
        raw_teams = payload.teams
    else:
        try:
            db_teams = database.queries.get_teams()
            if db_teams and len(db_teams) > 0:
                raw_teams = [
                    {
                        "team_id": str(t.get("name", f"team_{t.get('id')}")).lower().replace(" ", "_"),
                        "driver": t.get("name", f"Team {t.get('id')}"),
                        "compound": Compound.MEDIUM
                    }
                    for t in db_teams
                ]
            else:
                raw_teams = _default_teams()
        except Exception:
            raw_teams = _default_teams()

    for item in raw_teams:
        t_id = str(item.get("team_id") or item.get("id"))
        driver = item.get("driver") or item.get("driverName") or ""
        compound_val = item.get("compound") or Compound.MEDIUM
        if isinstance(compound_val, str):
            try:
                compound_val = Compound(compound_val.upper())
            except ValueError:
                compound_val = Compound.MEDIUM

        cars[t_id] = Car(
            team_id=t_id,
            driver=driver,
            compound=compound_val,
            tire_age=0,
            total_race_time=0.0,
            last_lap_time=0.0,
            action=ActionType.STAY_OUT,
            pit_stop_count=0,
            status="TRACK",
            has_submitted=False,
            has_used_power=False,
        )
        try:
            database.database.init_race_schema(1, 50, 10)
            database.database.get_or_create_team(t_id, driver)
        except Exception as e:
            print(f"Error initializing team in database: {e}")

    standings = engine.build_standings(cars)
    event_data = {
        "current_block": current_block,
        "current_lap": current_lap,
        "track_state": track_state,
        "standings": standings,
        "cars": {k: v.model_dump() for k, v in cars.items()},
    }
    await broadcast_race("GRID_INITIALIZED", event_data)
    await broadcast_all_team_feeds("GRID_INITIALIZED", event_data)

    return {
        "status": "ok",
        "message": "Grid initialized successfully for Round 0",
        "standings": standings,
        "cars": cars,
    }


@app.post("/api/strategy/grid-select")
async def grid_select(
    payload: GridSelectPayload,
    user: TokenPayload = Depends(get_current_user),
):
    if user.role != "admin" and user.teamId != payload.team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only select starting compound for your own team",
        )

    car = cars.get(payload.team_id)
    if car is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found in grid")

    car.compound = payload.compound
    standings = engine.build_standings(cars)
    event_data = {
        "team_id": payload.team_id,
        "compound": payload.compound,
        "standings": standings,
    }
    await broadcast_race("GRID_COMPOUND_SELECTED", event_data)
    await broadcast_team(payload.team_id, "GRID_COMPOUND_SELECTED", event_data)

    return {"status": "ok", "team_id": payload.team_id, "compound": payload.compound}


@app.post("/api/strategy/submit")
async def submit_strategy(
    submission: StrategySubmission,
    user: TokenPayload = Depends(get_current_user),
):
    # Team can only submit for own team_id; admin can submit for any
    if user.role != "admin" and user.teamId != submission.team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit strategy for your own team",
        )

    # Server-authoritative: reject late submissions (non-admin)
    if not window_open and user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Submission window is closed",
        )

    car = cars.get(submission.team_id)
    if car is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    car.action = submission.action
    if submission.action == ActionType.PIT:
        car.pit_lap = submission.pit_lap
        car.next_compound = submission.new_compound
    else:
        car.pit_lap = None
        car.next_compound = None
    car.has_submitted = True

    # Handle Team Superpower Activation
    if submission.use_power and submission.use_power != PowerType.NONE:
        if car.has_used_power and car.active_power != submission.use_power:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your team has already used its superpower in this Grand Prix",
            )
        car.active_power = submission.use_power
        car.has_used_power = True
        if submission.use_power == PowerType.HAMMERTIME:
            car.is_hammertime = True
        elif submission.use_power == PowerType.BLITZKRIEG:
            car.is_blitzkrieg = True
        elif submission.use_power == PowerType.RAINMASTER:
            car.is_rainmaster = True
        elif submission.use_power == PowerType.PLAN_E:
            car.is_plan_e = True
            car.plan_e_custom_penalty = submission.plan_e_penalty or 5.0
        elif submission.use_power == PowerType.MINISTER_OF_DEFENCE:
            if submission.power_target_team_id:
                target_car = cars.get(submission.power_target_team_id)
                if target_car is not None:
                    target_car.is_pit_blocked = True

    # Persist strategy submission to SQLite
    try:
        block_id = database.database.get_block_id(1, current_block)
        if block_id is not None:
            db_team_id = database.database.get_or_create_team(submission.team_id)
            database.database.save_strategy(
                team_id=db_team_id,
                block_id=block_id,
                action=submission.action.value,
                pit_lap=submission.pit_lap,
                new_compound=(
                    submission.new_compound.value
                    if submission.new_compound
                    else None
                )
            )
    except Exception as e:
        print(f"Error persisting strategy to SQLite: {e}")

    standings = engine.build_standings(cars)
    event_data = {
        "team_id": submission.team_id,
        "action": submission.action,
        "pit_lap": car.pit_lap,
        "next_compound": car.next_compound,
        "has_submitted": True,
        "active_power": car.active_power,
        "has_used_power": car.has_used_power,
        "standings": standings,
        "cars": {k: v.model_dump() for k, v in cars.items()},
    }
    await broadcast_race("STRATEGY_SUBMITTED", event_data)
    await broadcast_team(submission.team_id, "STRATEGY_SUBMITTED", event_data)

    return {
        "status": "ok",
        "message": "Strategy and tactical powers successfully locked for upcoming block",
        "car": car,
        "cars": {k: v.model_dump() for k, v in cars.items()},
    }


@app.post("/api/strategy/use-power")
async def team_use_power(
    payload: PowerAssignment,
    user: TokenPayload = Depends(get_current_user),
):
    """Team player can activate their own superpower (1-time use per race)"""
    if user.role != "admin" and user.teamId != payload.team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only activate superpowers for your own team",
        )
    car = cars.get(payload.team_id)
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    if car.has_used_power:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your team has already used its superpower in this Grand Prix",
        )

    car.active_power = payload.power
    car.has_used_power = True

    if payload.power == PowerType.HAMMERTIME:
        car.is_hammertime = True
    elif payload.power == PowerType.BLITZKRIEG:
        car.is_blitzkrieg = True
    elif payload.power == PowerType.RAINMASTER:
        car.is_rainmaster = True
    elif payload.power == PowerType.PLAN_E:
        car.is_plan_e = True
        car.plan_e_custom_penalty = payload.plan_e_penalty or 5.0
    elif payload.power == PowerType.MINISTER_OF_DEFENCE:
        if payload.target_team_id:
            target = cars.get(payload.target_team_id)
            if target is not None:
                target.is_pit_blocked = True

    standings = engine.build_standings(cars)
    event_data = {
        "team_id": payload.team_id,
        "power": payload.power,
        "target_team_id": payload.target_team_id,
        "has_used_power": True,
        "standings": standings,
        "cars": {k: v.model_dump() for k, v in cars.items()},
    }
    await broadcast_race("POWER_ACTIVATED", event_data)
    await broadcast_team(payload.team_id, "POWER_ACTIVATED", event_data)

    return {
        "status": "ok",
        "message": f"Superpower {payload.power} activated successfully!",
        "car": car,
        "cars": {k: v.model_dump() for k, v in cars.items()},
    }


@app.post("/api/admin/override-strategy")
async def admin_override_strategy(
    payload: AdminStrategyOverride,
    user: TokenPayload = Depends(require_admin),
):
    """Admin can manually change any team's strategy — action, pit_lap, and compound.
    This works regardless of whether the submission window is open or closed."""
    car = cars.get(payload.team_id)
    if car is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    car.action = payload.action
    if payload.action == ActionType.PIT:
        car.pit_lap = payload.pit_lap
        car.next_compound = payload.new_compound
    else:
        car.pit_lap = None
        car.next_compound = None
    car.has_submitted = True

    event_data = {
        "team_id": payload.team_id,
        "action": car.action,
        "pit_lap": car.pit_lap,
        "next_compound": car.next_compound,
        "has_submitted": True,
        "overridden_by_admin": True,
    }
    await broadcast_race("STRATEGY_OVERRIDDEN", event_data)
    await broadcast_team(payload.team_id, "STRATEGY_OVERRIDDEN", event_data)

    return {
        "status": "ok",
        "message": f"Strategy overridden for {payload.team_id}",
        "car": car,
    }


@app.post("/api/admin/delete-team")
async def delete_team(
    payload: DeleteTeamPayload,
    user: TokenPayload = Depends(require_admin),
):
    global window_open, window_expires_at, window_timer_task

    if payload.team_id not in cars:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found on grid")

    try:
        deleted = database.database.delete_team(payload.team_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not delete team: {exc}")
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found in database")

    cars.pop(payload.team_id, None)
    if not cars and window_timer_task and not window_timer_task.done():
        window_timer_task.cancel()
        window_open = False
        window_expires_at = None

    event_payload = {
        "team_id": payload.team_id,
        "current_block": current_block,
        "current_lap": current_lap,
        "track_state": track_state,
        "window_open": window_open,
        "window_expires_at": window_expires_at,
        "standings": engine.build_standings(cars),
        "cars": {key: value.model_dump() for key, value in cars.items()},
    }
    await broadcast_race("TEAM_DELETED", event_payload)
    await broadcast_all_team_feeds("TEAM_DELETED", event_payload)
    return {"status": "ok", "message": f"Team {payload.team_id} deleted", **event_payload}


@app.post("/api/admin/reset-database")
async def reset_database(user: TokenPayload = Depends(require_admin)):
    global cars, current_block, current_lap, track_state, window_open, window_expires_at, window_timer_task, is_executing_block

    if window_timer_task and not window_timer_task.done():
        window_timer_task.cancel()

    try:
        database.database.clear_database()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not reset database: {exc}")

    cars = {}
    current_block = 1
    current_lap = 0
    track_state = TrackState.DRY
    window_open = False
    window_expires_at = None
    is_executing_block = False
    event_payload = {
        "message": "Database cleared by race administrator.",
        "current_block": current_block,
        "current_lap": current_lap,
        "track_state": track_state,
        "window_open": window_open,
        "window_expires_at": window_expires_at,
        "standings": [],
        "cars": {},
    }
    await broadcast_race("DATABASE_RESET", event_payload)
    await broadcast_all_team_feeds("DATABASE_RESET", event_payload)
    return {"status": "ok", **event_payload}


@app.post("/api/admin/start-window")
async def start_window(
    payload: Optional[StartWindowPayload] = None,
    user: TokenPayload = Depends(require_admin),
):
    global window_open, window_expires_at, window_duration_seconds, window_timer_task, current_block

    duration = payload.duration_seconds if payload and payload.duration_seconds > 0 else 180
    if payload and payload.block_number is not None:
        current_block = payload.block_number

    if window_timer_task and not window_timer_task.done():
        window_timer_task.cancel()

    # Reset per-block submission flags
    for car in cars.values():
        car.has_submitted = False
        car.action = ActionType.STAY_OUT
        car.pit_lap = None
        car.next_compound = None

    window_open = True
    window_duration_seconds = duration
    window_expires_at = time.time() + duration

    window_timer_task = asyncio.create_task(_auto_lock_timer(duration))

    standings = engine.build_standings(cars)
    event_data = {
        "block_number": current_block,
        "duration_seconds": duration,
        "expires_at": window_expires_at,
        "window_expires_at": window_expires_at,
        "window_open": True,
        "standings": standings,
        "cars": {k: v.model_dump() for k, v in cars.items()},
    }
    await broadcast_race("WINDOW_START", event_data)
    await broadcast_all_team_feeds("WINDOW_START", event_data)

    return {
        "status": "ok",
        "window_open": True,
        "duration_seconds": duration,
        "expires_at": window_expires_at,
        "block_number": current_block,
        "cars": {k: v.model_dump() for k, v in cars.items()},
    }


@app.post("/api/admin/force-submit")
async def force_submit(
    payload: Optional[ForceSubmitPayload] = None,
    user: TokenPayload = Depends(require_admin),
):
    global window_open, window_expires_at, window_timer_task

    if window_timer_task and not window_timer_task.done():
        window_timer_task.cancel()

    window_open = False
    window_expires_at = None

    target_team = payload.team_id if payload else None

    if target_team:
        car = cars.get(target_team)
        if car:
            if not car.has_submitted:
                car.action = ActionType.STAY_OUT
                car.pit_lap = None
                car.next_compound = None
                car.has_submitted = True
    else:
        for car in cars.values():
            if not car.has_submitted:
                car.action = ActionType.STAY_OUT
                car.pit_lap = None
                car.next_compound = None
                car.has_submitted = True

    standings = engine.build_standings(cars)
    event_payload = {
        "message": "Submission window force closed by Race Director.",
        "window_open": False,
        "current_block": current_block,
        "standings": standings,
        "cars": {k: v.model_dump() for k, v in cars.items()},
    }
    await broadcast_race("WINDOW_LOCKED", event_payload)
    await broadcast_all_team_feeds("WINDOW_LOCKED", event_payload)

    return {
        "status": "ok",
        "message": "Force close applied successfully. Submission window locked.",
        "window_open": False,
        "standings": standings,
        "cars": {k: v.model_dump() for k, v in cars.items()},
    }


@app.post("/api/admin/track-state")
async def set_track_state(
    payload: TrackStatePayload,
    user: TokenPayload = Depends(require_admin),
):
    global track_state
    track_state = payload.track_state

    event_data = {"track_state": track_state}
    await broadcast_race("TRACK_STATE_CHANGED", event_data)
    await broadcast_all_team_feeds("TRACK_STATE_CHANGED", event_data)

    return {"status": "ok", "track_state": track_state}


@app.post("/api/admin/god-mode")
async def god_mode_override(
    override: GodModeOverride,
    user: TokenPayload = Depends(require_admin),
):
    car = cars.get(override.team_id)
    if car is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    if override.total_race_time is not None:
        car.total_race_time = override.total_race_time
    if override.tire_age is not None:
        car.tire_age = override.tire_age
    if override.compound is not None:
        car.compound = override.compound

    standings = engine.build_standings(cars)
    event_data = {
        "team_id": override.team_id,
        "car": car.model_dump(),
        "standings": standings,
    }
    await broadcast_race("GOD_MODE_OVERRIDE", event_data)
    await broadcast_team(override.team_id, "GOD_MODE_OVERRIDE", event_data)

    return {"status": "ok", "car": car, "standings": standings}


@app.post("/api/admin/execute-block")
async def execute_block_endpoint(
    payload: ExecuteBlockPayload,
    user: TokenPayload = Depends(require_admin),
):
    global is_executing_block, window_open, window_expires_at, current_lap, current_block, track_state

    if is_executing_block:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A block execution is already in progress",
        )

    # Automatically lock submission window if still open (admin can execute early)
    if window_open:
        window_open = False
        window_expires_at = None
        if window_timer_task and not window_timer_task.done():
            window_timer_task.cancel()

    # Ensure unsubmitted cars fallback to STAY_OUT
    for car in cars.values():
        if not car.has_submitted:
            car.action = ActionType.STAY_OUT
            car.pit_lap = None
            car.next_compound = None
            car.has_submitted = True

    is_executing_block = True
    track_state = payload.track_state

    try:
        # Apply powers for this block
        engine.apply_power_assignments(cars, payload)
        await broadcast_race("BLOCK_STARTED", {
            "block_number": payload.block_number,
            "start_lap": payload.start_lap,
            "end_lap": payload.end_lap,
            "track_state": payload.track_state,
        })

        broadcast_log: List[dict] = []

        # Run lap-by-lap simulation with pacing delay for live projector
        for lap_num in range(payload.start_lap, payload.end_lap + 1):
            congested_teams = engine.compute_congestion(list(cars.values()), lap_num)

            for car in cars.values():
                is_pitting = (car.action == ActionType.PIT and car.pit_lap == lap_num)
                engine.calculate_lap_time(car, payload.track_state, is_pitting, congested_teams)

            current_lap = lap_num
            standings = engine.build_standings(cars)

            lap_payload = {
                "lap_number": lap_num,
                "current_block": payload.block_number,
                "standings": standings,
                "pitlane_congestion_alert": len(congested_teams) > 0,
                "congested_teams": sorted(list(congested_teams)),
                "cars": {k: v.model_dump() for k, v in cars.items()},
            }
            broadcast_log.append(lap_payload)

            await broadcast_race("LAP_UPDATE", lap_payload)
            for t_id, car_obj in cars.items():
                await broadcast_team(t_id, "LAP_UPDATE", {
                    "lap_number": lap_num,
                    "car": car_obj.model_dump(),
                    "standings": standings,
                })

            # Pacing delay so live projector & screens visualize the race progressing
            await asyncio.sleep(0.3)

        # Reset block flags (preserves has_used_power and pit_stop_count)
        engine.reset_block_flags(cars)
        current_block = payload.block_number + 1

        # Persist completed block and updated race state asynchronously
        try:
            database.database.update_race_state(
                race_id=1,
                current_lap=current_lap,
                current_block=current_block,
                track_state=track_state.value,
                status=(
                    "COMPLETED"
                    if current_lap >= 50
                    else "RUNNING"
                )
            )
            block_id = database.database.get_block_id(1, payload.block_number)
            if block_id is not None:
                database.database.update_block_status(block_id, "COMPLETED")

            for car in cars.values():
                db_t_id = database.database.get_or_create_team(car.team_id, car.driver)
                database.database.update_team_car(
                    team_id=db_t_id,
                    compound=("INTERMEDIATE" if car.compound.value == "INTER" else car.compound.value),
                    tire_age=car.tire_age,
                    total_race_time=car.total_race_time,
                    pit_stops=car.pit_stop_count,
                    has_used_power=car.has_used_power
                )
        except Exception as e:
            print(f"Error persisting block state: {e}")


        final_standings = engine.build_standings(cars)
        block_done_event = {
            "completed_block": payload.block_number,
            "next_block": current_block,
            "current_lap": current_lap,
            "standings": final_standings,
        }
        await broadcast_race("BLOCK_COMPLETED", block_done_event)
        await broadcast_all_team_feeds("BLOCK_COMPLETED", block_done_event)

        return {
            "status": "ok",
            "message": f"Block {payload.block_number} executed successfully",
            "standings": final_standings,
            "broadcast_log": broadcast_log,
        }
    finally:
        is_executing_block = False


@app.get("/api/standings")
async def get_standings():
    try:
        db_standings = database.database.get_standings()
    except Exception:
        db_standings = []
    return {
        "current_block": current_block,
        "current_lap": current_lap,
        "track_state": track_state,
        "window_open": window_open,
        "window_expires_at": window_expires_at,
        "standings": engine.build_standings(cars),
        "db_standings": db_standings,
        "cars": {k: v.model_dump() for k, v in cars.items()},
    }


# -----------------------------------------------------------------------------
# WebSocket Feeds
# -----------------------------------------------------------------------------
@app.websocket("/ws/race")
async def websocket_race(websocket: WebSocket, token: Optional[str] = Query(None)):
    await websocket.accept()
    race_websockets.add(websocket)

    # Initial state sync
    try:
        await websocket.send_json({
            "type": "INITIAL_STATE",
            "data": {
                "current_block": current_block,
                "current_lap": current_lap,
                "track_state": track_state,
                "window_open": window_open,
                "window_expires_at": window_expires_at,
                "standings": engine.build_standings(cars),
                "cars": {k: v.model_dump() for k, v in cars.items()},
            },
        })

        while True:
            data = await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        race_websockets.discard(websocket)


@app.websocket("/ws/team/{team_id}")
async def websocket_team(websocket: WebSocket, team_id: str, token: Optional[str] = Query(None)):
    await websocket.accept()
    team_websockets[team_id].add(websocket)

    # Initial team telemetry snapshot
    try:
        # Flexible match for team_id (case and format insensitive)
        def norm(s):
            return str(s).lower().replace(" ", "_").replace("-", "_")

        matched_car = None
        for k, v in cars.items():
            if norm(k) == norm(team_id) or norm(v.driver) == norm(team_id):
                matched_car = v
                break

        await websocket.send_json({
            "type": "INITIAL_TEAM_STATE",
            "data": {
                "team_id": team_id,
                "car": matched_car.model_dump() if matched_car else None,
                "current_block": current_block,
                "current_lap": current_lap,
                "track_state": track_state,
                "window_open": window_open,
                "window_expires_at": window_expires_at,
                "standings": engine.build_standings(cars),
            },
        })

        while True:
            data = await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        team_websockets[team_id].discard(websocket)
