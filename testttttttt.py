from sqlalchemy import text
from app.database import engine

def test_connection():
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT current_database(), current_user")
            )
            db_name, user = result.fetchone()

            print("Connected Successfully.")
            print(f"Database Name: {db_name}")
            print(f"User: {user}")

            # Fetch all tables in public schema
            tables = conn.execute(
                text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
            )

            print("\nTables:")
            for row in tables:
                print(f" - {row[0]}")

    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    test_connection()








# في qwen رابط الليند الجديد
# crud/notification, crud/recording 
