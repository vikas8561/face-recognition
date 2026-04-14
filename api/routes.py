"""
API routes for the Virtual Try-On application.
"""

import os
import uuid
import json
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from pathlib import Path

api_bp = Blueprint("api", __name__, url_prefix="/api")

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@api_bp.route("/dresses", methods=["GET"])
def get_dresses():
    """Return the complete dress catalog."""
    data_path = Path("data/dresses.json")
    if data_path.exists():
        with open(data_path, "r") as f:
            data = json.load(f)
        return jsonify(data)
    return jsonify({"error": "Dress catalog not found"}), 404


@api_bp.route("/dresses/<state_id>", methods=["GET"])
def get_state_dresses(state_id):
    """Return dresses for a specific state."""
    data_path = Path("data/dresses.json")
    if data_path.exists():
        with open(data_path, "r") as f:
            data = json.load(f)
        for state in data.get("states", []):
            if state["id"] == state_id:
                return jsonify(state)
    return jsonify({"error": "State not found"}), 404


@api_bp.route("/try-on", methods=["POST"])
def try_on():
    """
    Perform virtual try-on.
    Expects: multipart form with 'person' image file and 'dress_id' field.
    Returns: JSON with result image URL.
    """
    # Validate inputs
    if "person" not in request.files:
        return jsonify({"error": "No person image provided"}), 400

    person_file = request.files["person"]
    dress_id = request.form.get("dress_id")

    if not dress_id:
        return jsonify({"error": "No dress_id provided"}), 400

    if person_file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(person_file.filename):
        return jsonify({"error": "Invalid file type. Use JPG, PNG, or WebP"}), 400

    # Find the garment image for this dress
    data_path = Path("data/dresses.json")
    garment_path = None
    dress_info = None

    if data_path.exists():
        with open(data_path, "r") as f:
            data = json.load(f)
        for state in data.get("states", []):
            for dress in state.get("dresses", []):
                if dress["id"] == dress_id:
                    garment_path = dress.get("garment_image")
                    dress_info = dress
                    break
            if garment_path:
                break

    if not garment_path:
        return jsonify({"error": f"Dress '{dress_id}' not found in catalog"}), 404

    # Resolve garment path
    full_garment_path = os.path.join("static", "images", garment_path)
    if not os.path.exists(full_garment_path):
        return jsonify({"error": "Garment image file not found on server"}), 404

    # Save uploaded person image
    upload_dir = Path(current_app.config.get("UPLOAD_DIR", "static/uploads"))
    upload_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}_{secure_filename(person_file.filename)}"
    person_path = str(upload_dir / filename)
    person_file.save(person_path)

    try:
        # Perform try-on
        tryon_service = current_app.config["TRYON_SERVICE"]
        result = tryon_service.try_on(person_path, full_garment_path, dress_id)

        if result["success"]:
            # Convert file path to URL
            result_url = "/" + result["result_path"].replace("\\", "/")
            return jsonify(
                {
                    "success": True,
                    "result_url": result_url,
                    "cached": result.get("cached", False),
                    "processing_time": result.get("processing_time", 0),
                    "dress_info": dress_info,
                }
            )
        else:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": result.get("error", "Unknown error during processing"),
                        "processing_time": result.get("processing_time", 0),
                    }
                ),
                500,
            )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        # Clean up uploaded file
        if os.path.exists(person_path):
            os.remove(person_path)
