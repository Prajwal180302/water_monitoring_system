# File Guide: What Each Important File Does

## Root files

| File | Why it exists |
|---|---|
| `.env` | Your private local settings and passwords. Never commit it. |
| `.env.example` | Safe template that teammates copy to create `.env`. |
| `docker-compose.yml` | Starts frontend, backend, PostgreSQL, and Redis together. |
| `01_APPLICATION_FLOW.md` | Explains the full application flow. |
| `02_FILE_GUIDE.md` | Explains project files. |
| `03_RUN_GUIDE.md` | Explains how to run the project. |

## Backend: `be/`

| File or folder | Why it exists |
|---|---|
| `Dockerfile` | Builds the CPU-only Python backend container. |
| `.dockerignore` | Prevents local databases, cache, and unnecessary files entering the image. |
| `requirements.txt` | Lists Python packages: Flask, PostgreSQL driver, TensorFlow, Redis client, and testing tools. |
| `run.py` | Starts the Flask application and creates local development tables. |
| `manage.py` | Flask command entry point for database migrations. |
| `alembic.ini` | Alembic/Flask-Migrate configuration. |

### Backend application: `be/app/`

| File or folder | Why it exists |
|---|---|
| `__init__.py` | Creates Flask app, CORS, security headers, health checks, routes, database, JWT, Redis rate limiting, and migrations. |
| `config.py` | Reads `.env`; configures database, JWT, CORS, SMTP, Redis, and production checks. |
| `extensions.py` | Creates shared SQLAlchemy, JWT, Flask-Limiter, and Flask-Migrate objects. |
| `models/user_model.py` | Defines the users database table. |
| `models/sensor_model.py` | Defines the sensor-readings database table. |
| `models/settings_model.py` | Defines per-user water-threshold and calibration settings. |
| `models/password_reset_model.py` | Defines reset-token records with expiry and used status. |
| `routes/auth_routes.py` | Signup, login, profile, and password-reset API routes. |
| `routes/data_routes.py` | Latest sensor-data API route. |
| `routes/alert_routes.py` | Current/predicted water-alert API route. |
| `routes/prediction_routes.py` | LSTM next-reading prediction API route. |
| `routes/report_routes.py` | Report statistics API route. |
| `routes/settings_routes.py` | User threshold and profile-settings API routes. |
| `services/auth_service.py` | Password hashing and login-token logic. |
| `services/password_reset_service.py` | Creates reset tokens and sends reset emails. |
| `services/threshold_service.py` | Reads/creates settings and converts them into alert limits. |
| `services/user_service.py` | User profile updates, names, and local schema helpers. |
| `models/lstm_best_water_model.keras` | Trained LSTM model used by predictions and alerts. |

### Backend tools

| File or folder | Why it exists |
|---|---|
| `scripts/generate_sensor_data.py` | Generates demo sensor readings for one account/device. |
| `scripts/migrate_sqlite_to_postgres.py` | One-time copy from old SQLite database to PostgreSQL. |
| `scripts/retrain_lstm_model.py` | Retrains the LSTM model from historic readings. |
| `scripts/retrain_potability_model.py` | Retrains the potability model when a labelled dataset exists. |
| `scripts/backfill_user_names.py` | Adds names to old user records. |
| `migrations/` | Database version history; run with `flask --app manage db upgrade`. |
| `tests/test_health.py` | Simple automated test for the health endpoint. |

## Frontend: `fe/`

| File or folder | Why it exists |
|---|---|
| `Dockerfile` | Builds React and serves it with Nginx. |
| `package.json` | Lists frontend dependencies and scripts. |
| `vite.config.ts` | Vite development/build configuration. |
| `tailwind.config.js` | Tailwind CSS configuration. |
| `nginx.conf` | Serves the built React single-page application. |
| `src/main.tsx` | React application entry point. |
| `src/App.tsx` | Defines all frontend routes and protected pages. |
| `src/api/axiosInstance.ts` | Creates API client and automatically attaches JWT token. |
| `src/pages/Login.tsx` | Login and forgot-password request page. |
| `src/pages/Signup.tsx` | New-user registration page. |
| `src/pages/ResetPassword.tsx` | Page opened from a password-reset email link. |
| `src/pages/Dashboard.tsx` | Shows current sensor readings and dashboard charts. |
| `src/pages/Alerts.tsx` | Shows, searches, filters, and exports alerts. |
| `src/pages/Prediction.tsx` | Shows LSTM prediction results. |
| `src/pages/Reports.tsx` | Shows historical water-quality reports. |
| `src/pages/Settings.tsx` | Lets a user edit profile and sensor thresholds. |
| `src/components/Layout.tsx` | Shared page layout. |
| `src/components/PageNavigation.tsx` | Sidebar/top navigation links. |
| `src/context/ThemeContext.tsx` | Light/dark theme state. |
| `src/context/AppSettingsContext.tsx` | Shared application settings state. |
| `src/utils/appSettings.ts` | Browser local-storage helpers. |
| `src/utils/translations.ts` | English, Hindi, and Marathi text. |
| `src/index.css`, `src/App.css` | Global styles. |
