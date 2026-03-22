"""
================================================================
  EYEGUARD API SERVER (TFLite Runtime)
  Ultra-lightweight fatigue prediction API.
================================================================

Usage:
    python api/app.py

Endpoints:
    GET  /api/health          - Health check
    POST /api/predict          - Predict fatigue level from 21 features
    GET  /api/model/info      - Get model status and metadata
================================================================
"""

import sys
import numpy as np
import joblib
from pathlib import Path
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS

# ── Paths ──
BASE_DIR = Path(__file__).resolve().parent.parent
ML_MODEL_DIR = BASE_DIR / "ml-model"
MODEL_PATH = ML_MODEL_DIR / "fatigue_classifier.tflite"
SCALER_PATH = ML_MODEL_DIR / "feature_scaler.pkl"

# ── Fatigue Labels ──
FATIGUE_LABELS = {
    0: 'Normal',
    1: 'Mild Strain',
    2: 'Moderate Strain',
    3: 'Severe Strain'
}

FEATURE_NAMES = [
    'ear_mean', 'ear_std', 'ear_min', 'ear_max', 'ear_median',
    'ear_skew', 'ear_kurtosis', 'ear_trend',
    'blink_mean', 'blink_std', 'blink_min', 'blink_max', 'blink_trend',
    'gaze_mean', 'gaze_std', 'gaze_min',
    'duration_minutes', 'duration_log',
    'ear_blink_interaction',
    'low_blink_indicator',
    'low_ear_indicator'
]

# ── App Setup ──
app = Flask(__name__)
CORS(app)

# ── Global Model Variables ──
interpreter = None
input_details = None
output_details = None
scaler = None
model_loaded = False


def load_model():
    """
    Load the TFLite model and scaler from ml-model/ directory.
    Returns True on success, raises SystemExit on failure.
    """
    global interpreter, input_details, output_details, scaler, model_loaded

    if not MODEL_PATH.exists():
        print(f"❌ Model file not found at: {MODEL_PATH}")
        print(f"   Run convert_to_tflite.py first, then place the .tflite file in ml-model/")
        sys.exit(1)

    if not SCALER_PATH.exists():
        print(f"❌ Scaler file not found at: {SCALER_PATH}")
        sys.exit(1)

    try:
        from ai_edge_litert.interpreter import Interpreter

        interpreter = Interpreter(model_path=str(MODEL_PATH))
        interpreter.allocate_tensors()

        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()

        scaler = joblib.load(str(SCALER_PATH))

        model_loaded = True
        print(f"✅ TFLite model loaded: {MODEL_PATH} ({MODEL_PATH.stat().st_size / 1024:.1f} KB)")
        print(f"✅ Scaler loaded: {SCALER_PATH}")
        print(f"   Input shape:  {input_details[0]['shape']}")
        print(f"   Output shape: {output_details[0]['shape']}")
        return True

    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        sys.exit(1)


def tflite_predict(features_scaled: np.ndarray) -> np.ndarray:
    """Run inference on scaled features using TFLite interpreter."""
    input_data = features_scaled.astype(np.float32)
    interpreter.set_tensor(input_details[0]['index'], input_data)
    interpreter.invoke()
    return interpreter.get_tensor(output_details[0]['index'])[0]


# =====================================================================
#                          API ROUTES
# =====================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'model_loaded': model_loaded,
        'runtime': 'tflite-runtime',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })


@app.route('/api/model/info', methods=['GET'])
def model_info():
    """Get information about the loaded model."""
    info = {
        'model_loaded': model_loaded,
        'runtime': 'tflite-runtime',
        'model_path': str(MODEL_PATH),
        'scaler_path': str(SCALER_PATH),
        'model_exists': MODEL_PATH.exists(),
        'scaler_exists': SCALER_PATH.exists(),
        'input_features': FEATURE_NAMES,
        'num_features': len(FEATURE_NAMES),
        'output_classes': FATIGUE_LABELS,
        'num_classes': len(FATIGUE_LABELS)
    }

    if model_loaded and input_details is not None:
        info['input_shape'] = input_details[0]['shape'].tolist()
        info['output_shape'] = output_details[0]['shape'].tolist()
        model_size = MODEL_PATH.stat().st_size
        info['model_size_kb'] = round(model_size / 1024, 1)

    return jsonify(info)


@app.route('/api/predict', methods=['POST'])
def predict():
    """
    Predict fatigue level from input features.

    Expects JSON body with either:
      - "features": [list of 21 float values]
      - OR individual feature keys: {"ear_mean": 0.3, "blink_mean": 15, ...}

    Returns:
      {
        "prediction": 0,
        "label": "Normal",
        "confidence": 0.95,
        "probabilities": {
          "Normal": 0.95,
          "Mild Strain": 0.03,
          "Moderate Strain": 0.01,
          "Severe Strain": 0.01
        }
      }
    """
    if not model_loaded:
        return jsonify({
            'error': 'Model not loaded.'
        }), 503

    try:
        data = request.get_json()

        if data is None:
            return jsonify({'error': 'Request body must be valid JSON'}), 400

        # Accept features as a list
        if 'features' in data:
            features = np.array(data['features'], dtype=np.float32)
            if features.shape[0] != len(FEATURE_NAMES):
                return jsonify({
                    'error': f'Expected {len(FEATURE_NAMES)} features, got {features.shape[0]}'
                }), 400

        # Or accept features as named keys
        else:
            missing = [f for f in FEATURE_NAMES if f not in data]
            if missing:
                return jsonify({
                    'error': f'Missing features: {missing}'
                }), 400
            features = np.array([data[f] for f in FEATURE_NAMES], dtype=np.float32)

        # Scale features
        features_scaled = scaler.transform(features.reshape(1, -1))

        # Predict using TFLite
        probs = tflite_predict(features_scaled)
        predicted_class = int(np.argmax(probs))
        confidence = float(probs[predicted_class])

        # Build probability dict
        probabilities = {}
        for i, label in FATIGUE_LABELS.items():
            probabilities[label] = round(float(probs[i]), 4)

        return jsonify({
            'prediction': predicted_class,
            'label': FATIGUE_LABELS[predicted_class],
            'confidence': round(confidence, 4),
            'probabilities': probabilities
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =====================================================================
#                         ENTRY POINT
# =====================================================================

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("   EYEGUARD API SERVER (TFLite Runtime)")
    print("=" * 60)

    # Load model BEFORE starting server — exit if it fails
    load_model()

    print("=" * 60)
    print("   Server starting on http://0.0.0.0:8080")
    print("=" * 60 + "\n")

    app.run(host='0.0.0.0', port=8080, debug=False)
