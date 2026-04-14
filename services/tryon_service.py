"""
HuggingFace Spaces client for IDM-VTON virtual try-on.
Completely free — uses HuggingFace's hosted GPU inference.
"""

import os
import hashlib
import time
import json
import shutil
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
from gradio_client import Client, handle_file


class TryOnService:
    """Virtual try-on service using free HuggingFace Spaces."""

    CACHE_VERSION = "v2-facecrop"

    def __init__(self, config):
        self.hf_space = config.HF_SPACE_URL
        self.cache_dir = Path(config.CACHE_DIR)
        self.results_dir = Path(config.RESULTS_DIR)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.results_dir.mkdir(parents=True, exist_ok=True)
        self._cache_index_path = self.cache_dir / "index.json"
        self._cache_index = self._load_cache_index()

    def _load_cache_index(self):
        if self._cache_index_path.exists():
            with open(self._cache_index_path, "r") as f:
                return json.load(f)
        return {}

    def _save_cache_index(self):
        with open(self._cache_index_path, "w") as f:
            json.dump(self._cache_index, f)

    def _compute_image_hash(self, image_path):
        """Fast hash of image file for cache key."""
        h = hashlib.md5()
        with open(image_path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return h.hexdigest()[:12]

    def _get_cache_key(self, person_hash, dress_id):
        return f"{self.CACHE_VERSION}_{person_hash}_{dress_id}"

    def _check_cache(self, cache_key):
        """Check if result exists in cache."""
        if cache_key in self._cache_index:
            cached_path = self._cache_index[cache_key]
            if os.path.exists(cached_path):
                return cached_path
            else:
                del self._cache_index[cache_key]
                self._save_cache_index()
        return None

    def preprocess_image(self, image_path, max_size=1024):
        """Resize image to reasonable size for API."""
        img = Image.open(image_path)
        img = img.convert("RGB")

        # Resize if too large
        w, h = img.size
        if max(w, h) > max_size:
            ratio = max_size / max(w, h)
            new_w = int(w * ratio)
            new_h = int(h * ratio)
            img = img.resize((new_w, new_h), Image.LANCZOS)

        # Save preprocessed
        processed_path = image_path.replace(".jpg", "_processed.jpg").replace(
            ".png", "_processed.png"
        )
        if processed_path == image_path:
            processed_path = image_path + "_processed.jpg"
        img.save(processed_path, "JPEG", quality=95)
        return processed_path

    def extract_face_crop(self, image_path, padding_ratio=0.45, output_size=512):
        """
        Extract the dominant face from a user photo.

        The hosted face-swap space expects a clear source face. Sending the
        entire body shot weakens identity preservation, so we crop the largest
        detected face with padding before inference.
        """
        image = cv2.imread(image_path)
        if image is None:
            return image_path

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        faces = cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(60, 60),
        )

        if len(faces) == 0:
            return image_path

        x, y, w, h = max(faces, key=lambda face: face[2] * face[3])
        pad_x = int(w * padding_ratio)
        pad_y = int(h * padding_ratio)

        left = max(0, x - pad_x)
        top = max(0, y - pad_y)
        right = min(image.shape[1], x + w + pad_x)
        bottom = min(image.shape[0], y + h + pad_y)

        face_crop = image[top:bottom, left:right]
        if face_crop.size == 0:
            return image_path

        crop_h, crop_w = face_crop.shape[:2]
        square_size = max(crop_w, crop_h)
        square = 255 * np.ones((square_size, square_size, 3), dtype=face_crop.dtype)
        offset_x = (square_size - crop_w) // 2
        offset_y = (square_size - crop_h) // 2
        square[offset_y:offset_y + crop_h, offset_x:offset_x + crop_w] = face_crop

        resized = cv2.resize(square, (output_size, output_size), interpolation=cv2.INTER_LANCZOS4)
        output_path = str(self.cache_dir / f"{Path(image_path).stem}_face.jpg")
        cv2.imwrite(output_path, resized, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        return output_path

    def try_on(self, person_image_path, garment_image_path, dress_id):
        """
        Perform virtual try-on using free HuggingFace Spaces.

        Args:
            person_image_path: Path to user's captured photo
            garment_image_path: Path to the traditional dress garment image
            dress_id: Unique dress identifier for caching

        Returns:
            dict with 'success', 'result_path', 'cached', 'processing_time'
        """
        start_time = time.time()

        # Compute hash for caching
        person_hash = self._compute_image_hash(person_image_path)
        cache_key = self._get_cache_key(person_hash, dress_id)

        # Check cache first
        cached_result = self._check_cache(cache_key)
        if cached_result:
            return {
                "success": True,
                "result_path": cached_result,
                "cached": True,
                "processing_time": round(time.time() - start_time, 2),
            }

        face_source_path = person_image_path

        try:
            face_source_path = self.extract_face_crop(person_image_path)

            # Connect to free HuggingFace Space
            client = Client(self.hf_space)

            # Call Face-Swap model (target = garment/model body, source = person face)
            result = client.predict(
                target=handle_file(garment_image_path),
                source=handle_file(face_source_path),
                slider=100.0,
                adv_slider=100.0,
                settings=[],
                api_name="/run_inference"
            )

            # result is the filepath string
            if result:
                result_image_path = result

                # Copy result to our results directory
                result_filename = f"{cache_key}_{int(time.time())}.png"
                final_path = str(self.results_dir / result_filename)
                shutil.copy2(result_image_path, final_path)

                # Cache it
                self._cache_index[cache_key] = final_path
                self._save_cache_index()

                return {
                    "success": True,
                    "result_path": final_path,
                    "cached": False,
                    "processing_time": round(time.time() - start_time, 2),
                }
            else:
                return {
                    "success": False,
                    "error": "No result returned from model",
                    "processing_time": round(time.time() - start_time, 2),
                }

        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e),
                "processing_time": round(time.time() - start_time, 2),
            }
        finally:
            if face_source_path != person_image_path and os.path.exists(face_source_path):
                os.remove(face_source_path)

    def clear_cache(self):
        """Clear all cached results."""
        self._cache_index = {}
        self._save_cache_index()
        for f in self.cache_dir.glob("*"):
            if f.name != "index.json":
                f.unlink()
        for f in self.results_dir.glob("*"):
            f.unlink()
