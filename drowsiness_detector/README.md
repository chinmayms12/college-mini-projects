# Drowsiness Detector (Prototype)

This repository contains a simple prototype demonstrating a drowsiness detector with a **frontend** (browser) and **backend** (Flask + MediaPipe).

## Features
- Browser captures webcam frames and sends them to the backend.
- Backend uses MediaPipe Face Mesh to estimate eye landmarks and computes an Eye Aspect Ratio (EAR).
- If EAR remains below a threshold for a number of consecutive frames, the system flags "drowsy".
- Frontend plays a short beep alarm and shows status.

## Requirements
- Python 3.8+
- Recommended Python packages (install with pip):
```
pip install -r requirements.txt
```

`requirements.txt` includes:
```
flask
opencv-python
mediapipe
numpy
```

## Run
1. Install requirements.
2. Run backend:
```
python app.py
```
3. Open `http://127.0.0.1:5000` in Google Chrome (or any browser that supports getUserMedia).
4. Click **Start** to allow camera access and begin detection.

## Notes & Limitations
- This is a prototype. EAR thresholds and landmark indices may need tuning for your camera and face orientation.
- MediaPipe is fairly robust but requires CPU support. For production use, consider optimizing, using a model in the browser (TensorFlow.js) or running detection locally.
- For multiple users or sessions, server-side session management for counters should be added.
- Be careful about privacy: webcam frames are sent to the backend in this design.

## Files
- `app.py` — Flask backend
- `templates/index.html` — Frontend page
- `static/script.js`, `static/style.css` — Frontend assets
- `README.md`, `requirements.txt`

Feel free to modify thresholds in `app.py` (`EAR_THRESHOLD`, `CONSEC_FRAMES`) to suit your needs.
