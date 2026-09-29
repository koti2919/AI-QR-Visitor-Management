from auth import SessionLocal, User, hash_password


ADMIN_NAME = "System Admin"
ADMIN_PHONE = "9000000000"
ADMIN_EMAIL = "admin.aiqr@gmail.com"
ADMIN_PASSWORD = "Admin@12345"


def create_admin():
    db = SessionLocal()

    try:
        existing_email = db.query(User).filter(
            User.email == ADMIN_EMAIL
        ).first()

        if existing_email:
            if existing_email.role != "admin":
                existing_email.role = "admin"
                db.commit()
                print("Existing account promoted to admin.")
            else:
                print("Admin account already exists.")

            print(f"Email: {existing_email.email}")
            print(f"Role: {existing_email.role}")
            return

        existing_phone = db.query(User).filter(
            User.phone == ADMIN_PHONE
        ).first()

        if existing_phone:
            print("This phone number is already used by another account.")
            return

        admin = User(
            name=ADMIN_NAME,
            phone=ADMIN_PHONE,
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            role="admin",
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("Admin account created successfully.")
        print("--------------------------------")
        print(f"Name: {admin.name}")
        print(f"Phone: {admin.phone}")
        print(f"Email: {admin.email}")
        print(f"Role: {admin.role}")
        print(f"Password: {ADMIN_PASSWORD}")

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()