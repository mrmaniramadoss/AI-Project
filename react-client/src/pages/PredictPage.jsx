import React, { useState } from "react";
import { predictPrice } from "../api";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  crim: 0.00632,
  zn: 18,
  indus: 2.31,
  chas: 0,
  nox: 0.538,
  rm: 6.575,
  age: 65.2,
  dis: 4.09,
  rad: 1,
  tax: 296,
  ptratio: 15.3,
  b: 396.9,
  lstat: 4.98,
};

const fieldConfig = {
  crim: { label: "Crime Rate", description: "Per capita crime rate", min: 0, max: 100 },
  zn: { label: "Residential Land Zone (%)", description: "Land zoned for large lots", min: 0, max: 100 },
  indus: { label: "Non-Retail Business Area (%)", description: "Share of non-retail business acres", min: 0, max: 35 },
  chas: { label: "Charles River (0 or 1)", description: "1 if tract bounds river, else 0", min: 0, max: 1 },
  nox: { label: "Nitric Oxides", description: "NOx concentration level", min: 0.3, max: 0.9 },
  rm: { label: "Average Rooms", description: "Average rooms per dwelling", min: 3, max: 10 },
  age: { label: "Older Homes (%)", description: "Homes built before 1940", min: 0, max: 100 },
  dis: { label: "Distance to Employment", description: "Weighted distance to job centers", min: 1, max: 15 },
  rad: { label: "Highway Access Index", description: "Accessibility to radial highways", min: 1, max: 24 },
  tax: { label: "Property Tax Rate", description: "Per $10,000", min: 180, max: 720 },
  ptratio: { label: "Pupil-Teacher Ratio", description: "By town", min: 12, max: 23 },
  b: { label: "B Score", description: "Demographic index from dataset", min: 0, max: 400 },
  lstat: { label: "Lower Status Population (%)", description: "Percentage in lower status group", min: 1, max: 40 },
};

function validateField(name, value) {
  const { min, max, label } = fieldConfig[name];
  if (Number.isNaN(value)) return `${label} must be a number.`;
  if (value < min || value > max) return `${label} must be between ${min} and ${max}.`;
  return "";
}

export default function PredictPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const numericValue = Number(value);
    setForm((prev) => ({ ...prev, [name]: numericValue }));
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, numericValue) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const nextFieldErrors = Object.keys(form).reduce((errors, key) => {
      const msg = validateField(key, form[key]);
      if (msg) errors[key] = msg;
      return errors;
    }, {});

    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      setPrediction(null);
      setError("Please correct invalid field values before predicting.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await predictPrice(form);
      setPrediction(result.predicted_price);
    } catch (apiError) {
      setPrediction(null);
      setError(apiError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pageContent">
      <div className="card">
        <header className="cardHeader">
          <h1>House Price Prediction</h1>
          <p>Enter property metrics below to estimate median house value.</p>
          {user && <span className="savedBadge">Predictions are saved to your account</span>}
        </header>

        <form onSubmit={handleSubmit} className="formGrid">
          {Object.keys(form).map((key) => (
            <label key={key} className="fieldGroup" htmlFor={key}>
              <span className="fieldLabel">{fieldConfig[key].label}</span>
              <span className="fieldHelp">{fieldConfig[key].description}</span>
              <input
                id={key}
                className={`fieldInput ${fieldErrors[key] ? "fieldInputError" : ""}`}
                type="number"
                step="any"
                name={key}
                value={form[key]}
                min={fieldConfig[key].min}
                max={fieldConfig[key].max}
                onChange={handleChange}
              />
              {fieldErrors[key] && <span className="fieldErrorText">{fieldErrors[key]}</span>}
            </label>
          ))}

          <button className="predictButton" type="submit" disabled={isLoading}>
            {isLoading ? "Predicting..." : "Predict Price"}
          </button>
        </form>

        {prediction !== null && (
          <div className="resultBox">
            Predicted Price: <strong>${prediction.toFixed(2)}</strong>
          </div>
        )}

        {error && <p className="errorText">{error}</p>}
      </div>
    </div>
  );
}
