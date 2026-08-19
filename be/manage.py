"""Flask CLI entry point for database migrations.

Use: flask --app manage db upgrade
"""
from app import create_app

app = create_app()
