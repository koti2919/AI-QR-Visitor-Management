from datetime import datetime, timedelta
from pathlib import Path
import re

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from pwdlib import PasswordHash
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base, Session


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

DATABASE_URL = f"sqlite:///{BASE_DIR / 'visitors.db'}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


# ============================================================
# JWT CONFIGURATION
# ============================================================

SECRET_KEY = "AI_SMART_VISITOR_MANAGEMENT_SECRET_KEY_2026_CHANGE_LATER"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24


# ============================================================
# PASSWORD CONFIGURATION
# ============================================================

password_hash = PasswordHash.recommended()

security = HTTPBearer()


# ============================================================
# USER MODEL
# ============================================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String,
        nullable=False,
    )

    phone = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash = Column(
        String,
        nullable=False,
    )

    role = Column(
        String,
        default="visitor",
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.now,
    )


# ============================================================
# CREATE TABLES
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_auth_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ============================================================
# VALIDATION PATTERNS
# ============================================================

GMAIL_PATTERN = re.compile(
    r"^[A-Za-z0-9._%+-]+@gmail\.com$"
)

PHONE_PATTERN = re.compile(
    r"^\d{10}$"
)


# ============================================================
# REQUEST MODELS
# ============================================================

class SignupRequest(BaseModel):

    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    phone: str = Field(
        ...,
        pattern=r"^\d{10}$",
    )

    email: str = Field(
        ...,
        pattern=r"^[A-Za-z0-9._%+-]+@gmail\.com$",
    )

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
    )


class LoginRequest(BaseModel):

    email: str = Field(
        ...,
        pattern=r"^[A-Za-z0-9._%+-]+@gmail\.com$",
    )

    password: str = Field(
        ...,
        min_length=1,
        max_length=128,
    )


# ============================================================
# PASSWORD VALIDATION
# ============================================================

def validate_password(password: str):

    if len(password) < 8:

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters.",
        )

    if not re.search(r"[A-Z]", password):

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one uppercase letter.",
        )

    if not re.search(r"[a-z]", password):

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one lowercase letter.",
        )

    if not re.search(r"\d", password):

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one number.",
        )

    if not re.search(r"[^A-Za-z0-9]", password):

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one special character.",
        )


# ============================================================
# PASSWORD HASHING
# ============================================================

def hash_password(password: str) -> str:

    return password_hash.hash(password)


def verify_password(
    password: str,
    hashed_password: str,
) -> bool:

    return password_hash.verify(
        password,
        hashed_password,
    )


# ============================================================
# CREATE JWT TOKEN
# ============================================================

def create_access_token(user: User):

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


# ============================================================
# GET CURRENT USER
# ============================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("sub")

        if not user_id:

            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token.",
            )

        db = SessionLocal()

        try:

            user = (
                db.query(User)
                .filter(User.id == int(user_id))
                .first()
            )

            if not user:

                raise HTTPException(
                    status_code=401,
                    detail="User account not found.",
                )

            return user

        finally:

            db.close()

    except jwt.ExpiredSignatureError:

        raise HTTPException(
            status_code=401,
            detail="Authentication token has expired.",
        )

    except jwt.InvalidTokenError:

        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
        )


# ============================================================
# ADMIN AUTHORIZATION
# ============================================================

def require_admin(
    current_user: User = Depends(get_current_user),
):

    if current_user.role != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )

    return current_user


# ============================================================
# AUTOMATIC ADMIN CREATION
# ============================================================

def create_default_admin():

    db = SessionLocal()

    try:

        admin_email = "admin.aiqr@gmail.com"

        admin_phone = "9000000000"

        admin_password = "Admin@12345"

        existing_admin = (
            db.query(User)
            .filter(User.email == admin_email)
            .first()
        )

        # ----------------------------------------------------
        # ADMIN DOES NOT EXIST
        # ----------------------------------------------------

        if not existing_admin:

            admin = User(
                name="System Admin",
                phone=admin_phone,
                email=admin_email,
                password_hash=hash_password(
                    admin_password
                ),
                role="admin",
            )

            db.add(admin)

            db.commit()

            print(
                "=========================================="
            )

            print(
                "DEFAULT ADMIN ACCOUNT CREATED"
            )

            print(
                "Email: admin.aiqr@gmail.com"
            )

            print(
                "Password: Admin@12345"
            )

            print(
                "=========================================="
            )

        # ----------------------------------------------------
        # ADMIN ALREADY EXISTS
        # ----------------------------------------------------

        else:

            changed = False

            if existing_admin.role != "admin":

                existing_admin.role = "admin"

                changed = True

            if existing_admin.phone != admin_phone:

                existing_admin.phone = admin_phone

                changed = True

            if changed:

                db.commit()

            print(
                "Default admin account already exists."
            )

    except Exception as error:

        db.rollback()

        print(
            f"Default admin creation failed: {error}"
        )

    finally:

        db.close()


