import json
from collections import Counter

from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("")
def get_recommendations(limit: int = 6, user=Depends(get_current_user)):
    """AI-based truck recommendations based on user's search behavior and viewing history."""
    with get_db() as conn:
        # Get user's search history
        searches = conn.execute(
            "SELECT query, filters FROM search_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
            (user["id"],),
        ).fetchall()

        # Get user's lead history (trucks they inquired about)
        leads = conn.execute(
            """SELECT t.brand, t.fuel_type, t.price, t.load_capacity, t.condition
               FROM leads l JOIN trucks t ON l.truck_id = t.id
               WHERE l.customer_id = ? ORDER BY l.created_at DESC LIMIT 10""",
            (user["id"],),
        ).fetchall()

        # Build preference profile
        preferred_brands: Counter = Counter()
        preferred_fuel: Counter = Counter()
        price_points: list[float] = []
        load_points: list[float] = []

        for s in searches:
            try:
                filters = json.loads(s["filters"])
                if filters.get("brand"):
                    preferred_brands[filters["brand"]] += 1
                if filters.get("fuel_type"):
                    preferred_fuel[filters["fuel_type"]] += 1
                if filters.get("price_min"):
                    price_points.append(float(filters["price_min"]))
                if filters.get("price_max"):
                    price_points.append(float(filters["price_max"]))
            except (json.JSONDecodeError, TypeError):
                pass

            if s["query"]:
                words = s["query"].lower().split()
                for w in words:
                    preferred_brands[w] += 1

        for lead in leads:
            preferred_brands[lead["brand"].lower()] += 2
            preferred_fuel[lead["fuel_type"]] += 2
            price_points.append(lead["price"])
            if lead["load_capacity"]:
                load_points.append(lead["load_capacity"])

        # Build recommendation query
        where_clauses = ["t.availability = 'available'"]
        params: list = []
        order_parts = []

        # Exclude trucks user already inquired about
        inquired = conn.execute(
            "SELECT truck_id FROM leads WHERE customer_id = ?", (user["id"],)
        ).fetchall()
        inquired_ids = [r["truck_id"] for r in inquired]
        if inquired_ids:
            placeholders = ",".join("?" * len(inquired_ids))
            where_clauses.append(f"t.id NOT IN ({placeholders})")
            params.extend(inquired_ids)

        # Score-based ordering using preferences
        if preferred_brands:
            top_brands = [b for b, _ in preferred_brands.most_common(3)]
            brand_cases = " ".join(f"WHEN LOWER(t.brand) LIKE '%' || ? || '%' THEN {3 - i}" for i, _ in enumerate(top_brands))
            order_parts.append(f"(CASE {brand_cases} ELSE 0 END)")
            params_for_brand = list(top_brands)
        else:
            params_for_brand = []

        if preferred_fuel:
            top_fuel = preferred_fuel.most_common(1)[0][0]
            order_parts.append(f"(CASE WHEN t.fuel_type = ? THEN 2 ELSE 0 END)")
            params_for_fuel = [top_fuel]
        else:
            params_for_fuel = []

        where_sql = " AND ".join(where_clauses)

        if order_parts:
            # Build the full query with scoring
            score_expr = " + ".join(order_parts)
            all_params = params + params_for_brand + params_for_fuel + [limit]
            rows = conn.execute(
                f"""SELECT t.*, u.username as dealer_name, u.company as dealer_company,
                           ({score_expr}) as relevance_score
                    FROM trucks t JOIN users u ON t.dealer_id = u.id
                    WHERE {where_sql}
                    ORDER BY relevance_score DESC, t.views DESC, t.created_at DESC
                    LIMIT ?""",
                all_params,
            ).fetchall()
        else:
            # No preferences yet - return popular trucks
            rows = conn.execute(
                f"""SELECT t.*, u.username as dealer_name, u.company as dealer_company,
                           0 as relevance_score
                    FROM trucks t JOIN users u ON t.dealer_id = u.id
                    WHERE {where_sql}
                    ORDER BY t.views DESC, t.created_at DESC
                    LIMIT ?""",
                params + [limit],
            ).fetchall()

    results = []
    for r in rows:
        d = dict(r)
        d["image_urls"] = json.loads(d.get("image_urls", "[]"))
        results.append(d)

    return {
        "items": results,
        "preferences": {
            "brands": [b for b, _ in preferred_brands.most_common(3)],
            "fuel_types": [f for f, _ in preferred_fuel.most_common(2)],
            "avg_price": sum(price_points) / len(price_points) if price_points else None,
        },
    }
