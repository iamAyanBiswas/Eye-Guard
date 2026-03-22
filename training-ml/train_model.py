"""
================================================================
  EYEGUARD - Fatigue Classification Model Training Script
  Run this on Google Colab (or any machine with TensorFlow)
================================================================

Instructions:
  1. Upload this file to Google Colab
  2. Run all cells / execute the script
  3. Download the generated files:
     - fatigue_classifier.h5  (the trained model)
     - feature_scaler.pkl     (the feature normalizer)
  4. Place both files in the `ml-model/` folder of your project

Dependencies (auto-installed on Colab):
  pip install tensorflow scikit-learn scipy joblib numpy pandas
================================================================
"""

import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from scipy import stats
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau


# =====================================================================
#                        CONFIGURATION
# =====================================================================

# Training parameters
SAMPLES_PER_CLASS = 1000
EPOCHS = 50
BATCH_SIZE = 32
LEARNING_RATE = 0.001
TEST_SPLIT = 0.2
VALIDATION_SPLIT = 0.15

# Blink rate thresholds
NORMAL_BLINK_RATE_MIN = 12
NORMAL_BLINK_RATE_MAX = 25

# Fatigue labels
FATIGUE_LABELS = {
    0: 'Normal',
    1: 'Mild Strain',
    2: 'Moderate Strain',
    3: 'Severe Strain'
}

# Feature names (21 features)
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

# Output paths
OUTPUT_DIR = Path(".")  # Current directory (change if needed)
MODEL_OUTPUT_PATH = OUTPUT_DIR / "fatigue_classifier.h5"
SCALER_OUTPUT_PATH = OUTPUT_DIR / "feature_scaler.pkl"


# =====================================================================
#                    DATASET GENERATOR
# =====================================================================

def safe_skew(values):
    """Calculate skewness safely."""
    if len(values) < 3:
        return 0.0
    try:
        return float(stats.skew(values))
    except:
        return 0.0


def safe_kurtosis(values):
    """Calculate kurtosis safely."""
    if len(values) < 4:
        return 0.0
    try:
        return float(stats.kurtosis(values))
    except:
        return 0.0


def generate_class_features(n_samples, ear_mean_range, blink_rate_range,
                            gaze_stability_range, duration_range):
    """
    Generate synthetic feature vectors for a specific fatigue class.

    Args:
        n_samples: Number of samples to generate
        ear_mean_range: (min, max) for average Eye Aspect Ratio
        blink_rate_range: (min, max) for blink rate
        gaze_stability_range: (min, max) for gaze stability
        duration_range: (min, max) for session duration in minutes

    Returns:
        Feature matrix (n_samples, 21)
    """
    features = []

    for _ in range(n_samples):
        # Generate base metrics
        ear_avg = np.random.uniform(*ear_mean_range)
        blink_avg = np.random.uniform(*blink_rate_range)
        gaze_avg = np.random.uniform(*gaze_stability_range)
        dur_min = np.random.uniform(*duration_range)

        # EAR features (with realistic variance)
        ear_values = np.random.normal(ear_avg, 0.02, 30)
        ear_values = np.clip(ear_values, 0.15, 0.40)

        feat = [
            np.mean(ear_values),       # ear_mean
            np.std(ear_values),        # ear_std
            np.min(ear_values),        # ear_min
            np.max(ear_values),        # ear_max
            np.median(ear_values),     # ear_median
            safe_skew(ear_values),     # ear_skew
            safe_kurtosis(ear_values), # ear_kurtosis
            np.random.uniform(-0.01, 0.01),  # ear_trend
        ]

        # Blink rate features
        blink_values = np.random.normal(blink_avg, 2, 30)
        blink_values = np.clip(blink_values, 0, 30)

        feat.extend([
            np.mean(blink_values),     # blink_mean
            np.std(blink_values),      # blink_std
            np.min(blink_values),      # blink_min
            np.max(blink_values),      # blink_max
            np.random.uniform(-0.5, 0.5),  # blink_trend
        ])

        # Gaze stability features
        gaze_values = np.random.normal(gaze_avg, 0.1, 30)
        gaze_values = np.clip(gaze_values, 0, 1)

        feat.extend([
            np.mean(gaze_values),      # gaze_mean
            np.std(gaze_values),       # gaze_std
            np.min(gaze_values),       # gaze_min
        ])

        # Duration features
        feat.extend([
            dur_min,                   # duration_minutes
            np.log1p(dur_min * 60),    # duration_log (in seconds)
        ])

        # Derived features
        feat.append(ear_avg * blink_avg)                      # ear_blink_interaction
        feat.append(1.0 if blink_avg < 10 else 0.0)           # low_blink_indicator
        feat.append(1.0 if ear_avg < 0.25 else 0.0)           # low_ear_indicator

        features.append(feat)

    return np.array(features, dtype=np.float32)


