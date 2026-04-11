import hashlib
import pickle
from pathlib import Path

import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split


DATA_PATH = Path("Test.csv")
ARTIFACTS_DIR = Path("artifacts")
MODEL_PATH = ARTIFACTS_DIR / "house_price_model.pkl"
MODEL_HASH_PATH = ARTIFACTS_DIR / "house_price_model.sha256"


def train_and_save_model() -> None:
    df = pd.read_csv(DATA_PATH)

    print("Dataset Preview:")
    print(df.head())

    X = df.drop("medv", axis=1)
    y = df["medv"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = LinearRegression()
    model.fit(X_train, y_train)

    accuracy = model.score(X_test, y_test)
    print("Model Accuracy:", accuracy)

    sample_house = X.iloc[0:1]
    prediction = model.predict(sample_house)
    print("Actual Price:", y.iloc[0])
    print("Predicted Price:", prediction[0])

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    with MODEL_PATH.open("wb") as model_file:
        pickle.dump(
            {
                "model": model,
                "feature_names": list(X.columns),
                "target_name": "medv",
            },
            model_file,
        )

    model_hash = hashlib.sha256(MODEL_PATH.read_bytes()).hexdigest()
    MODEL_HASH_PATH.write_text(model_hash)

    print(f"Model saved to: {MODEL_PATH}")
    print(f"Model hash saved to: {MODEL_HASH_PATH}")


if __name__ == "__main__":
    train_and_save_model()
