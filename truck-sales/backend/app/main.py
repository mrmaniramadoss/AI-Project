import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import (
    analytics_router,
    auth_router,
    bookings_router,
    chat_router,
    leads_router,
    notifications_router,
    recommendations_router,
    trucks_router,
)


@asynccontextmanager
async def lifespan(application: FastAPI):
    init_db()
    # Seed admin user if not exists
    from app.auth import hash_password
    from app.database import get_db
    with get_db() as conn:
        admin = conn.execute("SELECT id FROM users WHERE username = 'admin'").fetchone()
        if not admin:
            conn.execute(
                "INSERT INTO users (username, email, password, role, full_name) VALUES (?, ?, ?, ?, ?)",
                ("admin", "admin@trucksales.com", hash_password("admin123"), "admin", "System Admin"),
            )
    yield


app = FastAPI(title="Truck Sales & Marketing API", lifespan=lifespan)

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(auth_router.router)
app.include_router(trucks_router.router)
app.include_router(leads_router.router)
app.include_router(bookings_router.router)
app.include_router(chat_router.router)
app.include_router(notifications_router.router)
app.include_router(analytics_router.router)
app.include_router(recommendations_router.router)


# WebSocket connection manager for real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        self.active_connections[channel].append(websocket)

    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.active_connections:
            self.active_connections[channel] = [
                ws for ws in self.active_connections[channel] if ws != websocket
            ]

    async def broadcast(self, channel: str, message: dict):
        if channel in self.active_connections:
            dead = []
            for ws in self.active_connections[channel]:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.active_connections[channel] = [
                    c for c in self.active_connections[channel] if c != ws
                ]


manager = ConnectionManager()


@app.websocket("/ws/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str):
    await manager.connect(websocket, channel)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                msg["channel"] = channel
                await manager.broadcast(channel, msg)
            except json.JSONDecodeError:
                await manager.broadcast(channel, {"message": data, "channel": channel})
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
