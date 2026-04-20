from __future__ import annotations

from app.models.settings_model import UserSettings


def get_or_create_user_settings(user_id: int) -> UserSettings:
    settings = UserSettings.query.filter_by(user_id=user_id).first()
    if not settings:
        settings = UserSettings(user_id=user_id)
    return settings


def get_threshold_ranges(settings: UserSettings) -> dict[str, tuple[float, float]]:
    return {
        "pH": (settings.pH_min, settings.pH_max),
        "TDS": (0.0, settings.tds),
        "Turbidity": (0.0, settings.turbidity),
        "Conductivity": (0.0, settings.conductivity),
        "Temperature": (settings.temperature_min, settings.temperature_max),
    }
