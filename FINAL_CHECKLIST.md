# Final Checklist (Local → Cloud → LinkedIn)

## A) Local demo (what to show in recording)
- [x] Train model and create `.pkl`
  - Run: `python model.py`
- [x] Start API
  - Run: `uvicorn api:app --host 127.0.0.1 --port 8000`
- [x] Start React app
  - Run (inside `react-client`): `npm run dev`
- [x] Open app and submit form
  - URL: `http://127.0.0.1:5173`
- [x] Show API docs
  - URL: `http://127.0.0.1:8000/docs`

## B) Deploy API to Render
- [ ] Push project to GitHub
- [ ] Create Render Web Service from repo
- [ ] Confirm build command: `pip install -r requirements.txt`
- [ ] Confirm start command: `uvicorn api:app --host 0.0.0.0 --port $PORT`
- [ ] Verify health endpoint after deploy: `/health`
- [ ] Verify docs endpoint after deploy: `/docs`

## C) Connect React to deployed API
- [ ] In `react-client`, create `.env`:
  - `VITE_API_BASE_URL=https://<your-render-service>.onrender.com`
- [ ] Restart frontend dev server
- [ ] Re-test prediction from UI

## D) LinkedIn post package
- [ ] Record 30–60s demo (train → API docs → React prediction → cloud URL)
- [ ] Add links in `linkedin_post_template.md`
  - Live API URL
  - Demo video URL
  - GitHub repo URL
- [ ] Post with hashtags already included
