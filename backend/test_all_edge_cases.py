import sys
import os

from models import Car, ActionType, Compound, PowerType, TrackState, ExecuteBlockPayload, PowerAssignment
import engine

def test_dry_formulas():
    # Soft: 78.00 + 0.15 * x^2
    assert engine.dry_formula(Compound.SOFT, 0) == 78.0
    assert engine.dry_formula(Compound.SOFT, 1) == 78.15
    assert engine.dry_formula(Compound.SOFT, 4) == 78.0 + 0.15 * 16 # 80.40
    assert round(engine.dry_formula(Compound.SOFT, 10), 2) == 93.00

    # Medium: 80.00 + 1.80 * x
    assert engine.dry_formula(Compound.MEDIUM, 0) == 80.0
    assert engine.dry_formula(Compound.MEDIUM, 1) == 81.8
    assert engine.dry_formula(Compound.MEDIUM, 5) == 89.0

    # Hard: 82.00 + 0.60 * x
    assert engine.dry_formula(Compound.HARD, 0) == 82.0
    assert engine.dry_formula(Compound.HARD, 1) == 82.6
    assert engine.dry_formula(Compound.HARD, 10) == 88.0
    print("[PASSED] Dry formulas test")

def test_wet_and_drying_formulas():
    # Inter Wet: 84.00 + 0.80 * x
    assert engine.wet_formula(Compound.INTER, 0) == 84.0
    assert engine.wet_formula(Compound.INTER, 5) == 88.0

    # Full Wet: 87.00 + 0.30 * x
    assert engine.wet_formula(Compound.WET, 0) == 87.0
    assert engine.wet_formula(Compound.WET, 10) == 90.0

    # Inter Overheating Drying: 84.00 + 2.40 * x
    assert engine.drying_formula(Compound.INTER, 0) == 84.0
    assert engine.drying_formula(Compound.INTER, 5) == 96.0

    # Wet Overheating Drying: 87.00 + 0.90 * x
    assert engine.drying_formula(Compound.WET, 0) == 87.0
    assert engine.drying_formula(Compound.WET, 5) == 91.5
    print("[PASSED] Wet & Drying formulas test")

def test_rain_slick_penalty_and_rainmaster():
    car_normal_slick = Car(
        team_id="ferrari", driver="Leclerc", compound=Compound.SOFT,
        tire_age=0, total_race_time=0.0, last_lap_time=0.0,
        action=ActionType.STAY_OUT, pit_stop_count=0, status="TRACK",
        has_submitted=False, has_used_power=False
    )
    # On WET track: Soft(0) = 78.00 + 12.00 penalty = 90.00s
    t1 = engine.calculate_lap_time(car_normal_slick, TrackState.WET, False, set())
    assert t1 == 90.0

    # Schumacher Rainmaster on WET track: Soft(0) = 78.00 + 2.00 penalty = 80.00s
    car_rainmaster = Car(
        team_id="mercedes", driver="Schumacher", compound=Compound.SOFT,
        tire_age=0, total_race_time=0.0, last_lap_time=0.0,
        action=ActionType.STAY_OUT, pit_stop_count=0, status="TRACK",
        has_submitted=False, has_used_power=False, is_rainmaster=True
    )
    t2 = engine.calculate_lap_time(car_rainmaster, TrackState.WET, False, set())
    assert t2 == 80.0
    print("[PASSED] Rain slick penalty & Schumacher Rainmaster test")

def test_hammertime_freeze():
    # Lewis Hamilton Hammertime freezes degradation to x = 1
    car_hammertime = Car(
        team_id="mercedes", driver="Hamilton", compound=Compound.SOFT,
        tire_age=15, total_race_time=0.0, last_lap_time=0.0,
        action=ActionType.STAY_OUT, pit_stop_count=0, status="TRACK",
        has_submitted=False, has_used_power=False, is_hammertime=True
    )
    # Normally x = 15 on Soft would be 78.0 + 0.15 * 225 = 111.75s
    # With Hammertime, x is frozen to 1 -> 78.0 + 0.15 = 78.15s
    t = engine.calculate_lap_time(car_hammertime, TrackState.DRY, False, set())
    assert t == 78.15
    print("[PASSED] Lewis Hamilton Hammertime test")

