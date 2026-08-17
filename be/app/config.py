from dotenv import load_dotenv
import os
from datetime import timedelta   

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = "sqlite:///database.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

  
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=5)