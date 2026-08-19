"""Create the production schema."""
from alembic import op
import sqlalchemy as sa

revision = "20260820_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "users" not in tables:
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(100), nullable=True, unique=True),
            sa.Column("email", sa.String(100), nullable=False, unique=True),
            sa.Column("password", sa.String(255), nullable=False),
            sa.Column("device_id", sa.String(50), nullable=False),
            sa.Column("phone", sa.String(20)),
            sa.Column("language", sa.String(10)),
        )
    inspector = sa.inspect(bind)
    if "sensor_readings" not in inspector.get_table_names():
        op.create_table(
            "sensor_readings",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("device_id", sa.String(50)),
            sa.Column("pH", sa.Float()), sa.Column("tds", sa.Float()),
            sa.Column("turbidity", sa.Float()), sa.Column("conductivity", sa.Float()),
            sa.Column("temperature", sa.Float()), sa.Column("timestamp", sa.DateTime()),
            sa.Column("created_at", sa.DateTime()),
        )
    if "user_settings" not in inspector.get_table_names():
        op.create_table(
            "user_settings",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, unique=True),
            sa.Column("pH_min", sa.Float()), sa.Column("pH_max", sa.Float()), sa.Column("tds", sa.Float()),
            sa.Column("turbidity", sa.Float()), sa.Column("temperature_min", sa.Float()),
            sa.Column("temperature_max", sa.Float()), sa.Column("conductivity", sa.Float()),
            sa.Column("calibration_ph", sa.Float()), sa.Column("calibration_tds", sa.Float()),
            sa.Column("calibration_turbidity", sa.Float()), sa.Column("calibration_conductivity", sa.Float()),
            sa.Column("sampling_interval", sa.Integer()), sa.Column("device_status", sa.String(20)),
            sa.Column("created_at", sa.DateTime()), sa.Column("updated_at", sa.DateTime()),
        )
    if "password_reset_tokens" not in inspector.get_table_names():
        op.create_table(
            "password_reset_tokens",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
            sa.Column("expires_at", sa.DateTime(), nullable=False), sa.Column("used_at", sa.DateTime()),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_password_reset_tokens_user_id", "password_reset_tokens", ["user_id"])
        op.create_index("ix_password_reset_tokens_expires_at", "password_reset_tokens", ["expires_at"])
    op.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_sensor_readings_device_timestamp "
        "ON sensor_readings (device_id, timestamp)"
    ))


def downgrade():
    # Do not remove application data automatically during a downgrade.
    pass
