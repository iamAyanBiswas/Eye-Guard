# Training ML

This folder contains a **self-contained** training script that can be run on Google Colab to train the Eyeguard fatigue classification model.

## How to Use

1. Upload `train_fatigue_model.py` to [Google Colab](https://colab.research.google.com/)
2. Run the script (all dependencies are pre-installed on Colab)
3. Download the two output files:
   - `fatigue_classifier.h5`
   - `feature_scaler.pkl`
4. Place them in the `ml-model/` folder

## What the Script Does

1. **Generates** 4,000 synthetic training samples (1,000 per fatigue class)
2. **Splits** data into train (68%) / validation (12%) / test (20%)
3. **Builds** a 3-layer Dense Neural Network with BatchNorm and Dropout
4. **Trains** for up to 50 epochs with early stopping
5. **Evaluates** on the test set and prints accuracy + confusion matrix
6. **Saves** the trained model (`.h5`) and feature scaler (`.pkl`)
