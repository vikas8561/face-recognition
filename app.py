"""
AI Virtual Try-On — Indian Traditional Dresses
Flask Application Entry Point
"""

import os
from flask import Flask, render_template, send_from_directory
from flask_cors import CORS
from config import Config
from api.routes import api_bp
from services.tryon_service import TryOnService


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # CORS for API access
    CORS(app)

    # Max upload size
    app.config["MAX_CONTENT_LENGTH"] = Config.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    # Ensure directories exist
    os.makedirs(Config.UPLOAD_DIR, exist_ok=True)
    os.makedirs(Config.RESULTS_DIR, exist_ok=True)
    os.makedirs(Config.CACHE_DIR, exist_ok=True)

    # Initialize try-on service
    tryon_service = TryOnService(Config)
    app.config["TRYON_SERVICE"] = tryon_service

    # Register blueprints
    app.register_blueprint(api_bp)

    # Main page
    @app.route("/")
    def index():
        return render_template("index.html")

    # Serve result images
    @app.route("/static/results/<path:filename>")
    def serve_result(filename):
        return send_from_directory("static/results", filename)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
