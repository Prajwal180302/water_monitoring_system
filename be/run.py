import os

from app import create_app
from app.config import Config
from app.extensions import db
from app.models.user_model import User
from app.services.user_service import assign_names_to_existing_users, ensure_application_columns

app = create_app()

with app.app_context():
    # Production schema changes are run explicitly with Flask-Migrate before
    # deploying a new backend image. Development keeps the easy local startup.
    if not Config.IS_PRODUCTION:
        db.create_all()
        ensure_application_columns()
        assign_names_to_existing_users()

if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", debug=debug_mode, port=5001)
