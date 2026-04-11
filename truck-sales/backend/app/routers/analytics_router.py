from fastapi import APIRouter, Depends

from app.auth import require_role
from app.database import get_db

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview")
def get_overview(user=Depends(require_role("admin", "dealer"))):
    with get_db() as conn:
        if user["role"] == "admin":
            trucks_total = conn.execute("SELECT COUNT(*) FROM trucks").fetchone()[0]
            trucks_available = conn.execute("SELECT COUNT(*) FROM trucks WHERE availability = 'available'").fetchone()[0]
            trucks_sold = conn.execute("SELECT COUNT(*) FROM trucks WHERE availability = 'sold'").fetchone()[0]
            leads_total = conn.execute("SELECT COUNT(*) FROM leads").fetchone()[0]
            leads_new = conn.execute("SELECT COUNT(*) FROM leads WHERE status = 'new'").fetchone()[0]
            leads_converted = conn.execute("SELECT COUNT(*) FROM leads WHERE status = 'converted'").fetchone()[0]
            total_revenue = conn.execute("SELECT COALESCE(SUM(amount), 0) FROM bookings WHERE status = 'completed'").fetchone()[0]
            total_users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
            total_dealers = conn.execute("SELECT COUNT(*) FROM users WHERE role = 'dealer'").fetchone()[0]
            total_customers = conn.execute("SELECT COUNT(*) FROM users WHERE role = 'customer'").fetchone()[0]
        else:
            trucks_total = conn.execute("SELECT COUNT(*) FROM trucks WHERE dealer_id = ?", (user["id"],)).fetchone()[0]
            trucks_available = conn.execute("SELECT COUNT(*) FROM trucks WHERE dealer_id = ? AND availability = 'available'", (user["id"],)).fetchone()[0]
            trucks_sold = conn.execute("SELECT COUNT(*) FROM trucks WHERE dealer_id = ? AND availability = 'sold'", (user["id"],)).fetchone()[0]
            leads_total = conn.execute("SELECT COUNT(*) FROM leads WHERE dealer_id = ?", (user["id"],)).fetchone()[0]
            leads_new = conn.execute("SELECT COUNT(*) FROM leads WHERE dealer_id = ? AND status = 'new'", (user["id"],)).fetchone()[0]
            leads_converted = conn.execute("SELECT COUNT(*) FROM leads WHERE dealer_id = ? AND status = 'converted'", (user["id"],)).fetchone()[0]
            total_revenue = conn.execute("SELECT COALESCE(SUM(amount), 0) FROM bookings WHERE dealer_id = ? AND status = 'completed'", (user["id"],)).fetchone()[0]
            total_users = 0
            total_dealers = 0
            total_customers = 0

    return {
        "trucks": {"total": trucks_total, "available": trucks_available, "sold": trucks_sold},
        "leads": {"total": leads_total, "new": leads_new, "converted": leads_converted},
        "revenue": total_revenue,
        "users": {"total": total_users, "dealers": total_dealers, "customers": total_customers},
    }


@router.get("/sales-trends")
def get_sales_trends(user=Depends(require_role("admin", "dealer"))):
    with get_db() as conn:
        if user["role"] == "admin":
            rows = conn.execute(
                """SELECT DATE(created_at) as date, COUNT(*) as count, COALESCE(SUM(amount), 0) as revenue
                   FROM bookings WHERE status IN ('completed', 'confirmed')
                   GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30"""
            ).fetchall()
        else:
            rows = conn.execute(
                """SELECT DATE(created_at) as date, COUNT(*) as count, COALESCE(SUM(amount), 0) as revenue
                   FROM bookings WHERE dealer_id = ? AND status IN ('completed', 'confirmed')
                   GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30""",
                (user["id"],),
            ).fetchall()
    return [dict(r) for r in rows]


@router.get("/lead-stats")
def get_lead_stats(user=Depends(require_role("admin", "dealer"))):
    with get_db() as conn:
        if user["role"] == "admin":
            rows = conn.execute(
                """SELECT status, COUNT(*) as count FROM leads GROUP BY status"""
            ).fetchall()
            monthly = conn.execute(
                """SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
                   FROM leads GROUP BY month ORDER BY month DESC LIMIT 12"""
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT status, COUNT(*) as count FROM leads WHERE dealer_id = ? GROUP BY status",
                (user["id"],),
            ).fetchall()
            monthly = conn.execute(
                """SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
                   FROM leads WHERE dealer_id = ? GROUP BY month ORDER BY month DESC LIMIT 12""",
                (user["id"],),
            ).fetchall()

    return {"by_status": [dict(r) for r in rows], "monthly": [dict(r) for r in monthly]}


@router.get("/top-trucks")
def get_top_trucks(user=Depends(require_role("admin", "dealer"))):
    with get_db() as conn:
        if user["role"] == "admin":
            rows = conn.execute(
                """SELECT t.id, t.brand, t.model, t.price, t.views,
                          COUNT(l.id) as lead_count
                   FROM trucks t LEFT JOIN leads l ON t.id = l.truck_id
                   GROUP BY t.id ORDER BY lead_count DESC, t.views DESC LIMIT 10"""
            ).fetchall()
        else:
            rows = conn.execute(
                """SELECT t.id, t.brand, t.model, t.price, t.views,
                          COUNT(l.id) as lead_count
                   FROM trucks t LEFT JOIN leads l ON t.id = l.truck_id
                   WHERE t.dealer_id = ?
                   GROUP BY t.id ORDER BY lead_count DESC, t.views DESC LIMIT 10""",
                (user["id"],),
            ).fetchall()
    return [dict(r) for r in rows]