# ============================================================
# CREATE ADMIN WHEN BACKEND STARTS
# ============================================================

create_default_admin()


# ============================================================
# AUTH ROUTES
# ============================================================

def register_auth_routes(app):

    # ========================================================
    # SIGNUP
    # ========================================================

    @app.post("/auth/signup")
    def signup(
        data: SignupRequest,
        db: Session = Depends(get_auth_db),
    ):

        name = data.name.strip()

        phone = data.phone.strip()

        email = data.email.strip().lower()

        password = data.password

        # ----------------------------------------------------
        # EMAIL VALIDATION
        # ----------------------------------------------------

        if not GMAIL_PATTERN.fullmatch(email):

            raise HTTPException(
                status_code=400,
                detail="Only valid Gmail addresses are allowed.",
            )

        # ----------------------------------------------------
        # PHONE VALIDATION
        # ----------------------------------------------------

        if not PHONE_PATTERN.fullmatch(phone):

            raise HTTPException(
                status_code=400,
                detail="Phone number must contain exactly 10 digits.",
            )

        # ----------------------------------------------------
        # PASSWORD VALIDATION
        # ----------------------------------------------------

        validate_password(password)

        # ----------------------------------------------------
        # CHECK EXISTING EMAIL
        # ----------------------------------------------------

        existing_email = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if existing_email:

            raise HTTPException(
                status_code=409,
                detail="An account with this Gmail already exists.",
            )

        # ----------------------------------------------------
        # CHECK EXISTING PHONE
        # ----------------------------------------------------

        existing_phone = (
            db.query(User)
            .filter(User.phone == phone)
            .first()
        )

        if existing_phone:

            raise HTTPException(
                status_code=409,
                detail="An account with this phone number already exists.",
            )

        # ----------------------------------------------------
        # CREATE VISITOR
        # ----------------------------------------------------

        user = User(
            name=name,
            phone=phone,
            email=email,
            password_hash=hash_password(password),
            role="visitor",
        )

        db.add(user)

        db.commit()

        db.refresh(user)

        # ----------------------------------------------------
        # CREATE TOKEN
        # ----------------------------------------------------

        token = create_access_token(user)

        return {

            "message": "Visitor account created successfully.",

            "access_token": token,

            "token_type": "bearer",

            "user": {

                "id": user.id,

                "name": user.name,

                "phone": user.phone,

                "email": user.email,

                "role": user.role,

            },

        }

    # ========================================================
    # LOGIN
    # ========================================================

    @app.post("/auth/login")
    def login(
        data: LoginRequest,
        db: Session = Depends(get_auth_db),
    ):

        email = data.email.strip().lower()

        # ----------------------------------------------------
        # FIND USER
        # ----------------------------------------------------

        user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if not user:

            raise HTTPException(
                status_code=401,
                detail="Invalid Gmail or password.",
            )

        # ----------------------------------------------------
        # VERIFY PASSWORD
        # ----------------------------------------------------

        if not verify_password(
            data.password,
            user.password_hash,
        ):

            raise HTTPException(
                status_code=401,
                detail="Invalid Gmail or password.",
            )

        # ----------------------------------------------------
        # CREATE TOKEN
        # ----------------------------------------------------

        token = create_access_token(user)

        return {

            "message": "Login successful.",

            "access_token": token,

            "token_type": "bearer",

            "user": {

                "id": user.id,

                "name": user.name,

                "phone": user.phone,

                "email": user.email,

                "role": user.role,

            },

        }

    # ========================================================
    # CURRENT USER
    # ========================================================

    @app.get("/auth/me")
    def me(
        current_user: User = Depends(
            get_current_user
        ),
    ):

        return {

            "id": current_user.id,

            "name": current_user.name,

            "phone": current_user.phone,

            "email": current_user.email,

            "role": current_user.role,

            "created_at": (
                current_user.created_at.isoformat()
                if current_user.created_at
                else None
            ),

        }