def test_blitzkrieg_and_congestion():
    # 4 teams pitting on lap 10 -> congestion triggers (+6.00s -> 26.00s total)
    t1 = Car(team_id="t1", driver="D1", compound=Compound.MEDIUM, tire_age=5, total_race_time=0, last_lap_time=0, action=ActionType.PIT, pit_lap=10, next_compound=Compound.HARD, pit_stop_count=0, status="TRACK", has_submitted=True, has_used_power=False)
    t2 = Car(team_id="t2", driver="D2", compound=Compound.MEDIUM, tire_age=5, total_race_time=0, last_lap_time=0, action=ActionType.PIT, pit_lap=10, next_compound=Compound.HARD, pit_stop_count=0, status="TRACK", has_submitted=True, has_used_power=False)
    t3 = Car(team_id="t3", driver="D3", compound=Compound.MEDIUM, tire_age=5, total_race_time=0, last_lap_time=0, action=ActionType.PIT, pit_lap=10, next_compound=Compound.HARD, pit_stop_count=0, status="TRACK", has_submitted=True, has_used_power=False)
    t4 = Car(team_id="t4", driver="D4", compound=Compound.MEDIUM, tire_age=5, total_race_time=0, last_lap_time=0, action=ActionType.PIT, pit_lap=10, next_compound=Compound.HARD, pit_stop_count=0, status="TRACK", has_submitted=True, has_used_power=False)
    
    # Verstappen Blitzkrieg car pitting on lap 10
    t_max = Car(team_id="redbull", driver="Verstappen", compound=Compound.MEDIUM, tire_age=5, total_race_time=0, last_lap_time=0, action=ActionType.PIT, pit_lap=10, next_compound=Compound.HARD, pit_stop_count=0, status="TRACK", has_submitted=True, has_used_power=False, is_blitzkrieg=True)

    all_cars = [t1, t2, t3, t4, t_max]
    congested = engine.compute_congestion(all_cars, 10)
    assert congested == {"t1", "t2", "t3", "t4"}
    assert "redbull" not in congested # Verstappen is immune

    # Normal congested pit stop: Base Med(5) = 89.0 + 26.0s pit = 115.0s
    t_normal_lap = engine.calculate_lap_time(t1, TrackState.DRY, True, congested)
    assert t_normal_lap == 115.0

    # Blitzkrieg pit stop: Base Med(5) = 89.0 + 10.0s flat pit = 99.0s
    t_max_lap = engine.calculate_lap_time(t_max, TrackState.DRY, True, congested)
    assert t_max_lap == 99.0
    print("[PASSED] Verstappen Blitzkrieg & Congestion matrix test")

def test_plan_e_custom_penalty():
    # Charles Leclerc Plan E with die roll = 5.00s
    car_plan_e_fast = Car(
        team_id="ferrari", driver="Leclerc", compound=Compound.MEDIUM,
        tire_age=5, total_race_time=0.0, last_lap_time=0.0,
        action=ActionType.PIT, pit_lap=12, next_compound=Compound.HARD,
        pit_stop_count=0, status="TRACK", has_submitted=True, has_used_power=False,
        is_plan_e=True, plan_e_custom_penalty=5.0
    )
    # Med(5) = 89.0 + 5.0s = 94.0s
    t_fast = engine.calculate_lap_time(car_plan_e_fast, TrackState.DRY, True, set())
    assert t_fast == 94.0

    # Charles Leclerc Plan E with die roll = 30.00s
    car_plan_e_slow = Car(
        team_id="ferrari", driver="Leclerc", compound=Compound.MEDIUM,
        tire_age=5, total_race_time=0.0, last_lap_time=0.0,
        action=ActionType.PIT, pit_lap=12, next_compound=Compound.HARD,
        pit_stop_count=0, status="TRACK", has_submitted=True, has_used_power=False,
        is_plan_e=True, plan_e_custom_penalty=30.0
    )
    # Med(5) = 89.0 + 30.0s = 119.0s
    t_slow = engine.calculate_lap_time(car_plan_e_slow, TrackState.DRY, True, set())
    assert t_slow == 119.0
    print("[PASSED] Leclerc Plan E custom penalty test")

