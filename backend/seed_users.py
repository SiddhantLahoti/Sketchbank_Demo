# backend/seed_users.py
from passlib.context import CryptContext
from app.database.database import SessionLocal
from app.database import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_demo_users():
    db = SessionLocal()
    try:
        # Default password for testing
        test_password = "sketch123"
        hashed = pwd_context.hash(test_password)

        users_to_add = [
            {"username": "anurag", "email": "anurag@company.com", "role_id": 2},
            {"username": "sandip", "email": "sandip@company.com", "role_id": 2}
        ]

        for user_data in users_to_add:
            existing = db.query(models.User).filter(models.User.username == user_data["username"]).first()
            if not existing:
                new_user = models.User(
                    username=user_data["username"],
                    email=user_data["email"],
                    hashed_password=hashed,
                    role_id=user_data["role_id"]
                )
                db.add(new_user)
                print(f"Created user: {user_data['username']} (password: {test_password})")
            else:
                print(f"User {user_data['username']} already exists.")

        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_users()