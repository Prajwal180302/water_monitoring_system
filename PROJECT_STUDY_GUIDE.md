# Project Study Guide

Use this file as a paste-ready context note for ChatGPT or as your own project revision sheet.

## Paste This To ChatGPT

```text
I have a full-stack Water Monitoring System project. Please explain it to me from scratch like I am learning real-world software architecture. I want you to explain:

1. what this project does overall
2. frontend concepts used
3. backend concepts used
4. database concepts used
5. ML/AI concepts used
6. authentication flow
7. API flow
8. data flow
9. page-by-page workflow
10. end-to-end system workflow
11. deployment/dev workflow
12. why each concept is used
13. how each file/folder fits into the project
14. all important terms in simple language first, then in technical language

Here is the project concept inventory:

PROJECT NAME / DOMAIN
- IoT Water Monitoring System
- Purpose: monitor water quality sensor readings, show live dashboard, generate alerts, predict next readings with ML, create reports, and let users manage settings.

HIGH-LEVEL ARCHITECTURE
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Flask (Python)
- Database: SQLite using SQLAlchemy ORM
- Authentication: JWT
- ML: LSTM model for next-reading prediction, Random Forest model retraining script for potability
- Charts: Recharts
- Deployment: Docker + Docker Compose
- Reverse/static serving: Nginx for frontend, Gunicorn for backend

MAIN DIRECTORY STRUCTURE
- app/
  - __init__.py
  - config.py
  - extensions.py
  - models/
  - routes/
  - services/
- React_UI/react_ui/
  - src/
    - pages/
    - components/
    - context/
    - api/
    - utils/
- scripts/
- models/
- instance/
- data/
- migrations/
- Dockerfile
- docker-compose.yml
- run.py
- requirements.txt

WHAT THE PROJECT DOES FUNCTIONALLY
- User signs up and logs in
- User account is tied to a device_id
- Backend fetches sensor readings for that user’s device
- Dashboard shows latest water sensor readings
- Alerts page shows unsafe current values, future predicted unsafe values, and anomalies
- Prediction page forecasts next reading using LSTM model
- Reports page shows historical analysis, averages, min/max, safety percentage, violations
- Settings page lets user manage profile, thresholds, calibration, sampling interval, and device status

FRONTEND CONCEPTS USED
- React SPA (Single Page Application)
- React Router for page routing
- Protected routes using token from localStorage
- Axios instance with interceptors
- Global state using React Context
- Theme context for dark mode
- App settings context for local app/user settings
- Local storage persistence
- Polling with setInterval for near-real-time updates
- Recharts for graphs/charts
- Component-based UI
- Page-level feature separation
- Utility/helper modules
- Internationalization-like translation object (manual translations for en/hi/mr)
- Responsive UI with Tailwind CSS
- Lucide icons
- Vite build system

FRONTEND FILE/CONCEPT MAPPING
- src/main.tsx
  - App bootstrap
  - BrowserRouter setup
- src/App.tsx
  - Main route definitions
  - Public vs protected pages
- src/api/axiosInstance.ts
  - Central API client
  - Adds JWT token to request headers
  - Handles 401 auto logout/redirect
- src/context/ThemeContext.tsx
  - Global dark/light theme
- src/context/AppSettingsContext.tsx
  - Global settings state
- src/components/Layout.tsx
  - Shared page layout wrapper
- src/components/PageNavigation.tsx
  - Shared navigation cards/buttons
- src/pages/Login.tsx
  - Login flow
  - Forgot password flow
- src/pages/Signup.tsx
  - Registration flow
- src/pages/Dashboard.tsx
  - Live sensor dashboard
  - Polls backend every few seconds
  - Shows metrics, safety state, charts
- src/pages/Alerts.tsx
  - Polls alerts endpoint
  - Filtering/search/export UI
- src/pages/Prediction.tsx
  - Calls /data and /predict
  - Compares actual vs predicted
- src/pages/Reports.tsx
  - Calls /reports
  - Filters, charts, historical summaries
- src/pages/Settings.tsx
  - Loads/saves user profile and system settings
- src/utils/appSettings.ts
  - Settings types, defaults, merge logic, localStorage keys
- src/utils/translations.ts
  - Translation strings for languages

BACKEND CONCEPTS USED
- Flask app factory pattern
- Blueprint-based route modularization
- SQLAlchemy ORM
- JWT authentication with flask-jwt-extended
- CORS enabled for frontend-backend communication
- Service layer for business logic
- Password hashing with bcrypt
- Config via environment variables
- App startup initialization
- Auto-create tables with db.create_all()
- Schema patching / column backfill logic
- Model loading at route-module import time
- REST API design

BACKEND FILE/CONCEPT MAPPING
- app/__init__.py
  - create_app()
  - Initializes Flask app, CORS, DB, JWT
  - Registers blueprints
- app/config.py
  - Flask config
  - SQLite DB URI
  - JWT secret and expiration
- app/extensions.py
  - Shared SQLAlchemy and JWT extension instances
- run.py
  - App startup entrypoint
  - db.create_all()
  - ensure_application_columns()
  - assign_names_to_existing_users()

DATABASE / ORM CONCEPTS
- SQLite database
- ORM models
- Tables mapped to Python classes
- One-to-one relationship between user and user settings
- Querying by authenticated user’s device_id
- Per-user settings persistence
- Historical sensor readings storage

DATABASE MODELS
- User
  - id
  - name
  - email
  - password
  - device_id
  - phone
  - language
- SensorReading
  - id
  - device_id
  - pH
  - tds
  - turbidity
  - conductivity
  - temperature
  - timestamp
  - created_at
- UserSettings
  - user_id
  - threshold fields
  - calibration fields
  - sampling_interval
  - device_status
  - timestamps

RELATIONSHIPS
- One user has one settings record
- Sensor readings belong logically to a device_id, not directly by foreign key to user
- User is linked to sensor data through device_id

ROUTES / API MODULES
- auth_routes.py
  - POST /signup
  - POST /login
  - POST /forgot-password
  - GET /profile
  - PUT /profile
  - GET /users
- data_routes.py
  - GET /data
  - gets latest readings for logged-in user’s device
- prediction_routes.py
  - GET /predict
  - uses last 10 readings
  - LSTM predicts next reading
- alert_routes.py
  - GET /alerts
  - creates critical/warning/anomaly alerts
- report_routes.py
  - GET /reports
  - returns summary statistics, safety metrics, historical data
- settings_routes.py
  - GET /settings
  - POST /settings

BACKEND SERVICE LAYER CONCEPTS
- auth_service.py
  - create user
  - login user
  - reset password
- user_service.py
  - generate unique names
  - generate device IDs
  - schema backfill
  - update profile
- threshold_service.py
  - create/get settings
  - convert settings into threshold ranges

AUTHENTICATION FLOW
- User submits login form from frontend
- Frontend sends email/device_id + password to POST /login
- Backend checks user and bcrypt password hash
- Backend creates JWT access token
- Frontend stores token in localStorage
- Axios interceptor adds Bearer token to future requests
- Protected backend routes use @jwt_required()
- Backend reads current user id using get_jwt_identity()
- If token is invalid/expired, frontend removes token and redirects to /login

SIGNUP FLOW
- User fills signup form
- Frontend POST /signup with name, email, password, optional device_id
- Backend checks if user already exists
- Backend hashes password with bcrypt
- Backend generates unique name and/or device_id if needed
- Backend stores user in DB

PROFILE / SETTINGS FLOW
- Frontend loads local settings first
- Settings page calls GET /settings and GET /profile
- Frontend merges local defaults + saved local settings + backend settings
- User edits account/thresholds/system preferences
- Frontend sends PUT /profile and/or POST /settings
- Backend validates and saves DB values

DASHBOARD / LIVE DATA FLOW
- Dashboard polls GET /data every few seconds
- Backend uses JWT identity to find user
- Backend finds device_id for that user
- Backend queries latest 20 sensor readings for that device
- Backend returns readings in chronological order
- Frontend formats timestamps and updates cards/charts
- Frontend computes “is water safe?” based on thresholds

ALERT FLOW
- Alerts page polls GET /alerts
- Backend gets latest readings for user’s device
- Backend loads user thresholds
- Current alert:
  - checks actual latest reading against thresholds
- Future alert:
  - if model available, predicts next reading and checks it against thresholds
- Anomaly alert:
  - compares actual vs predicted difference using anomaly thresholds
- Frontend displays alert cards, allows filter/search/export

PREDICTION FLOW
- Prediction page calls GET /data and GET /predict
- Backend /predict:
  - loads trained LSTM model and scaler
  - gets latest 10 readings
  - scales data
  - reshapes to 3D input for LSTM
  - predicts next reading
  - inverse transforms values back to real units
- Frontend compares actual vs predicted values
- Frontend derives trend labels like increasing/decreasing/stable

REPORT FLOW
- Reports page calls GET /reports
- Backend fetches up to last 100 readings
- Backend computes:
  - averages
  - min/max
  - safe range references
  - total safe/unsafe readings
  - safety percentage
  - violations by parameter
  - historical data array
- Frontend renders charts and filtered views

ML / AI CONCEPTS USED
- Time-series forecasting
- Sequence/window-based prediction
- LSTM neural network
- MinMaxScaler
- Model artifact persistence
- joblib for scaler serialization
- Keras/TensorFlow model loading
- Prediction from sliding window of last 10 readings
- Separate retraining scripts
- Random Forest classifier retraining script for potability dataset
- Imputation for missing values
- StandardScaler for classification model pipeline

ML FILES / WORKFLOWS
- app/routes/prediction_routes.py
  - loads LSTM model for inference
- app/routes/alert_routes.py
  - reuses LSTM model for future alerts/anomaly checks
- scripts/retrain_lstm_model.py
  - retrains LSTM from SQLite sensor history
  - creates sequences from readings grouped by device
  - saves model + scaler + manifest
- scripts/retrain_potability_model.py
  - trains RandomForest potability classifier from labeled CSV
  - saves model + scaler + imputer + manifest
- app/train_lstm.py
  - older/simple training script on synthetic CSV
- models/
  - stores .keras/.h5/.pkl/.save artifacts and manifests

IMPORTANT ML IDEA
- The live app currently uses the LSTM prediction model for prediction/alerts
- The Random Forest potability training exists as a retraining script/artifact pipeline, but it does not appear wired into a live prediction API route in the scanned backend

INFRA / DEVOPS / DEPLOYMENT CONCEPTS
- Dockerized backend
- Dockerized frontend
- Multi-stage frontend Docker build
- Nginx serving built frontend
- Gunicorn serving Flask app
- Docker Compose orchestration
- Environment variables
- Volume mounts for persistent DB and model files
- Optional GPU support variables for TensorFlow
- Separate frontend/backend ports

DOCKER FLOW
- Backend Dockerfile:
  - Python 3.11 slim
  - installs system deps
  - installs requirements
  - runs Gunicorn on port 5001
- Frontend Dockerfile:
  - Node image builds Vite app
  - Nginx serves built static files on port 80
- docker-compose.yml:
  - backend exposed as localhost:5002 -> container 5001
  - frontend exposed as localhost:3000 -> container 80
  - frontend uses VITE_API_URL=http://localhost:5002/api
  - backend mounts ./instance and ./models

CONFIG / ENV CONCEPTS
- .env file for secrets
- SECRET_KEY
- JWT_SECRET_KEY
- FLASK_DEBUG
- USE_GPU
- VITE_API_URL build arg for frontend

WORKFLOWS TO EXPLAIN
1. User registration workflow
2. User login workflow
3. Token-based auth workflow
4. Dashboard live monitoring workflow
5. Prediction workflow
6. Alert generation workflow
7. Reporting workflow
8. Settings/profile synchronization workflow
9. Model retraining workflow
10. Docker deployment workflow
11. App startup workflow
12. DB bootstrap/schema migration-like workflow

APP STARTUP FLOW
- run.py imports create_app()
- app is created
- db.create_all() runs
- helper ensures missing columns exist
- helper assigns names to old users if needed
- app starts on Flask/Gunicorn
- frontend later calls backend APIs

STATE MANAGEMENT CONCEPTS
- Server state:
  - users
  - readings
  - settings
  - reports
  - alerts
  - predictions
- Client state:
  - token
  - theme
  - language
  - local preferences
  - cached profile/settings
- Explain difference between local UI state, context state, persistent local storage, and backend persistent state

IMPORTANT ENGINEERING CONCEPTS IN THIS PROJECT
- Separation of concerns
- Route/controller vs service vs model layers
- API client abstraction
- Protected route pattern
- Polling instead of websocket real-time
- ORM model mapping
- Stateless auth with JWT
- Model inference pipeline
- Data transformation between backend and frontend
- Environment-based configuration
- Build-time vs runtime config
- Dockerized deployment
- Shared layout and reusable components
- Context-based global state
- CRUD-like settings management
- Historical analytics pipeline

POSSIBLE LIMITATIONS / DESIGN NOTES
- Sensor ingestion endpoint is not clearly visible in scanned routes, so readings may be preloaded or inserted externally
- Device linkage is through device_id string rather than explicit foreign key relationship from readings to users
- Local settings + backend settings merging may introduce sync complexity
- Frontend uses polling rather than websockets/SSE
- Column “migration” is handled manually in code rather than full Alembic migrations
- Potability model exists as training pipeline but may not be active in live API
- SQLite is simple for local/project use but limited for heavy production scale

NOW PLEASE DO THE FOLLOWING:
- Explain every concept from scratch in very simple words first
- Then explain it in technical detail
- Then map the full end-to-end flow
- Then explain each folder/file role
- Then explain each workflow one by one
- Then explain what happens when a user logs in and opens the dashboard
- Then explain how the ML prediction works mathematically and architecturally
- Then explain why this project is structured this way
- Then suggest how this project could be improved for production
```

## Quick Human Summary

This project is a full-stack water monitoring app.

- The frontend is a React app where users log in, view dashboard data, check alerts, inspect predictions, view reports, and update settings.
- The backend is a Flask API that handles authentication, settings, sensor data access, reports, and ML prediction logic.
- The database is SQLite and stores users, sensor readings, and user settings.
- The ML layer uses an LSTM model to predict the next sensor reading from the latest 10 readings.
- Docker is used to run frontend and backend as separate services.

## Best Way To Use This With ChatGPT

Paste the big block above, then ask questions like:

1. `Explain this project to me like I am a beginner.`
2. `Now explain the backend only.`
3. `Explain the database design and relationships.`
4. `Explain the login flow from UI to database.`
5. `Explain the dashboard flow from API to chart rendering.`
6. `Explain the ML prediction flow step by step.`
7. `Ask me viva questions on this project and give model answers.`

