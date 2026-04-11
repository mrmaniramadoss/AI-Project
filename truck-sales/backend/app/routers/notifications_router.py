from fastapi import APIRouter, Depends, Query

from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def list_notifications(
    unread_only: bool = False,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=50),
    user=Depends(get_current_user),
):
    where = "user_id = ?"
    params: list = [user["id"]]
    if unread_only:
        where += " AND is_read = 0"

    with get_db() as conn:
        total = conn.execute(f"SELECT COUNT(*) FROM notifications WHERE {where}", params).fetchone()[0]
        unread = conn.execute("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0", (user["id"],)).fetchone()[0]
        rows = conn.execute(
            f"SELECT * FROM notifications WHERE {where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            params + [per_page, (page - 1) * per_page],
        ).fetchall()

    return {"items": [dict(r) for r in rows], "total": total, "unread": unread, "page": page}


@router.put("/{notification_id}/read")
def mark_read(notification_id: int, user=Depends(get_current_user)):
    with get_db() as conn:
        conn.execute("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", (notification_id, user["id"]))
    return {"message": "Marked as read"}


@router.put("/read-all")
def mark_all_read(user=Depends(get_current_user)):
    with get_db() as conn:
        conn.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0", (user["id"],))
    return {"message": "All notifications marked as read"}
