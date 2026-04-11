import csv
import io
import json
import pickle
from pathlib import Path

import pandas as pd
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from auth import (
    create_access_token,
    get_current_user,
    get_optional_user,
    hash_password,
    verify_password,
)
from database import get_db, init_db

MODEL_PATH = Path("artifacts/house_price_model.pkl")


# ── Schemas ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    email: str
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    username: str
    password: str


class PredictRequest(BaseModel):
    features: dict[str, float]

    @field_validator("features")
    @classmethod
    def validate_features(cls, value: dict[str, float]) -> dict[str, float]:
        if not value:
            raise ValueError("features must not be empty")

        non_finite = [key for key, val in value.items() if not math.isfinite(val)]
        if non_finite:
            raise ValueError(
                f"Non-finite values are not allowed. "
                f"Invalid features: {', '.join(non_finite)}"
            )

        return value


class PredictResponse(BaseModel):
    predicted_price: float


# ── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(title="House Price Prediction API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


# ── Helpers ──────────────────────────────────────────────────────────────────

def load_artifact() -> dict:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            "Model file not found. Run `python model.py` first to generate the .pkl file."
        )
    with MODEL_PATH.open("rb") as model_file:
        return pickle.load(model_file)


# ── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


# ── Auth ─────────────────────────────────────────────────────────────────────

@app.post("/auth/register")
def register(body: RegisterRequest):
    with get_db() as conn:
        existing = conn.execute(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            (body.username, body.email),
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Username or email already taken")

        hashed = hash_password(body.password)
        cursor = conn.execute(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            (body.username, body.email, hashed),
        )
        user_id = cursor.lastrowid

    token = create_access_token(user_id, body.username)
    return {"token": token, "user": {"id": user_id, "username": body.username, "email": body.email}}


@app.post("/auth/login")
def login(body: LoginRequest):
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, username, email, password FROM users WHERE username = ?",
            (body.username,),
        ).fetchone()

    if row is None or not verify_password(body.password, row["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(row["id"], row["username"])
    return {
        "token": token,
        "user": {"id": row["id"], "username": row["username"], "email": row["email"]},
    }


@app.get("/auth/me")
def me(user: dict = Depends(get_current_user)):
    return user


# ── Predict ──────────────────────────────────────────────────────────────────

@app.post("/predict")
def predict(payload: PredictRequest, user=Depends(get_optional_user)):
    try:
        artifact = load_artifact()
        model = artifact["model"]
        feature_names: list[str] = artifact["feature_names"]

        missing = [name for name in feature_names if name not in payload.features]
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"Missing features: {', '.join(missing)}",
            )

        extra = [name for name in payload.features if name not in feature_names]
        if extra:
            raise HTTPException(
                status_code=422,
                detail=f"Unexpected features: {', '.join(extra)}",
            )

        row = {name: payload.features[name] for name in feature_names}
        input_df = pd.DataFrame([row], columns=feature_names)
        prediction = float(model.predict(input_df)[0])

        # Save prediction if user is logged in
        if user is not None:
            with get_db() as conn:
                conn.execute(
                    "INSERT INTO predictions (user_id, features, predicted_price) VALUES (?, ?, ?)",
                    (user["id"], json.dumps(row), prediction),
                )

        return {"predicted_price": prediction}

    except HTTPException:
        raise
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc


# ── Predictions history ──────────────────────────────────────────────────────

@app.get("/predictions")
def list_predictions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    date_from: str | None = None,
    date_to: str | None = None,
    price_min: float | None = None,
    price_max: float | None = None,
    user: dict = Depends(get_current_user),
):
    offset = (page - 1) * per_page
    conditions = ["user_id = ?"]
    params: list = [user["id"]]

    if date_from:
        conditions.append("created_at >= ?")
        params.append(date_from)
    if date_to:
        conditions.append("created_at <= ?")
        params.append(date_to + " 23:59:59")
    if price_min is not None:
        conditions.append("predicted_price >= ?")
        params.append(price_min)
    if price_max is not None:
        conditions.append("predicted_price <= ?")
        params.append(price_max)

    where = " AND ".join(conditions)

    with get_db() as conn:
        total = conn.execute(f"SELECT COUNT(*) FROM predictions WHERE {where}", params).fetchone()[0]
        rows = conn.execute(
            f"SELECT id, features, predicted_price, created_at FROM predictions WHERE {where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            params + [per_page, offset],
        ).fetchall()

    items = []
    for r in rows:
        items.append({
            "id": r["id"],
            "features": json.loads(r["features"]),
            "predicted_price": r["predicted_price"],
            "created_at": r["created_at"],
        })

    return {"items": items, "total": total, "page": page, "per_page": per_page}


# ── Dashboard stats ──────────────────────────────────────────────────────────

@app.get("/predictions/stats")
def prediction_stats(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        row = conn.execute(
            """
            SELECT
                COUNT(*)           AS total_predictions,
                AVG(predicted_price) AS avg_price,
                MIN(predicted_price) AS min_price,
                MAX(predicted_price) AS max_price
            FROM predictions WHERE user_id = ?
            """,
            (user["id"],),
        ).fetchone()

        recent = conn.execute(
            "SELECT id, features, predicted_price, created_at FROM predictions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5",
            (user["id"],),
        ).fetchall()

        daily = conn.execute(
            """
            SELECT DATE(created_at) AS date, COUNT(*) AS count, AVG(predicted_price) AS avg_price
            FROM predictions WHERE user_id = ?
            GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30
            """,
            (user["id"],),
        ).fetchall()

    return {
        "total_predictions": row["total_predictions"],
        "avg_price": row["avg_price"],
        "min_price": row["min_price"],
        "max_price": row["max_price"],
        "recent": [
            {"id": r["id"], "features": json.loads(r["features"]), "predicted_price": r["predicted_price"], "created_at": r["created_at"]}
            for r in recent
        ],
        "daily": [{"date": d["date"], "count": d["count"], "avg_price": d["avg_price"]} for d in daily],
    }


# ── CSV export ───────────────────────────────────────────────────────────────

@app.get("/predictions/export")
def export_predictions(
    date_from: str | None = None,
    date_to: str | None = None,
    price_min: float | None = None,
    price_max: float | None = None,
    user: dict = Depends(get_current_user),
):
    conditions = ["user_id = ?"]
    params: list = [user["id"]]

    if date_from:
        conditions.append("created_at >= ?")
        params.append(date_from)
    if date_to:
        conditions.append("created_at <= ?")
        params.append(date_to + " 23:59:59")
    if price_min is not None:
        conditions.append("predicted_price >= ?")
        params.append(price_min)
    if price_max is not None:
        conditions.append("predicted_price <= ?")
        params.append(price_max)

    where = " AND ".join(conditions)

    with get_db() as conn:
        rows = conn.execute(
            f"SELECT id, features, predicted_price, created_at FROM predictions WHERE {where} ORDER BY created_at DESC",
            params,
        ).fetchall()

    output = io.StringIO()
    writer = csv.writer(output)

    feature_keys = ["crim", "zn", "indus", "chas", "nox", "rm", "age", "dis", "rad", "tax", "ptratio", "b", "lstat"]
    writer.writerow(["id", "predicted_price", "created_at"] + feature_keys)

    for r in rows:
        features = json.loads(r["features"])
        writer.writerow(
            [r["id"], r["predicted_price"], r["created_at"]]
            + [features.get(k, "") for k in feature_keys]
        )

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=predictions.csv"},
    )
