# Docker Setup

## Start both services

```bash
docker compose up --build
```

## Start with GPU

Make sure Docker has NVIDIA Container Toolkit available, then run:

```bash
docker compose up --build
```

## URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5002/api`

## Notes

- Backend uses `gunicorn` on port `5001`
- Frontend is built with Vite and served by Nginx on port `3000`
- Current SQLite database from `./instance/database.db` is included in the backend image build
- SQLite data is also persisted through `./instance`, so Docker Compose keeps using your current local database
- Trained models are mounted from `./models`, so retraining updates the local model files too
- Backend Compose service requests all available GPUs
- Set `USE_GPU=false` if you want to force CPU mode

## Retrain the LSTM model

```bash
docker compose run --rm --no-deps -v "$PWD:/app" backend python scripts/retrain_lstm_model.py
```

This retrains the app-used LSTM model and scaler from your current SQLite sensor history and saves backups in `instance/model_backups/`.
