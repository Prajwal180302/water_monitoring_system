# How to Run the Project

## Requirements

Install Docker Desktop or Docker Engine. Confirm it works:

```bash
docker --version
docker compose version
```

## First-time setup

### 1. Open the project folder

```bash
cd /home/prajwalshingote/water_monitoring_system
```

### 2. Create `.env`

```bash
cp .env.example .env
```

Open `.env` and replace the example secret and PostgreSQL password values. For local development keep:

```env
APP_ENV=development
USE_GPU=false
CORS_ORIGINS=http://localhost:3000
PASSWORD_RESET_URL=http://localhost:3000/reset-password
PASSWORD_RESET_CONSOLE=true
POSTGRES_DB=water_monitoring
POSTGRES_USER=water_monitoring
POSTGRES_PASSWORD=your-long-password
```

### 3. Build and start services

```bash
docker compose build
docker compose up -d
```

Check all services:

```bash
docker compose ps
```

Open the application:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:5002/api/health`

## Use the application

1. Open `http://localhost:3000`.
2. Create an account. Enter the real device ID if you have one.
3. Log in.
4. If it is a demo account with no real sensor, generate sample data.

### Generate sample readings

Replace the email with the exact signup email:

```bash
docker compose exec backend python scripts/generate_sensor_data.py --email your-email@example.com --rows 1000000
```

Wait for `Done`, then refresh Dashboard, Alerts, and Reports.

For a faster test, use fewer rows:

```bash
docker compose exec backend python scripts/generate_sensor_data.py --email your-email@example.com --rows 50000
```

## Password-reset testing

With `PASSWORD_RESET_CONSOLE=true`, reset links are printed in logs instead of emailed:

```bash
docker compose logs --tail=100 backend
```

Request Forgot Password once, copy the newest local reset URL from the logs, and open it in the browser.

To send real email, configure SMTP values in `.env`, set `PASSWORD_RESET_CONSOLE=false`, then restart the backend:

```bash
docker compose up -d --force-recreate backend
```

## Database migration

Run after pulling a version that changes database structure:

```bash
docker compose exec backend flask --app manage db upgrade
```

## Useful commands

```bash
# Live backend logs
docker compose logs -f backend

# Stop containers (keeps PostgreSQL data)
docker compose down

# Start again
docker compose up -d

# Rebuild after code/dependency changes
docker compose build
docker compose up -d

# Run backend tests
docker compose run --rm --no-deps backend pytest -q
```

## Important safety notes

- Never upload `.env` to GitHub.
- Do not run `docker compose down -v` unless you want to delete PostgreSQL data.
- Keep a backup before making major database changes.
