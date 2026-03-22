# 👁️ Eye-Guard

Eye-Guard is a machine learning-based eye strain and fatigue detection system. It uses computer vision to monitor eye metrics and predicts fatigue levels using a lightweight TFLite model.

---

## 📂 Project Structure

| Folder | Description |
| :--- | :--- |
| [**`/api`**](./api) | Contains the Flask API server, Dockerfile, and requirements for the production environment. |
| [**`/datasets`**](./datasets) | Stores the training data (`training_dataset.csv`). |
| [**`/ml-model`**](./ml-model) | Contains the production-ready model (`fatigue_classifier.tflite`) and feature scaler (`feature_scaler.pkl`). |
| [**`/src`**](./src) | This is previous vertion, /src is not used in our project now, it's code for just refference purpose.|
| [**`/training-ml`**](./training-ml) | Scripts designed for training the model (optimized for Google Colab) and converting `.h5` models to `.tflite`. |

---

## 🚀 Getting Started (API)

The easiest way to run the prediction API is via Docker Compose.

### Prerequisites
- Docker and Docker Compose installed.
- Valid model files in `/ml-model/`.

### Running with Docker
```bash
# Build and start the API container
docker compose up --build
```
The API will be available at `http://localhost:8080`.

### Health Check
```bash
GET http://localhost:8080/api/health
```

---

## 🧠 Machine Learning Workflow

1.  **Data**: Raw eye metrics are stored in `datasets/training_dataset.csv`.
2.  **Train**: Use `training-ml/train_fatigue_model.py` (Colab recommended) to train the model and generate `fatigue_classifier.h5`.
3.  **Convert**: Use `training-ml/convert_to_tflite.py` to convert the `.h5` model to a lightweight `.tflite` version.
4.  **Serve**: Move the `.tflite` and `.pkl` files to `ml-model/` and start the API.

---

## 📊 Endpoints

### 1. Predict Fatigue
- **URL**: `/api/predict`
- **Method**: `POST`
- **Body**:
```json
{
  "features": [0.31, 0.01, 0.27, 0.34, 0.31, -0.28, -0.51, 0.00, 20.42, 2.01, 16.59, 25.11, 0.23, 0.90, 0.06, 0.77, 18.47, 7.01, 6.48, 0.0, 0.0]
}
```

### 2. Model Info
- **URL**: `/api/model/info`
- **Method**: `GET`