def generate_synthetic_dataset(n_samples_per_class=1000):
    """
    Generate the full synthetic training dataset.

    Classes:
        0: Normal - No fatigue
        1: Mild Strain - Early signs
        2: Moderate Strain - Clear fatigue
        3: Severe Strain - Critical fatigue

    Returns:
        Tuple of (X, y) where X is (n_samples*4, 21) and y is (n_samples*4,)
    """
    print(f"🔄 Generating {n_samples_per_class * 4} synthetic samples...")

    all_features = []
    all_labels = []

    # Class 0: Normal
    features = generate_class_features(
        n_samples=n_samples_per_class,
        ear_mean_range=(0.28, 0.35),
        blink_rate_range=(NORMAL_BLINK_RATE_MIN, NORMAL_BLINK_RATE_MAX),
        gaze_stability_range=(0.7, 0.95),
        duration_range=(5, 30)
    )
    all_features.append(features)
    all_labels.extend([0] * n_samples_per_class)

    # Class 1: Mild Strain
    features = generate_class_features(
        n_samples=n_samples_per_class,
        ear_mean_range=(0.26, 0.30),
        blink_rate_range=(9, 14),
        gaze_stability_range=(0.6, 0.8),
        duration_range=(20, 45)
    )
    all_features.append(features)
    all_labels.extend([1] * n_samples_per_class)

    # Class 2: Moderate Strain
    features = generate_class_features(
        n_samples=n_samples_per_class,
        ear_mean_range=(0.22, 0.28),
        blink_rate_range=(5, 10),
        gaze_stability_range=(0.5, 0.7),
        duration_range=(40, 70)
    )
    all_features.append(features)
    all_labels.extend([2] * n_samples_per_class)

    # Class 3: Severe Strain
    features = generate_class_features(
        n_samples=n_samples_per_class,
        ear_mean_range=(0.18, 0.25),
        blink_rate_range=(2, 7),
        gaze_stability_range=(0.3, 0.6),
        duration_range=(60, 120)
    )
    all_features.append(features)
    all_labels.extend([3] * n_samples_per_class)

    # Combine all
    X = np.vstack(all_features)
    y = np.array(all_labels)

    # Shuffle
    indices = np.random.permutation(len(y))
    X = X[indices]
    y = y[indices]

    print(f"✅ Dataset generated: X shape={X.shape}, y shape={y.shape}")
    print(f"   Class distribution: {np.bincount(y)}")

    return X, y


# =====================================================================
#                    MODEL BUILDER
# =====================================================================

def build_fatigue_model(input_dim=21, num_classes=4):
    """
    Build a dense feedforward neural network for fatigue classification.

    Architecture:
        Input (21) -> Dense(128) -> BN -> Dropout(0.3)
                   -> Dense(64)  -> BN -> Dropout(0.3)
                   -> Dense(32)  -> BN -> Dropout(0.2)
                   -> Dense(4, softmax)

    Returns:
        Compiled Keras model
    """
    model = models.Sequential([
        layers.Input(shape=(input_dim,)),

        layers.Dense(128, activation='relu', kernel_regularizer=keras.regularizers.l2(0.001)),
        layers.BatchNormalization(),
        layers.Dropout(0.3),

        layers.Dense(64, activation='relu', kernel_regularizer=keras.regularizers.l2(0.001)),
        layers.BatchNormalization(),
        layers.Dropout(0.3),

        layers.Dense(32, activation='relu', kernel_regularizer=keras.regularizers.l2(0.001)),
        layers.BatchNormalization(),
        layers.Dropout(0.2),

        layers.Dense(num_classes, activation='softmax')
    ])

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=LEARNING_RATE),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    return model


