from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.auth import get_current_user, require_role
from app.database import get_db

router = APIRouter(prefix="/leads", tags=["leads"])


class LeadCreate(BaseModel):
    truck_id: int
    message: str = ""
    phone: str = ""
    email: str = ""
    budget: float = 0


class LeadUpdate(BaseModel):
    status: Optional[str] = None
    message: Optional[str] = None


@router.post("")
def create_lead(body: LeadCreate, user=Depends(get_current_user)):
    with get_db() as conn:
        truck = conn.execute("SELECT id, dealer_id FROM trucks WHERE id = ?", (body.truck_id,)).fetchone()
        if not truck:
            raise HTTPException(status_code=404, detail="Truck not found")

        existing = conn.execute(
            "SELECT id FROM leads WHERE truck_id = ? AND customer_id = ? AND status NOT IN ('converted','lost')",
            (body.truck_id, user["id"]),
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="You already have an active inquiry for this truck")

        cursor = conn.execute(
            "INSERT INTO leads (truck_id, customer_id, dealer_id, message, phone, email, budget) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (body.truck_id, user["id"], truck["dealer_id"], body.message, body.phone or user.get("phone", ""), body.email or user.get("email", ""), body.budget),
        )
        lead_id = cursor.lastrowid

        # Create notification for dealer
        conn.execute(
            "INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)",
            (truck["dealer_id"], "new_lead", "New Inquiry",
             f"New inquiry from {user['username']} for truck #{body.truck_id}",
             f"/leads/{lead_id}"),
        )

    return {"id": lead_id, "message": "Inquiry submitted successfully"}


@router.get("")
def list_leads(
    status: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=50),
    user=Depends(get_current_user),
):
    where_clauses = []
    params: list = []

    if user["role"] == "dealer":
        where_clauses.append("l.dealer_id = ?")
        params.append(user["id"])
    elif user["role"] == "customer":
        where_clauses.append("l.customer_id = ?")
        params.append(user["id"])
    # admin sees all

    if status:
        where_clauses.append("l.status = ?")
        params.append(status)

    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"

    with get_db() as conn:
        total = conn.execute(f"SELECT COUNT(*) FROM leads l WHERE {where_sql}", params).fetchone()[0]
        rows = conn.execute(
            f"""SELECT l.*, t.brand, t.model, t.price as truck_price, t.image_urls,
                       cu.username as customer_name, cu.email as customer_email, cu.phone as customer_phone,
                       du.username as dealer_name, du.company as dealer_company
                FROM leads l
                JOIN trucks t ON l.truck_id = t.id
                JOIN users cu ON l.customer_id = cu.id
                JOIN users du ON l.dealer_id = du.id
                WHERE {where_sql}
                ORDER BY l.created_at DESC LIMIT ? OFFSET ?""",
            params + [per_page, (page - 1) * per_page],
        ).fetchall()

    return {"items": [dict(r) for r in rows], "total": total, "page": page}


@router.put("/{lead_id}")
def update_lead(lead_id: int, body: LeadUpdate, user=Depends(get_current_user)):
    with get_db() as conn:
        lead = conn.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)).fetchone()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        if user["role"] == "dealer" and lead["dealer_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="Not your lead")
        if user["role"] == "customer" and lead["customer_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="Not your inquiry")

        updates = []
        params_list = []
        if body.status:
            if body.status not in ("new", "contacted", "negotiating", "converted", "lost"):
                raise HTTPException(status_code=400, detail="Invalid status")
            updates.append("status = ?")
            params_list.append(body.status)
        if body.message is not None:
            updates.append("message = ?")
            params_list.append(body.message)

        if updates:
            updates.append("updated_at = CURRENT_TIMESTAMP")
            params_list.append(lead_id)
            conn.execute(f"UPDATE leads SET {', '.join(updates)} WHERE id = ?", params_list)

            # Notify the other party
            notify_user = lead["customer_id"] if user["role"] in ("dealer", "admin") else lead["dealer_id"]
            conn.execute(
                "INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)",
                (notify_user, "lead_update", "Inquiry Updated",
                 f"Inquiry #{lead_id} status changed to {body.status or 'updated'}",
                 f"/leads/{lead_id}"),
            )

    return {"message": "Lead updated"}
