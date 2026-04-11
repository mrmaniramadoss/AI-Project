from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessageCreate(BaseModel):
    receiver_id: int
    truck_id: Optional[int] = None
    message: str


@router.post("")
def send_message(body: ChatMessageCreate, user=Depends(get_current_user)):
    with get_db() as conn:
        receiver = conn.execute("SELECT id, username FROM users WHERE id = ?", (body.receiver_id,)).fetchone()
        if not receiver:
            raise HTTPException(status_code=404, detail="Receiver not found")

        cursor = conn.execute(
            "INSERT INTO chat_messages (sender_id, receiver_id, truck_id, message) VALUES (?, ?, ?, ?)",
            (user["id"], body.receiver_id, body.truck_id, body.message),
        )
        msg_id = cursor.lastrowid

        # Create notification for receiver
        conn.execute(
            "INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)",
            (body.receiver_id, "new_message", "New Message",
             f"New message from {user['username']}",
             f"/chat?user={user['id']}"),
        )

    return {"id": msg_id, "message": "Message sent"}


@router.get("/conversations")
def get_conversations(user=Depends(get_current_user)):
    with get_db() as conn:
        rows = conn.execute(
            """SELECT DISTINCT
                CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_user_id,
                MAX(created_at) as last_message_at
               FROM chat_messages
               WHERE sender_id = ? OR receiver_id = ?
               GROUP BY other_user_id
               ORDER BY last_message_at DESC""",
            (user["id"], user["id"], user["id"]),
        ).fetchall()

        conversations = []
        for r in rows:
            other = conn.execute(
                "SELECT id, username, full_name, role, avatar_url FROM users WHERE id = ?",
                (r["other_user_id"],),
            ).fetchone()
            if other:
                unread = conn.execute(
                    "SELECT COUNT(*) FROM chat_messages WHERE sender_id = ? AND receiver_id = ? AND is_read = 0",
                    (r["other_user_id"], user["id"]),
                ).fetchone()[0]
                last_msg = conn.execute(
                    """SELECT message, sender_id, created_at FROM chat_messages
                       WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
                       ORDER BY created_at DESC LIMIT 1""",
                    (user["id"], r["other_user_id"], r["other_user_id"], user["id"]),
                ).fetchone()
                conversations.append({
                    "user": dict(other),
                    "unread_count": unread,
                    "last_message": dict(last_msg) if last_msg else None,
                })

    return conversations


@router.get("/messages/{other_user_id}")
def get_messages(
    other_user_id: int,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=100),
    user=Depends(get_current_user),
):
    with get_db() as conn:
        # Mark messages as read
        conn.execute(
            "UPDATE chat_messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0",
            (other_user_id, user["id"]),
        )

        total = conn.execute(
            """SELECT COUNT(*) FROM chat_messages
               WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)""",
            (user["id"], other_user_id, other_user_id, user["id"]),
        ).fetchone()[0]

        rows = conn.execute(
            """SELECT cm.*, u.username as sender_name
               FROM chat_messages cm JOIN users u ON cm.sender_id = u.id
               WHERE (cm.sender_id = ? AND cm.receiver_id = ?) OR (cm.sender_id = ? AND cm.receiver_id = ?)
               ORDER BY cm.created_at DESC LIMIT ? OFFSET ?""",
            (user["id"], other_user_id, other_user_id, user["id"], per_page, (page - 1) * per_page),
        ).fetchall()

    return {"items": [dict(r) for r in rows], "total": total, "page": page}
