# AI-Project

End-to-end House Price Prediction project using:
- Python + scikit-learn for model training
- FastAPI for prediction API
- React (Vite) frontend for user input and predictions

## Run locally

### 1) Train model
```bash
python model.py
```

### 2) Start API
```bash
uvicorn api:app --host 127.0.0.1 --port 8000
```

### 3) Start React app
```bash
cd react-client
npm install
npm run dev
```

## API endpoint
- `POST /predict`

## Author
Mani
