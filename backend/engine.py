from typing import Dict, List, Set, Optional
from collections import Counter
from models import Car, PowerType, TrackState, Compound, ExecuteBlockPayload, ActionType


def dry_formula(compound: Compound, x: int) -> float:
    if compound == Compound.SOFT:
        return 78.0 + 0.15 * (x ** 2)
    if compound == Compound.MEDIUM:
        return 80.0 + 1.80 * x
    if compound == Compound.HARD:
        return 82.0 + 0.60 * x
    raise ValueError(f"Invalid dry compound: {compound}")


def wet_formula(compound: Compound, x: int) -> float:
    if compound == Compound.INTER:
        return 84.0 + 0.80 * x
    if compound == Compound.WET:
        return 87.0 + 0.30 * x
    raise ValueError(f"Invalid wet compound: {compound}")


def drying_formula(compound: Compound, x: int) -> float:
    if compound == Compound.INTER:
        return 84.0 + 2.40 * x
    if compound == Compound.WET:
        return 87.0 + 0.90 * x
    raise ValueError(f"Invalid drying compound: {compound}")


def compute_congestion(cars: List[Car], lap_num: int) -> Set[str]:
    pitting = [
        c.team_id for c in cars
        if c.action == ActionType.PIT
        and c.pit_lap == lap_num
        and not c.is_blitzkrieg
        and not c.is_pit_blocked
    ]
    if len(pitting) >= 4:
        return set(pitting)
    return set()


def calculate_lap_time(
    car: Car,
    track_state: TrackState,
    is_pitting_this_lap: bool,
    congested_teams: Set[str]
) -> float:
    
    x = 1 if car.is_hammertime else max(car.tire_age, 0)

    if track_state == TrackState.DRY:
        if car.compound in (Compound.SOFT, Compound.MEDIUM, Compound.HARD):
            base_lap = dry_formula(car.compound, x)
        else:
    
            base_lap = drying_formula(car.compound, x)

    elif track_state == TrackState.WET:
        if car.compound in (Compound.INTER, Compound.WET):
            base_lap = wet_formula(car.compound, x)
        else:
    
            slick_time = dry_formula(car.compound, x)
            wet_penalty = 2.0 if car.is_rainmaster else 12.0
            base_lap = slick_time + wet_penalty

    elif track_state == TrackState.DRYING:
        if car.compound in (Compound.INTER, Compound.WET):
    
            base_lap = drying_formula(car.compound, x)
        else:
    
            base_lap = dry_formula(car.compound, x)
    else:
        raise ValueError(f"Unknown track state: {track_state}")

    
    is_actually_pitting = is_pitting_this_lap and not car.is_pit_blocked
    pit_time = 0.0

    if is_actually_pitting:
        if car.is_blitzkrieg:
            
            pit_time = 10.0
        elif car.is_plan_e and car.plan_e_custom_penalty is not None:
            
            pit_time = car.plan_e_custom_penalty
        else:
            
            pit_time = 26.0 if car.team_id in congested_teams else 20.0
        car.status = "IN_PITLANE"
    else:
        car.status = "TRACK"

    lap_time = base_lap + pit_time
    car.last_lap_time = lap_time
    car.total_race_time += lap_time

    
    if is_actually_pitting:
        
        car.tire_age = 1
        car.pit_stop_count += 1
        if car.next_compound is not None:
            car.compound = car.next_compound
            car.next_compound = None
    else:
        car.tire_age += 1

    return lap_time


def apply_power_assignments(cars: Dict[str, Car], payload: ExecuteBlockPayload) -> None:

    for mod in payload.active_modifiers:
        car = cars.get(mod.team_id)
        if car is None or car.has_used_power:
            continue

        car.active_power = mod.power
        car.has_used_power = True

        if mod.power == PowerType.HAMMERTIME:
            car.is_hammertime = True
        elif mod.power == PowerType.BLITZKRIEG:
            car.is_blitzkrieg = True
        elif mod.power == PowerType.RAINMASTER:
            car.is_rainmaster = True
        elif mod.power == PowerType.PLAN_E:
            car.is_plan_e = True
            car.plan_e_custom_penalty = mod.plan_e_penalty
        elif mod.power == PowerType.MINISTER_OF_DEFENCE:
            
            if mod.target_team_id:
                target = cars.get(mod.target_team_id)
                if target is not None:
                    target.is_pit_blocked = True


def reset_block_flags(cars: Dict[str, Car]) -> None:
    
    for car in cars.values():
        car.active_power = PowerType.NONE
        car.is_hammertime = False
        car.is_blitzkrieg = False
        car.is_rainmaster = False
        car.is_plan_e = False
        car.is_pit_blocked = False
        car.plan_e_custom_penalty = None
        car.has_submitted = False
        car.pit_lap = None
        car.action = ActionType.STAY_OUT


def build_standings(cars: Dict[str, Car]) -> List[dict]:
    ordered = sorted(cars.values(), key=lambda c: c.total_race_time)
    leader_time = ordered[0].total_race_time if ordered else 0.0

    standings = []
    for idx, car in enumerate(ordered, start=1):
        standings.append({
            "position": idx,
            "team_id": car.team_id,
            "driver": car.driver,
            "compound": car.compound,
            "tire_age": car.tire_age,
            "last_lap_time": round(car.last_lap_time, 3),
            "total_race_time": round(car.total_race_time, 3),
            "interval_to_leader": round(car.total_race_time - leader_time, 3),
            "pit_stop_count": car.pit_stop_count,
            "status": car.status,
            "active_power": car.active_power if car.active_power != PowerType.NONE else None,
        })
    return standings


def execute_block(cars: Dict[str, Car], payload: ExecuteBlockPayload) -> List[dict]:
    
    apply_power_assignments(cars, payload)
    broadcast_log: List[dict] = []

    for lap_num in range(payload.start_lap, payload.end_lap + 1):
        congested_teams = compute_congestion(list(cars.values()), lap_num)

        for car in cars.values():
            is_pitting_this_lap = (
                car.action == ActionType.PIT and car.pit_lap == lap_num
            )
            calculate_lap_time(car, payload.track_state, is_pitting_this_lap, congested_teams)

        standings = build_standings(cars)
        broadcast_log.append({
            "lap_number": lap_num,
            "standings": standings,
            "pitlane_congestion_alert": len(congested_teams) > 0,
            "congested_teams": sorted(list(congested_teams))
        })

    reset_block_flags(cars)
    return broadcast_log
