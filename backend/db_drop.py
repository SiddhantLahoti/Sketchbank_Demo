# backend/db_drop.py
from app.database.database import engine
from app.database.models import Base

def drop_all():
    print("Dropping all existing database tables...")
    Base.metadata.drop_all(bind=engine)
    print("✓ All tables deleted successfully.")

if __name__ == "__main__":
    drop_all()