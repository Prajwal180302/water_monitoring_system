"""Seed realistic-looking water-monitoring readings for the dashboard.

This is development/demo data, not a substitute for readings from a physical
sensor.  It creates smooth daily and seasonal variation, random measurement
noise, and occasional contamination events.  The final readings for each
selected device are unsafe deliberately, so the Alerts page has something to
display immediately after seeding.

Examples:
    python scripts/generate_sensor_data.py
    python scripts/generate_sensor_data.py --email demo@example.com --rows 1000000
    python scripts/generate_sensor_data.py --device-id WMS-001 --rows 50000
"""

from __future__ import annotations

import argparse
import math
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Allow `python scripts/generate_sensor_data.py` from the backend directory.
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import create_app
from app.extensions import db
from app.models.user_model import User


DEFAULT_ROWS = 1_000_000
BATCH_SIZE = 10_000


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate water-sensor demo data.")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--email", help="Seed only the device belonging to this user.")
    group.add_argument("--device-id", help="Seed only this device.")
    parser.add_argument("--rows", type=int, default=DEFAULT_ROWS, help="Total readings to add (default: 1,000,000).")
    parser.add_argument("--interval-seconds", type=int, default=60, help="Time between readings (default: 60).")
    parser.add_argument("--seed", type=int, default=20260819, help="Random seed for repeatable data.")
    return parser.parse_args()


def selected_devices(args: argparse.Namespace) -> list[str]:
    query = User.query
    if args.email:
        query = query.filter_by(email=args.email)
    elif args.device_id:
        query = query.filter_by(device_id=args.device_id)

    devices = sorted({user.device_id for user in query.all() if user.device_id})
    if not devices:
        target = args.email or args.device_id or "registered users"
        raise SystemExit(f"No device found for {target}. Create an account first, or pass a valid --device-id.")
    return devices


def normal_reading(index: int, total: int, timestamp: datetime, rng: random.Random) -> dict[str, float]:
    """Return a correlated, mostly safe observation with daily/seasonal drift."""
    daily = math.sin((timestamp.hour * 3600 + timestamp.minute * 60) / 86_400 * 2 * math.pi)
    seasonal = math.sin(index / max(total, 1) * 10 * math.pi)
    # Small, short contamination episodes make historical charts believable.
    event = 1 if (index // 9000) % 17 == 8 and index % 9000 < 80 else 0
    return {
        "temperature": round(25.5 + 3.2 * daily + 1.2 * seasonal + rng.gauss(0, 0.35), 2),
        "pH": round(7.15 + 0.18 * daily + 0.10 * seasonal - 0.55 * event + rng.gauss(0, 0.045), 2),
        "tds": round(285 + 16 * seasonal + 7 * daily + 135 * event + rng.gauss(0, 5), 2),
        "turbidity": round(max(0.05, 1.05 + 0.18 * daily + 3.8 * event + rng.gauss(0, 0.12)), 2),
        "conductivity": round(510 + 23 * seasonal + 9 * daily + 165 * event + rng.gauss(0, 7), 2),
    }


def critical_reading(position: int) -> dict[str, float]:
    """A short, escalating contamination event that guarantees current alerts."""
    severity = position / 11
    return {
        "temperature": round(29.5 + severity * 4.0, 2),
        "pH": round(6.45 - severity * 0.65, 2),
        "tds": round(470 + severity * 220, 2),
        "turbidity": round(3.8 + severity * 5.5, 2),
        "conductivity": round(760 + severity * 310, 2),
    }


def seed_device(device_id: str, rows: int, interval: int, start: datetime, rng: random.Random) -> None:
    """Insert readings in batches to keep memory use bounded."""
    rows = max(rows, 12)
    for batch_start in range(0, rows, BATCH_SIZE):
        batch_end = min(batch_start + BATCH_SIZE, rows)
        mappings = []
        for index in range(batch_start, batch_end):
            timestamp = start + timedelta(seconds=index * interval)
            values = critical_reading(index - (rows - 12)) if index >= rows - 12 else normal_reading(index, rows, timestamp, rng)
            mappings.append({"device_id": device_id, "timestamp": timestamp, "created_at": timestamp, **values})
        db.session.execute(db.text("""
            INSERT INTO sensor_readings (device_id, temperature, "pH", tds, turbidity, conductivity, timestamp, created_at)
            VALUES (:device_id, :temperature, :pH, :tds, :turbidity, :conductivity, :timestamp, :created_at)
        """), mappings)
        db.session.commit()
        print(f"{device_id}: {batch_end:,}/{rows:,} readings inserted", flush=True)


def main() -> None:
    args = parse_args()
    if args.rows < 12 or args.interval_seconds < 1:
        raise SystemExit("--rows must be at least 12 and --interval-seconds must be positive.")

    rng = random.Random(args.seed)
    app = create_app()
    with app.app_context():
        db.create_all()
        db.session.execute(db.text(
            "CREATE INDEX IF NOT EXISTS ix_sensor_readings_device_timestamp "
            "ON sensor_readings (device_id, timestamp)"
        ))
        db.session.commit()

        devices = selected_devices(args)
        base_rows, remainder = divmod(args.rows, len(devices))
        end = datetime.utcnow().replace(microsecond=0)
        print(f"Adding {args.rows:,} readings across {len(devices)} device(s).")
        for position, device_id in enumerate(devices):
            device_rows = base_rows + (1 if position < remainder else 0)
            start = end - timedelta(seconds=(device_rows - 1) * args.interval_seconds)
            seed_device(device_id, device_rows, args.interval_seconds, start, rng)
        print("Done. Refresh Dashboard and Alerts; the latest reading is intentionally unsafe.")


if __name__ == "__main__":
    main()
