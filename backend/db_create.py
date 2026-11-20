# backend/db_create.py
from app.database.database import engine
from app.database.models import Base

def create_all():
    print("Creating all database tables from models.py schema...")
    Base.metadata.create_all(bind=engine)
    print("✓ All tables created successfully.")

if __name__ == "__main__":
    create_all()