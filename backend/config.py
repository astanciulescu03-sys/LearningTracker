import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    """Configurare centrala pentru aplicatia Flask."""

    SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(
        BASE_DIR, "instance", "tracker.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Originile de unde acceptam cereri CORS (frontend-ul Vite ruleaza implicit pe 5173)
    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
