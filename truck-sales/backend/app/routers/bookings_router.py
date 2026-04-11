from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.auth import get_current_user, require_role
from app.database import get_db

router = APIRouter(prefix="/bookings", tags=["bookings"])


class BookingCreate(BaseModel):
    truck_id: int
    amount: float
    payment_method: str = ""
    notes: str = ""


class BookingUpdate(BaseModel):
    status: Optional[str] = None
    payment_id: Optional[str] = None
    notes: Optional[str] = None


@router.post("")
def create_booking(body: BookingCreate, user=Depends(get_current_user)):
    with get_db() as conn:
        truck = conn.execute("SELECT id, dealer_id, availability, price FROM trucks WHERE id = ?", (body.truck_id,)).fetchone()
        if not truck:
            raise HTTPException(status_code=404, detail="Truck not found")
        if truck["availability"] != "available":
            raise HTTPException(status_code=400, detail="Truck is not available for booking")

        cursor = conn.execute(
            "INSERT INTO bookings (truck_id, customer_id, dealer_id, amount, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?)",
            (body.truck_id, user["id"], truck["dealer_id"], body.amount, body.payment_method, body.notes),
        )
        booking_id = cursor.lastrowid

        # Reserve the truck
        conn.execute("UPDATE trucks SET availability = 'reserved' WHERE id = ?", (body.truck_id,))

        # Notify dealer
        conn.execute(
            "INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)",
            (truck["dealer_id"], "new_booking", "New Booking",
             f"New booking from {user['username']} for truck #{body.truck_id}",
             f"/bookings/{booking_id}"),
        )

    return {"id": booking_id, "message": "Booking created successfully"}


@router.get("")
def list_bookings(
    status: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=50),
    user=Depends(get_current_user),
):
    where_clauses = []
    params: list = []

    if user["role"] == "dealer":
        where_clauses.append("b.dealer_id = ?")
        params.append(user["id"])
    elif user["role"] == "customer":
        where_clauses.append("b.customer_id = ?")
        params.append(user["id"])

    if status:
        where_clauses.append("b.status = ?")
        params.append(status)

    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"

    with get_db() as conn:
        total = conn.execute(f"SELECT COUNT(*) FROM bookings b WHERE {where_sql}", params).fetchone()[0]
        rows = conn.execute(
            f"""SELECT b.*, t.brand, t.model, t.price as truck_price, t.image_urls,
                       cu.username as customer_name,
                       du.username as dealer_name, du.company as dealer_company
                FROM bookings b
                JOIN trucks t ON b.truck_id = t.id
                JOIN users cu ON b.customer_id = cu.id
                JOIN users du ON b.dealer_id = du.id
                WHERE {where_sql}
                ORDER BY b.created_at DESC LIMIT ? OFFSET ?""",
            params + [per_page, (page - 1) * per_page],
        ).fetchall()

    return {"items": [dict(r) for r in rows], "total": total, "page": page}


@router.put("/{booking_id}")
def update_booking(booking_id: int, body: BookingUpdate, user=Depends(get_current_user)):
    with get_db() as conn:
        booking = conn.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,)).fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if user["role"] == "dealer" and booking["dealer_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="Not your booking")
        if user["role"] == "customer" and booking["customer_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="Not your booking")

        updates = []
        params_list = []
        if body.status:
            valid = ("pending", "confirmed", "cancelled", "completed")
            if body.status not in valid:
                raise HTTPException(status_code=400, detail=f"Status must be one of {valid}")
            if user["role"] == "customer" and body.status in ("confirmed", "completed"):
                raise HTTPException(status_code=403, detail="Only dealers can confirm or complete bookings")
            updates.append("status = ?")
            params_list.append(body.status)

            # Update truck availability based on booking status
            if body.status == "completed":
                conn.execute("UPDATE trucks SET availability = 'sold' WHERE id = ?", (booking["truck_id"],))
            elif body.status == "cancelled":
                conn.execute("UPDATE trucks SET availability = 'available' WHERE id = ?", (booking["truck_id"],))

        if body.payment_id is not None:
            updates.append("payment_id = ?")
            params_list.append(body.payment_id)
        if body.notes is not None:
            updates.append("notes = ?")
            params_list.append(body.notes)

        if updates:
            params_list.append(booking_id)
            conn.execute(f"UPDATE bookings SET {', '.join(updates)} WHERE id = ?", params_list)

            # Notify the other party
            notify_user = booking["customer_id"] if user["role"] == "dealer" else booking["dealer_id"]
            conn.execute(
                "INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)",
                (notify_user, "booking_update", "Booking Updated",
                 f"Booking #{booking_id} status changed to {body.status or 'updated'}",
                 f"/bookings/{booking_id}"),
            )

    return {"message": "Booking updated"}
