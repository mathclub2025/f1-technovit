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

class TeamMember(BaseModel):
    name: str
    email: str

class TeamRegistration(BaseModel):
    email: str
    teamId: str
    password: str
    members: list[TeamMember]


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
        new_id = database.queries.create_team_with_members(
            registration_number=payload.teamId,
            email=payload.email,
            password=payload.password,
            team_name=payload.teamId,
            members=payload.members,
        )
        
        return {
            "status": "ok",
            "message": "Team member registered successfully",
            "id": new_id,
        }
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or registration number already exists",
        )

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


    event_data = {
        "team_id": submission.team_id,
        "action": submission.action,
        "pit_lap": car.pit_lap,
        "next_compound": car.next_compound,
        "has_submitted": True,
    }
    await broadcast_race("STRATEGY_SUBMITTED", event_data)
    await broadcast_team(submission.team_id, "STRATEGY_SUBMITTED", event_data)

    return {
        "status": "ok",
        "message": "Strategy successfully locked for upcoming block",
        "car": car,
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

    event_data = {
        "block_number": current_block,
        "duration_seconds": duration,
        "expires_at": window_expires_at,
        "window_open": True,
    }
    await broadcast_race("WINDOW_START", event_data)
    await broadcast_all_team_feeds("WINDOW_START", event_data)

    return {
        "status": "ok",
        "window_open": True,
        "duration_seconds": duration,
        "expires_at": window_expires_at,
        "block_number": current_block,
    }


@app.post("/api/admin/force-submit")
async def force_submit(
    payload: Optional[ForceSubmitPayload] = None,
    user: TokenPayload = Depends(require_admin),
):
    target_team = payload.team_id if payload else None

    if target_team:
        car = cars.get(target_team)
        if car:
            car.action = ActionType.STAY_OUT
            car.pit_lap = None
            car.next_compound = None
            car.has_submitted = True
            await broadcast_race("FORCE_SUBMITTED", {"team_id": target_team})
            await broadcast_team(target_team, "FORCE_SUBMITTED", {"team_id": target_team})
    else:
        for car in cars.values():
            if not car.has_submitted:
                car.action = ActionType.STAY_OUT
                car.pit_lap = None
                car.next_compound = None
                car.has_submitted = True
        await broadcast_race("FORCE_SUBMITTED_ALL", {})
        await broadcast_all_team_feeds("FORCE_SUBMITTED_ALL", {})

    return {"status": "ok", "message": "Force submit applied successfully"}


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
            # Persist lap results to SQLite safely
            try:
                database.database.update_race_state(
                    race_id=1,
                    current_lap=current_lap,
                    current_block=payload.block_number,
                    track_state=payload.track_state.value,
                    status="RUNNING"
                )

                block_id = database.database.get_block_id(
                    1,
                    payload.block_number
                )

                if block_id is not None:
                    for position, car in enumerate(
                        sorted(
                            cars.values(),
                            key=lambda c: c.total_race_time
                        ),
                        start=1
                    ):
                        db_t_id = database.database.get_or_create_team(car.team_id, car.driver)
                        database.database.save_car_lap_result(
                            team_id=db_t_id,
                            block_id=block_id,
                            lap_number=lap_num,
                            lap_time=car.last_lap_time,
                            cumulative_time=car.total_race_time,
                            position=position,
                            compound=(
                                "INTERMEDIATE"
                                if car.compound.value == "INTER"
                                else car.compound.value
                            ),
                            tire_age=car.tire_age,
                            pit_stop=int(
                                car.action == ActionType.PIT
                                and car.pit_lap == lap_num
                            ),
                            pit_penalty=0
                        )

                        database.database.update_team_car(
                            team_id=db_t_id,
                            compound=(
                                "INTERMEDIATE"
                                if car.compound.value == "INTER"
                                else car.compound.value
                            ),
                            tire_age=car.tire_age,
                            total_race_time=car.total_race_time,
                            pit_stops=car.pit_stop_count,
                            has_used_power=car.has_used_power
                        )
            except Exception as e:
                print(f"Error persisting lap results to SQLite: {e}")

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
            await asyncio.sleep(0.4)

        # Reset block flags (preserves has_used_power and pit_stop_count)
        engine.reset_block_flags(cars)
        current_block = payload.block_number + 1
        # Persist completed block and updated race state
        try:
            block_id = database.database.get_block_id(
                1,
                payload.block_number
            )

            if block_id is not None:
                database.database.update_block_status(
                    block_id,
                    "COMPLETED"
                )

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
        except Exception as e:
            print(f"Error updating race state in SQLite: {e}")


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
async def get_standings(user: TokenPayload = Depends(get_current_user)):
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
async def websocket_race(websocket: WebSocket, token: str = Query(...)):
    try:
        user = await get_current_user_ws(websocket, token)
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

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
            # Keep-alive loop and receiving client pings
            data = await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        race_websockets.discard(websocket)


@app.websocket("/ws/team/{team_id}")
async def websocket_team(websocket: WebSocket, team_id: str, token: str = Query(...)):
    try:
        user = await get_current_user_ws(websocket, token)
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Team authorization check — must match own team or be admin
    if user.role != "admin" and user.teamId != team_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    team_websockets[team_id].add(websocket)

    # Initial team telemetry snapshot
    try:
        car = cars.get(team_id)
        await websocket.send_json({
            "type": "INITIAL_TEAM_STATE",
            "data": {
                "team_id": team_id,
                "car": car.model_dump() if car else None,
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
