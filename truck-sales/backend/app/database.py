import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.getenv("DATABASE_PATH", "/data/app.db" if os.path.isdir("/data") else "data.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('admin','dealer','customer')),
            full_name TEXT DEFAULT '',
            phone TEXT DEFAULT '',
            company TEXT DEFAULT '',
            avatar_url TEXT DEFAULT '',
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS trucks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dealer_id INTEGER NOT NULL,
            brand TEXT NOT NULL,
            model TEXT NOT NULL,
            year INTEGER NOT NULL,
            price REAL NOT NULL,
            description TEXT DEFAULT '',
            fuel_type TEXT DEFAULT 'diesel' CHECK(fuel_type IN ('diesel','electric','cng','petrol','hybrid')),
            load_capacity REAL DEFAULT 0,
            mileage REAL DEFAULT 0,
            engine_power TEXT DEFAULT '',
            transmission TEXT DEFAULT 'manual' CHECK(transmission IN ('manual','automatic')),
            body_type TEXT DEFAULT '',
            color TEXT DEFAULT '',
            condition TEXT DEFAULT 'new' CHECK(condition IN ('new','used','certified')),
            availability TEXT DEFAULT 'available' CHECK(availability IN ('available','sold','reserved','maintenance')),
            location TEXT DEFAULT '',
            image_urls TEXT DEFAULT '[]',
            views INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (dealer_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            truck_id INTEGER NOT NULL,
            customer_id INTEGER NOT NULL,
            dealer_id INTEGER NOT NULL,
            status TEXT DEFAULT 'new' CHECK(status IN ('new','contacted','negotiating','converted','lost')),
            message TEXT DEFAULT '',
            phone TEXT DEFAULT '',
            email TEXT DEFAULT '',
            budget REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (truck_id) REFERENCES trucks(id),
            FOREIGN KEY (customer_id) REFERENCES users(id),
            FOREIGN KEY (dealer_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            truck_id INTEGER NOT NULL,
            customer_id INTEGER NOT NULL,
            dealer_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','cancelled','completed')),
            payment_method TEXT DEFAULT '',
            payment_id TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (truck_id) REFERENCES trucks(id),
            FOREIGN KEY (customer_id) REFERENCES users(id),
            FOREIGN KEY (dealer_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            truck_id INTEGER,
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (receiver_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            link TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS search_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            query TEXT NOT NULL,
            filters TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE INDEX IF NOT EXISTS idx_trucks_brand ON trucks(brand);
        CREATE INDEX IF NOT EXISTS idx_trucks_price ON trucks(price);
        CREATE INDEX IF NOT EXISTS idx_trucks_fuel ON trucks(fuel_type);
        CREATE INDEX IF NOT EXISTS idx_trucks_availability ON trucks(availability);
        CREATE INDEX IF NOT EXISTS idx_trucks_dealer ON trucks(dealer_id);
        CREATE INDEX IF NOT EXISTS idx_leads_dealer ON leads(dealer_id);
        CREATE INDEX IF NOT EXISTS idx_leads_customer ON leads(customer_id);
        CREATE INDEX IF NOT EXISTS idx_chat_sender ON chat_messages(sender_id);
        CREATE INDEX IF NOT EXISTS idx_chat_receiver ON chat_messages(receiver_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
        """)
