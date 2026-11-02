FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir numpy pandas scikit-learn joblib
COPY src/ ./src/
COPY data/ ./data/
COPY models/ ./models/
EXPOSE 5001
CMD ["python", "src/ml_service.py"]
