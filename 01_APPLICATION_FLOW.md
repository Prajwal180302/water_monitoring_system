# Water Monitoring System: Complete Flow

## 1. System overview

```text
User → React frontend → Flask API → PostgreSQL database
                         ↓
                  TensorFlow LSTM model
                         ↓
                       Redis
```

- React displays the web pages.
- Flask receives API requests and applies business logic.
- PostgreSQL stores users, settings, sensor readings, and reset tokens.
- TensorFlow predicts the next water reading.
- Redis stores rate-limit counters for login and password-reset protection.

## 2. Signup and login

1. A user opens the Signup page.
2. They enter name, email, password, and the real sensor Device ID if available.
3. The frontend sends the request to `POST /api/signup`.
4. Flask validates the data, hashes the password with bcrypt, and saves the user in PostgreSQL.
5. The user logs in through `POST /api/login`.
6. Flask verifies the password and returns a JWT access token.
7. The frontend saves the token in browser local storage and sends it with later API requests.

## 3. Sensor-data flow

1. Every reading belongs to a `device_id`.
2. The backend searches readings using the logged-in user's device ID.
3. Dashboard, Alerts, Reports, and Prediction therefore show data for that device.
4. For the project demo, `generate_sensor_data.py` creates realistic sample readings.
5. The newest generated readings are intentionally unsafe so alerts can be demonstrated.

## 4. Dashboard flow

1. Dashboard calls `GET /api/data` with the JWT token.
2. Backend gets the logged-in user.
3. Backend reads the latest 20 records for that user's device.
4. React displays the readings as cards/charts.

## 5. Alerts flow

1. Alerts page calls `GET /api/alerts`.
2. Backend gets the latest sensor readings and the user's thresholds.
3. Current values outside safe limits create critical alerts.
4. The last 10 readings are given to the LSTM model.
5. If the next predicted value may be unsafe, the backend creates a warning alert.
6. React shows, filters, searches, and exports the alerts.

## 6. Prediction flow

1. Prediction page calls `GET /api/predict`.
2. Backend collects the latest 10 readings for the user's device.
3. Data is scaled using the saved scaler.
4. The LSTM model predicts the next pH, TDS, turbidity, conductivity, and temperature values.
5. Backend returns the prediction as JSON and React displays it.

## 7. Reports and settings flow

- Reports calculate averages, minimums, maximums, safe/unsafe statistics, and history from sensor readings.
- Settings lets each user change threshold limits, calibration values, sampling interval, language, and device status.
- The user settings are saved in the `user_settings` table and used by Alerts and Reports.

## 8. Forgot-password flow

1. User enters their email on the login page.
2. Backend creates a random reset token that expires in 15 minutes.
3. Only a hash of the token is stored in PostgreSQL.
4. Backend sends a reset URL by email; during local development it can print the link in Docker logs.
5. User opens `/reset-password?token=...` and enters a new password.
6. Backend verifies the token, hashes the new password, marks the token used, and saves the password.
7. The reset link cannot be used again.

## 9. Docker flow

`docker compose up` starts four services:

- `frontend`: React build served by Nginx at port 3000.
- `backend`: Flask/Gunicorn API at port 5002.
- `database`: PostgreSQL with persistent Docker volume storage.
- `redis`: shared rate-limit storage.

## 10. Production/AWS flow

In AWS, replace local Docker database/Redis services with managed services:

```text
Internet → HTTPS Load Balancer → ECS frontend/backend containers
                                      ↓          ↓
                                  RDS PostgreSQL  ElastiCache Redis
```

Use AWS Secrets Manager for passwords, enable RDS backups, and use HTTPS.
