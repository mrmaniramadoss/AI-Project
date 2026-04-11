import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.auth import get_current_user, get_optional_user, require_role
from app.database import get_db

router = APIRouter(prefix="/trucks", tags=["trucks"])


class TruckCreate(BaseModel):
    brand: str
    model: str
    year: int = Field(ge=1990, le=2030)
    price: float = Field(gt=0)
    description: str = ""
    fuel_type: str = "diesel"
    load_capacity: float = 0
    mileage: float = 0
    engine_power: str = ""
    transmission: str = "manual"
    body_type: str = ""
    color: str = ""
    condition: str = "new"
    availability: str = "available"
    location: str = ""
    image_urls: list[str] = []


class TruckUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    price: Optional[float] = None
    description: Optional[str] = None
    fuel_type: Optional[str] = None
    load_capacity: Optional[float] = None
    mileage: Optional[float] = None
    engine_power: Optional[str] = None
    transmission: Optional[str] = None
    body_type: Optional[str] = None
    color: Optional[str] = None
    condition: Optional[str] = None
    availability: Optional[str] = None
    location: Optional[str] = None
    image_urls: Optional[list[str]] = None


@router.get("")
def list_trucks(
    brand: Optional[str] = None,
    fuel_type: Optional[str] = None,
    condition: Optional[str] = None,
    transmission: Optional[str] = None,
    availability: Optional[str] = None,
    dealer_id: Optional[int] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    load_min: Optional[float] = None,
    load_max: Optional[float] = None,
    year_min: Optional[int] = None,
    year_max: Optional[int] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=12, ge=1, le=50),
    user=Depends(get_optional_user),
):
    # Save search history if user is logged in
    if user and search:
        filters = json.dumps({
            "brand": brand, "fuel_type": fuel_type, "price_min": price_min,
            "price_max": price_max, "load_min": load_min, "load_max": load_max,
        })
        with get_db() as conn:
            conn.execute(
                "INSERT INTO search_history (user_id, query, filters) VALUES (?, ?, ?)",
                (user["id"], search or "", filters),
            )

    where_clauses = ["1=1"]
    params: list = []

    if brand:
        where_clauses.append("t.brand LIKE ?")
        params.append(f"%{brand}%")
    if fuel_type:
        where_clauses.append("t.fuel_type = ?")
        params.append(fuel_type)
    if condition:
        where_clauses.append("t.condition = ?")
        params.append(condition)
    if transmission:
        where_clauses.append("t.transmission = ?")
        params.append(transmission)
    if availability:
        where_clauses.append("t.availability = ?")
        params.append(availability)
    if dealer_id is not None:
        where_clauses.append("t.dealer_id = ?")
        params.append(dealer_id)
    if price_min is not None:
        where_clauses.append("t.price >= ?")
        params.append(price_min)
    if price_max is not None:
        where_clauses.append("t.price <= ?")
        params.append(price_max)
    if load_min is not None:
        where_clauses.append("t.load_capacity >= ?")
        params.append(load_min)
    if load_max is not None:
        where_clauses.append("t.load_capacity <= ?")
        params.append(load_max)
    if year_min is not None:
        where_clauses.append("t.year >= ?")
        params.append(year_min)
    if year_max is not None:
        where_clauses.append("t.year <= ?")
        params.append(year_max)
    if search:
        where_clauses.append("(t.brand LIKE ? OR t.model LIKE ? OR t.description LIKE ?)")
        params.extend([f"%{search}%"] * 3)

    where_sql = " AND ".join(where_clauses)
    allowed_sorts = {"price", "year", "created_at", "load_capacity", "views", "mileage"}
    sb = sort_by if sort_by in allowed_sorts else "created_at"
    so = "ASC" if sort_order.lower() == "asc" else "DESC"

    with get_db() as conn:
        total = conn.execute(
            f"SELECT COUNT(*) FROM trucks t WHERE {where_sql}", params
        ).fetchone()[0]

        rows = conn.execute(
            f"""SELECT t.*, u.username as dealer_name, u.company as dealer_company
                FROM trucks t JOIN users u ON t.dealer_id = u.id
                WHERE {where_sql} ORDER BY t.{sb} {so}
                LIMIT ? OFFSET ?""",
            params + [per_page, (page - 1) * per_page],
        ).fetchall()

    items = []
    for r in rows:
        d = dict(r)
        d["image_urls"] = json.loads(d.get("image_urls", "[]"))
        items.append(d)

    return {"items": items, "total": total, "page": page, "per_page": per_page}


