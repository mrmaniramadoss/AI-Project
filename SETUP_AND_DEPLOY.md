# End-to-End Setup (Model → API → React → Cloud)

## 1) Save model as `.pkl`
```bash
python model.py
```
This creates:
- `artifacts/house_price_model.pkl`

## 2) Start prediction API
```bash
pip install -r requirements.txt
uvicorn api:app --reload
```
API URL: `http://127.0.0.1:8000`
- Health: `GET /health`
- Predict: `POST /predict`

Example request:
```json
{
  "features": {
    "crim": 0.00632,
    "zn": 18,
    "indus": 2.31,
    "chas": 0,
    "nox": 0.538,
    "rm": 6.575,
    "age": 65.2,
    "dis": 4.09,
    "rad": 1,
    "tax": 296,
    "ptratio": 15.3,
    "b": 396.9,
    "lstat": 4.98
  }
}
```

## 3) Connect to React
Use these files in your React app:
- `react-client/src/api.js`
- `react-client/src/App.jsx`

If your React app runs on another port/domain, keep CORS enabled in `api.py`.

## 4) Deploy to cloud (Render)
1. Push this project to GitHub
2. In Render, create a **Web Service** from your repo
3. Render detects `render.yaml` automatically
4. Ensure start command is:
   `uvicorn api:app --host 0.0.0.0 --port $PORT`
5. After deploy, test:
   - `https://<your-service>.onrender.com/health`
   - `https://<your-service>.onrender.com/docs`

## 5) Record demo for LinkedIn
- Show local API response in browser (`/docs`)
- Show React form prediction
- Show deployed URL working
- Post with the template in `linkedin_post_template.md`
