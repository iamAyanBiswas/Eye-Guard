# ================================================================
#   EYEGUARD API - Ultra-lightweight Dockerfile
#   Python 3.11 | Flask | TFLite Runtime
#   Final image: ~120 MB (vs ~1.5 GB with full tensorflow)
# ================================================================

FROM python:3.11-slim

WORKDIR /app

# Install only curl for healthcheck, nothing else
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps (tflite-runtime is ~5 MB vs tensorflow ~500 MB)
COPY api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy API source
COPY api/app.py ./api/app.py

# Copy model files directly into image (they're tiny: ~225 KB total)
COPY ml-model/fatigue_classifier.tflite ./ml-model/fatigue_classifier.tflite
COPY ml-model/feature_scaler.pkl ./ml-model/feature_scaler.pkl

EXPOSE 8080

# Model loads on startup — container exits immediately if model is missing
CMD ["python", "api/app.py"]
