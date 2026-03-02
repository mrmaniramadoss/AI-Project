import pickle
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


MODEL_PATH = Path("artifacts/house_price_model.pkl")


class PredictRequest(BaseModel):
    features: dict[str, float]


app = FastAPI(title="House Price Prediction API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_artifact() -> dict:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            "Model file not found. Run `python model.py` first to generate the .pkl file."
        )

    with MODEL_PATH.open("rb") as model_file:
        artifact = pickle.load(model_file)

    return artifact


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict")
def predict(payload: PredictRequest) -> dict:
    try:
        artifact = load_artifact()
        model = artifact["model"]
        feature_names = artifact["feature_names"]

        missing = [name for name in feature_names if name not in payload.features]
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Missing features: {', '.join(missing)}",
            )

        row = {name: float(payload.features[name]) for name in feature_names}
        input_df = pd.DataFrame([row], columns=feature_names)
        prediction = float(model.predict(input_df)[0])

        return {"predicted_price": prediction}

    except HTTPException:
        raise
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc
