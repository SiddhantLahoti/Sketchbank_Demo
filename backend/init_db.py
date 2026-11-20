# backend/init_db.py
from app.database.database import engine, SessionLocal, Base
from app.database import models

def setup_database():
    print("Creating all tables in Supabase...")
    Base.metadata.create_all(bind=engine)
    print("Tables successfully created!")

    db = SessionLocal()
    try:
        # Seed Default Roles
        if not db.query(models.Role).first():
            roles = [models.Role(role_name="Admin"), models.Role(role_name="Designer")]
            db.add_all(roles)
            db.commit()
            print("Default roles added.")

        # Seed Main Categories
        if not db.query(models.MainCategory).first():
            main_cats = ["Ring", "Earring", "Necklace", "Bangle", "Bracelet", "Pendant"]
            db.add_all([models.MainCategory(name=c) for c in main_cats])
            db.commit()
            print("Main categories added.")

        # Seed Metals
        if not db.query(models.MetalType).first():
            metals = ["White gold", "Yellow gold", "Rose gold", "Silver", "Platinum"]
            db.add_all([models.MetalType(name=m) for m in metals])
            db.commit()
            print("Metal types added.")

        # Seed Diamond Types
        if not db.query(models.DiamondType).first():
            d_types = ["LGD", "Mining", "Both"]
            db.add_all([models.DiamondType(name=d) for d in d_types])
            db.commit()
            print("Diamond types added.")

        # Seed Sample Designers
        if not db.query(models.Designer).first():
            designers = ["Anurag", "Sandip", "Raju", "Snehal", "Imanur", "Asmita", "Farooq", "Jijai", "Khushbu", "Poonam"]
            db.add_all([models.Designer(name=d) for d in designers])
            db.commit()
            print("Designers added.")

    finally:
        db.close()

if __name__ == "__main__":
    setup_database()