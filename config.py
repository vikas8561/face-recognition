import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret-key-change-in-prod")
    HF_SPACE_URL = os.getenv("HF_SPACE_URL", "felixrosberg/face-swap")
    MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
    CACHE_DIR = os.getenv("CACHE_DIR", "cache")
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join("static", "uploads"))
    RESULTS_DIR = os.getenv("RESULTS_DIR", os.path.join("static", "results"))
    DRESSES_DIR = os.path.join("static", "images", "dresses")

    # Rate limiting
    RATE_LIMIT_DEFAULT = "30 per minute"
    RATE_LIMIT_TRYON = "5 per minute"