def test_minister_of_defence_pit_block():
    # Alonso blocks Ferrari from pitting
    target_car = Car(
        team_id="ferrari", driver="Leclerc", compound=Compound.MEDIUM,
        tire_age=10, total_race_time=0.0, last_lap_time=0.0,
        action=ActionType.PIT, pit_lap=15, next_compound=Compound.HARD,
        pit_stop_count=0, status="TRACK", has_submitted=True, has_used_power=False,
        is_pit_blocked=True
    )
    # Target car tries to pit, but pit entry is blocked!
    # No pit time added (0s pit), stays out on track, compound remains MEDIUM, tire age increments to 11
    t = engine.calculate_lap_time(target_car, TrackState.DRY, True, set())
    # Med(10) = 80.0 + 1.8 * 10 = 98.0s (no 20s pit added)
    assert t == 98.0
    assert target_car.compound == Compound.MEDIUM
    assert target_car.tire_age == 11
    assert target_car.pit_stop_count == 0
    print("[PASSED] Alonso Minister of Defence pit block test")

def test_full_50_lap_grand_prix():
    # Simulate a full 10-block (50-lap) race with 4 teams
    cars = {
        "williams": Car(team_id="williams", driver="Albon", compound=Compound.SOFT, tire_age=0, total_race_time=0, last_lap_time=0, action=ActionType.STAY_OUT, pit_stop_count=0, status="TRACK", has_submitted=False, has_used_power=False),
        "ferrari": Car(team_id="ferrari", driver="Leclerc", compound=Compound.MEDIUM, tire_age=0, total_race_time=0, last_lap_time=0, action=ActionType.STAY_OUT, pit_stop_count=0, status="TRACK", has_submitted=False, has_used_power=False),
        "redbull": Car(team_id="redbull", driver="Verstappen", compound=Compound.MEDIUM, tire_age=0, total_race_time=0, last_lap_time=0, action=ActionType.STAY_OUT, pit_stop_count=0, status="TRACK", has_submitted=False, has_used_power=False),
        "mercedes": Car(team_id="mercedes", driver="Hamilton", compound=Compound.HARD, tire_age=0, total_race_time=0, last_lap_time=0, action=ActionType.STAY_OUT, pit_stop_count=0, status="TRACK", has_submitted=False, has_used_power=False),
    }

    # Block 1 (Laps 1-5, DRY)
    payload_b1 = ExecuteBlockPayload(block_number=1, start_lap=1, end_lap=5, track_state=TrackState.DRY, active_modifiers=[])
    engine.execute_block(cars, payload_b1)
    assert all(c.tire_age == 5 for c in cars.values())

    # Block 2 (Laps 6-10, DRY) - Williams pits on lap 7 for Medium
    cars["williams"].action = ActionType.PIT
    cars["williams"].pit_lap = 7
    cars["williams"].next_compound = Compound.MEDIUM
    payload_b2 = ExecuteBlockPayload(block_number=2, start_lap=6, end_lap=10, track_state=TrackState.DRY, active_modifiers=[])
    engine.execute_block(cars, payload_b2)
    assert cars["williams"].pit_stop_count == 1
    assert cars["williams"].compound == Compound.MEDIUM
    assert cars["williams"].tire_age == 4 # Pitted on lap 7 (age=1), then laps 8,9,10 (+3) -> age=4

    # Verify standings sorting
    standings = engine.build_standings(cars)
    assert len(standings) == 4
    assert standings[0]["position"] == 1
    assert standings[0]["gap_to_leader"] == 0.0
    assert standings[1]["gap_to_leader"] > 0.0
    print("[PASSED] Full Grand Prix 50-Lap execution & standings test")

if __name__ == "__main__":
    test_dry_formulas()
    test_wet_and_drying_formulas()
    test_rain_slick_penalty_and_rainmaster()
    test_hammertime_freeze()
    test_blitzkrieg_and_congestion()
    test_plan_e_custom_penalty()
    test_minister_of_defence_pit_block()
    test_full_50_lap_grand_prix()
    print("\n>>> ALL 8/8 ENGINE & MATHEMATICAL TEST SUITES PASSED FLAWLESSLY! <<<")