# =====================================================================
#                    TRAINING PIPELINE
# =====================================================================

def train():
    """Main training pipeline."""

    print("\n" + "=" * 70)
    print("   EYEGUARD - FATIGUE CLASSIFICATION MODEL TRAINING")
    print("=" * 70)

    # ─── Step 1: Generate Dataset ───
    print("\n📊 Step 1: Generating synthetic training data...")
    X, y = generate_synthetic_dataset(n_samples_per_class=SAMPLES_PER_CLASS)

    # ─── Step 2: Split Dataset ───
    print("\n✂️  Step 2: Splitting dataset...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SPLIT, random_state=42, stratify=y
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, test_size=VALIDATION_SPLIT, random_state=42, stratify=y_train
    )

    print(f"   Train set:      {X_train.shape[0]} samples")
    print(f"   Validation set: {X_val.shape[0]} samples")
    print(f"   Test set:       {X_test.shape[0]} samples")

    # ─── Step 3: Create and Save Scaler ───
    print("\n📐 Step 3: Creating feature scaler...")
    scaler = StandardScaler()
    scaler.fit(X_train)

    X_train_scaled = scaler.transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    # Save scaler
    joblib.dump(scaler, SCALER_OUTPUT_PATH)
    print(f"   ✅ Scaler saved to: {SCALER_OUTPUT_PATH}")

    # ─── Step 4: Build Model ───
    print(f"\n🧠 Step 4: Building neural network model...")
    model = build_fatigue_model(input_dim=X.shape[1], num_classes=4)
    model.summary()

    # ─── Step 5: Train Model ───
    print(f"\n🏋️  Step 5: Training model for {EPOCHS} epochs...")

    callbacks = [
        EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True,
            verbose=1
        ),
        ModelCheckpoint(
            str(MODEL_OUTPUT_PATH),
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-6,
            verbose=1
        )
    ]

    history = model.fit(
        X_train_scaled, y_train,
        validation_data=(X_val_scaled, y_val),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=callbacks,
        verbose=1
    )

    # ─── Step 6: Evaluate Model ───
    print(f"\n📈 Step 6: Evaluating model on test set...")
    test_loss, test_accuracy = model.evaluate(X_test_scaled, y_test, verbose=0)

    y_pred = np.argmax(model.predict(X_test_scaled, verbose=0), axis=1)
    cm = confusion_matrix(y_test, y_pred)
    report = classification_report(
        y_test, y_pred,
        target_names=[FATIGUE_LABELS[i] for i in range(4)]
    )

    print("\n" + "=" * 70)
    print("   EVALUATION RESULTS")
    print("=" * 70)
    print(f"\n   Test Accuracy: {test_accuracy:.4f} ({test_accuracy*100:.2f}%)")
    print(f"   Test Loss:     {test_loss:.4f}")
    print(f"\n   Confusion Matrix:")
    print(f"   {cm}")
    print(f"\n   Classification Report:")
    print(report)

    # ─── Step 7: Save Final Model ───
    print(f"\n💾 Step 7: Saving trained model...")
    model.save(str(MODEL_OUTPUT_PATH))
    print(f"   ✅ Model saved to: {MODEL_OUTPUT_PATH}")

    # ─── Summary ───
    print("\n" + "=" * 70)
    print("   ✅ TRAINING COMPLETED SUCCESSFULLY!")
    print("=" * 70)
    print(f"\n   📁 Files generated:")
    print(f"      1. {MODEL_OUTPUT_PATH}  (Trained neural network)")
    print(f"      2. {SCALER_OUTPUT_PATH}  (Feature normalizer)")
    print(f"\n   📋 Next steps:")
    print(f"      1. Download both files from Colab")
    print(f"      2. Place them in the  ml-model/  folder of your project")
    print(f"      3. Start the API with:  python api/app.py")
    print("=" * 70 + "\n")

    return model, scaler, history


# =====================================================================
#                         ENTRY POINT
# =====================================================================

if __name__ == "__main__":
    train()