@router.get("/brands")
def get_brands():
    with get_db() as conn:
        rows = conn.execute("SELECT DISTINCT brand FROM trucks ORDER BY brand").fetchall()
    return [r["brand"] for r in rows]


@router.get("/{truck_id}")
def get_truck(truck_id: int, user=Depends(get_optional_user)):
    with get_db() as conn:
        row = conn.execute(
            """SELECT t.*, u.username as dealer_name, u.company as dealer_company,
                      u.phone as dealer_phone, u.email as dealer_email
               FROM trucks t JOIN users u ON t.dealer_id = u.id WHERE t.id = ?""",
            (truck_id,),
        ).fetchone()
        # Only increment views if the viewer is not the truck's dealer
        if row and not (user and user["id"] == row["dealer_id"]):
            conn.execute("UPDATE trucks SET views = views + 1 WHERE id = ?", (truck_id,))
    if not row:
        raise HTTPException(status_code=404, detail="Truck not found")
    d = dict(row)
    d["image_urls"] = json.loads(d.get("image_urls", "[]"))
    return d


@router.post("")
def create_truck(body: TruckCreate, user=Depends(require_role("dealer", "admin"))):
    with get_db() as conn:
        cursor = conn.execute(
            """INSERT INTO trucks (dealer_id, brand, model, year, price, description,
               fuel_type, load_capacity, mileage, engine_power, transmission,
               body_type, color, condition, availability, location, image_urls)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (user["id"], body.brand, body.model, body.year, body.price,
             body.description, body.fuel_type, body.load_capacity, body.mileage,
             body.engine_power, body.transmission, body.body_type, body.color,
             body.condition, body.availability, body.location, json.dumps(body.image_urls)),
        )
        truck_id = cursor.lastrowid
    return {"id": truck_id, "message": "Truck listed successfully"}


@router.put("/{truck_id}")
def update_truck(truck_id: int, body: TruckUpdate, user=Depends(require_role("dealer", "admin"))):
    with get_db() as conn:
        existing = conn.execute("SELECT dealer_id FROM trucks WHERE id = ?", (truck_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Truck not found")
        if user["role"] != "admin" and existing["dealer_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="Not your truck listing")

        updates = []
        params_list = []
        for field, value in body.model_dump(exclude_none=True).items():
            if field == "image_urls":
                updates.append(f"{field} = ?")
                params_list.append(json.dumps(value))
            else:
                updates.append(f"{field} = ?")
                params_list.append(value)

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        updates.append("updated_at = CURRENT_TIMESTAMP")
        params_list.append(truck_id)
        conn.execute(f"UPDATE trucks SET {', '.join(updates)} WHERE id = ?", params_list)

    return {"message": "Truck updated"}


@router.delete("/{truck_id}")
def delete_truck(truck_id: int, user=Depends(require_role("dealer", "admin"))):
    with get_db() as conn:
        existing = conn.execute("SELECT dealer_id FROM trucks WHERE id = ?", (truck_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Truck not found")
        if user["role"] != "admin" and existing["dealer_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="Not your truck listing")
        try:
            conn.execute("DELETE FROM trucks WHERE id = ?", (truck_id,))
        except Exception:
            raise HTTPException(status_code=409, detail="Cannot delete truck with existing bookings or inquiries")
    return {"message": "Truck deleted"}
