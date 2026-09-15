import os

from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from models import db


def create_app():
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(Config)

    os.makedirs(app.instance_path, exist_ok=True)

    db.init_app(app)
    CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)

    from routes import api

    app.register_blueprint(api)

    @app.get("/")
    def index():
        return jsonify({"status": "ok", "service": "learning-tracker-api"})

    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
