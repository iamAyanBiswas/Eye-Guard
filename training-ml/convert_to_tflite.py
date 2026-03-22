"""
================================================================
  Convert Keras .h5 model to TFLite format
  Run this after training (on Colab or locally with TensorFlow)
================================================================

Usage:
    python convert_to_tflite.py

Input:  fatigue_classifier.h5   (in current directory or ml-model/)
Output: fatigue_classifier.tflite
================================================================
"""

import tensorflow as tf
from pathlib import Path
import shutil

# Look for the .h5 model in current dir or ../ml-model/
H5_CANDIDATES = [
    Path("fatigue_classifier.h5"),
    Path("../ml-model/fatigue_classifier.h5"),
]

OUTPUT_DIR = Path(".")
TFLITE_OUTPUT = OUTPUT_DIR / "fatigue_classifier.tflite"
ML_MODEL_DIR = Path("../ml-model")


def convert():
    # Find the .h5 model
    h5_path = None
    for candidate in H5_CANDIDATES:
        if candidate.exists():
            h5_path = candidate
            break

    if h5_path is None:
        print("❌ fatigue_classifier.h5 not found.")
        print("   Run the training script first, or place the .h5 file here.")
        return

    print(f"📂 Loading Keras model from: {h5_path}")
    model = tf.keras.models.load_model(str(h5_path))
    model.summary()

    # Convert to TFLite with maximum compatibility
    print("\n🔄 Converting to TFLite...")
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]  # Quantize for smaller size
    converter.target_spec.supported_ops = [
        tf.lite.OpsSet.TFLITE_BUILTINS  # Use only standard TFLite ops
    ]
    tflite_model = converter.convert()

    # Save locally
    TFLITE_OUTPUT.write_bytes(tflite_model)
    size_kb = len(tflite_model) / 1024
    print(f"✅ Saved: {TFLITE_OUTPUT} ({size_kb:.1f} KB)")

    # Also copy to ml-model/ if it exists
    ml_model_dest = ML_MODEL_DIR / "fatigue_classifier.tflite"
    if ML_MODEL_DIR.exists():
        shutil.copy2(TFLITE_OUTPUT, ml_model_dest)
        print(f"✅ Copied to: {ml_model_dest}")

    print("\n📋 Next steps:")
    print("   1. Place fatigue_classifier.tflite in ml-model/")
    print("   2. Place feature_scaler.pkl in ml-model/")
    print("   3. Run: docker compose up --build")


if __name__ == "__main__":
    convert()
