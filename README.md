# 👁️ Eye-Guard - ML-Based Eye Strain & Fatigue Detection System

<div align="center">

**Lightweight computer vision-based system to monitor eye metrics and predict fatigue.**

![Python](https://img.shields.io/badge/Python-3.11-blue.svg)
![TensorFlow Lite](https://img.shields.io/badge/TFLite-Lightweight-orange.svg)
![Flask](https://img.shields.io/badge/Flask-API-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-Frontend-black.svg)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success.svg)

**B.Tech Final Year Project | Computer Science & Engineering**

</div>

---

## 🎯 Project Overview

Eye-Guard is a **machine learning-based eye strain and fatigue detection system**. It leverages **computer vision** to continuously monitor eye metrics and predicts fatigue levels using a highly optimized, lightweight **TFLite model**. 

### 🏆 Key Achievements
- ✅ **Lightweight Classification Model** using TensorFlow Lite.
- ✅ **Full-Stack Implementation** with Flask (Backend) and Next.js (Frontend).
- ✅ **Real-Time Data Flow** with frequent interval predictions.
- ✅ **Production-Ready Environment** with Docker Compose.

---

## ✨ Features

### Core Capabilities
- 📹 **Eye Metric Monitoring** - Extracts and analyzes features in real-time.
- 🤖 **Fatigue Prediction** - Lightweight machine learning classifier (TFLite).
- 📊 **Real-Time Dashboard** - Built with Next.js for a modern, responsive UI.
- 📡 **Robust REST API** - Flask API to serve predictions reliably.

### Advanced Features
- 🐳 **Dockerized Setup** - One-command deployment for the backend environment.
- 🧠 **Optimized Workflow** - Dedicated scripts for Google Colab to train the model and convert it to `.tflite`.
- 🔐 **Secure Endpoints** - JWT Verification integration.

---

## 🚀 Quick Start

### Prerequisites
- [Docker](https://www.docker.com/) and Docker Compose installed.
- [Node.js](https://nodejs.org/) (for local frontend development).
- Valid model files (`fatigue_classifier.tflite` and `feature_scaler.pkl`) inside the `/ml-model/` directory.

### Running the API (Docker)
```bash
# Build and start the backend container
docker compose up --build
```
The Flask API will run at `http://localhost:8080`.

### Running the Web Dashboard
```bash
cd web
npm install
npm run dev
```
The Next.js dashboard will be available at `http://localhost:3000`.

---

## 📖 Usage

### 1. Web Dashboard
- Open `http://localhost:3000` in your web browser.
- The dashboard displays the video feed and real-time metrics, updating the Eye Health Score and fatigue predictions automatically.

### 2. Predict Fatigue via API
You can send feature vectors directly to the prediction endpoint for testing or integration.
- **URL**: `http://localhost:8080/api/predict`
- **Method**: `POST`
- **Body**:
```json
{
  "features": [0.31, 0.01, 0.27, 0.34, 0.31, -0.28, -0.51, 0.00, 20.42, 2.01, 16.59, 25.11, 0.23, 0.90, 0.06, 0.77, 18.47, 7.01, 6.48, 0.0, 0.0]
}
```

---

## 🏗️ Architecture

### Technology Stack
- **Machine Learning**: TensorFlow Lite, Scikit-Learn
- **Backend API**: Flask, PyJWT
- **Frontend**: Next.js, React, Tailwind CSS
- **Containerization**: Docker, Docker Compose

### System Components
```
Eye-Guard/
├── api/               # Flask API server, Dockerfile, & requirements
├── datasets/          # Training data (training_dataset.csv)
├── ml-model/          # Production components (fatigue_classifier.tflite, feature_scaler.pkl)
├── web/               # Next.js frontend dashboard application
├── training-ml/       # Model training & TFLite conversion scripts
└── src/               # Deprecated/Reference older version code
```

---

## 🧠 Machine Learning Workflow

1.  **Data Collection**: Raw eye metrics are stored in `datasets/training_dataset.csv`.
2.  **Training**: Run `training-ml/train_fatigue_model.py` (Colab recommended) to train the model and generate `fatigue_classifier.h5`.
3.  **Optimization**: Use `training-ml/convert_to_tflite.py` to convert the `.h5` model to a highly efficient `.tflite` version.
4.  **Deployment**: Place the generated `.tflite` and `.pkl` scaler files into the `ml-model/` directory before starting the API.

---

## 📝 API Documentation

### Endpoints
```
GET  /api/health      - Check API health status
GET  /api/model/info  - Retrieve loaded model information
POST /api/predict     - Predict fatigue based on a 21-feature array
```

*Note: Authentication might be required for certain endpoints using Bearer JWTs.*

---

## 🤝 Contributing

Contributions are always welcome! How to participate:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Team

### Core Development Team

| Name | Role |
|------|------|
| **Gaurav Kumar Mehta** | Lead Developer |
| **Ayan Biswas** | Developer |
| **Arpan Mirsha** | Developer |
| **Arka Bhattacharya** | Developer |

- **Department**: Computer Science & Engineering
- **Academic Year**: 2025-26

---

<div align="center">

### 🏆 Excellence in Academic Software Development

**Eye-Guard - ML-Based Eye Strain Detection System**

Made with ❤️ for better eye health

[⬆ Back to Top](#-eye-guard---ml-based-eye-strain--fatigue-detection-system)

</div>
