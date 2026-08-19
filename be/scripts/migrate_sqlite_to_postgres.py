"""Copy the existing SQLite application data into the configured PostgreSQL database.

Run this once after the PostgreSQL Compose service is healthy:
    docker compose run --rm --no-deps -v "$PWD/be/instance:/source:ro" backend \
      python scripts/migrate_sqlite_to_postgres.py --source /source/database.db

The source SQLite file is read-only and is never changed. Existing PostgreSQL
rows with the same primary-key ID are skipped, so re-running is safe.
"""

from __future__ import annotations

import argparse
import sqlite3
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import text

from app import create_app
from app.extensions import db
from app.services.user_service import ensure_application_columns


TABLES: dict[str, list[str]] = {
    "users": ["id", "name", "email", "password", "device_id", "phone", "language"],
    "user_settings": [
        "id", "user_id", "pH_min", "pH_max", "tds", "turbidity", "temperature_min",
        "temperature_max", "conductivity", "calibration_ph", "calibration_tds",
        "calibration_turbidity", "calibration_conductivity", "sampling_interval",
        "device_status", "created_at", "updated_at",
    ],
    "sensor_readings": [
        "id", "device_id", "pH", "tds", "turbidity", "conductivity", "temperature",
        "timestamp", "created_at",
    ],
}
BATCH_SIZE = 10_000


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Copy application data from SQLite to PostgreSQL.")
    parser.add_argument(
        "--source",
        type=Path,
        default=BACKEND_DIR / "instance" / "database.db",
        help="Path to the source SQLite database.",
    )
    return parser.parse_args()


def quoted_columns(columns: list[str]) -> str:
    return ", ".join(f'"{column}"' for column in columns)


def copy_table(source: sqlite3.Connection, table: str, expected_columns: list[str]) -> int:
    source_columns = {
        row["name"] for row in source.execute(f'PRAGMA table_info("{table}")').fetchall()
    }
    columns = [column for column in expected_columns if column in source_columns]
    if not columns:
        print(f"{table}: skipped (not present in SQLite source)")
        return 0

    quoted = quoted_columns(columns)
    placeholders = ", ".join(f":{column}" for column in columns)
    insert = text(
        f'INSERT INTO "{table}" ({quoted}) VALUES ({placeholders}) '
        "ON CONFLICT (id) DO NOTHING"
    )
    cursor = source.execute(f'SELECT {quoted} FROM "{table}"')
    copied = 0

    while rows := cursor.fetchmany(BATCH_SIZE):
        db.session.execute(insert, [dict(row) for row in rows])
        db.session.commit()
        copied += len(rows)
        print(f"{table}: {copied:,} rows copied", flush=True)

    return copied


def reset_sequence(table: str) -> None:
    db.session.execute(text(
        f'SELECT setval(pg_get_serial_sequence(:table_name, \'id\'), '
        f'COALESCE((SELECT MAX(id) FROM "{table}"), 1), true)'
    ), {"table_name": table})
    db.session.commit()


def main() -> None:
    args = parse_args()
    if not args.source.is_file():
        raise SystemExit(f"SQLite source database not found: {args.source}")

    app = create_app()
    with app.app_context():
        if db.engine.dialect.name != "postgresql":
            raise SystemExit("DATABASE_URL must point to PostgreSQL before running this migration.")

        db.create_all()
        ensure_application_columns()
        with sqlite3.connect(f"file:{args.source}?mode=ro", uri=True) as source:
            source.row_factory = sqlite3.Row
            for table, columns in TABLES.items():
                exists = source.execute(
                    "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?", (table,)
                ).fetchone()
                if exists:
                    copy_table(source, table, columns)
                    reset_sequence(table)
        print("Migration complete. The SQLite source was not modified.")


if __name__ == "__main__":
    main()
