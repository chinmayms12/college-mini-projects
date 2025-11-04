"""
Drowsiness Detection - Backend (Flask + MediaPipe)
Save as app.py

Requires:
pip install flask opencv-python mediapipe numpy

Run:
python app.py
Then open http://127.0.0.1:5000 in your browser.

This backend accepts POST /detect with JSON {"image": "<dataURL>"} where image is a base64 PNG/JPEG dataURL.
It returns JSON: {"drowsy": bool, "ear": float, "frames_below": int}
"""
from flask import Flask, request, jsonify, render_template
import cv2
import numpy as np
import base64
import re
import mediapipe as mp

app = Flask(__name__, static_folder="static", template_folder="templates")

# MediaPipe setup
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True)

# Eye landmark indices from MediaPipe Face Mesh for left and right eyes (refined)
LEFT_EYE_LANDMARKS = [33, 160, 158, 133, 153, 144]   # approximate set
RIGHT_EYE_LANDMARKS = [362, 385, 387, 263, 373, 380] # approximate set

EAR_THRESHOLD = 0.25  # eye aspect ratio threshold (tunable)
CONSEC_FRAMES = 15    # number of consecutive frames indicating drowsiness

# we'll keep a small server-side counter keyed by session (here, single user)
frames_below = 0

def dataURL_to_cv2_img(data_url):
    # data_url like "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
    header, encoded = data_url.split(",", 1)
    data = base64.b64decode(encoded)
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return img

def euclidean(a, b):
    return np.linalg.norm(np.array(a) - np.array(b))

def eye_aspect_ratio(landmarks, indices, image_w, image_h):
    # landmarks: list of (x, y) normalized pairs from mediapipe
    pts = [(int(landmarks[i].x * image_w), int(landmarks[i].y * image_h)) for i in indices]
    # EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
    A = euclidean(pts[1], pts[5])  # vertical
    B = euclidean(pts[2], pts[4])  # vertical
    C = euclidean(pts[0], pts[3])  # horizontal
    if C == 0:
        return 0.0
    ear = (A + B) / (2.0 * C)
    return float(ear)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/detect", methods=["POST"])
def detect():
    global frames_below
    data = request.get_json()
    if not data or "image" not in data:
        return jsonify({"error": "No image provided"}), 400
    try:
        img = dataURL_to_cv2_img(data["image"])
    except Exception as e:
        return jsonify({"error": f"Could not decode image: {str(e)}"}), 400

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    h, w, _ = img.shape

    results = face_mesh.process(img_rgb)
    if not results.multi_face_landmarks:
        # no face found
        frames_below = 0
        return jsonify({"drowsy": False, "ear": 0.0, "frames_below": frames_below, "message": "no_face"})

    landmarks = results.multi_face_landmarks[0].landmark
    left_ear = eye_aspect_ratio(landmarks, LEFT_EYE_LANDMARKS, w, h)
    right_ear = eye_aspect_ratio(landmarks, RIGHT_EYE_LANDMARKS, w, h)
    ear = (left_ear + right_ear) / 2.0

    if ear < EAR_THRESHOLD:
        frames_below += 1
    else:
        frames_below = 0

    drowsy = frames_below >= CONSEC_FRAMES

    return jsonify({"drowsy": bool(drowsy), "ear": round(ear, 4), "frames_below": int(frames_below)})

if __name__ == "__main__":
    app.run(debug=True)