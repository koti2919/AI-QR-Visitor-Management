from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from datetime import datetime
from pathlib import Path
import uuid
import qrcode


# ============================================================
# APP CONFIGURATION
# ============================================================

app = FastAPI(
    title="AI Smart Visitor Management",
    description="QR-Based Smart Visitor Management System",
    version="3.1.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://ai-qr-visitor-management.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
# VISITOR DATABASE MODEL
# ============================================================

class Visitor(Base):
    __tablename__ = "visitors"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    visitor_id = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    name = Column(
        String,
        nullable=False,
    )

    phone = Column(
        String,
        nullable=False,
    )

    email = Column(
        String,
        nullable=False,
    )

    person_to_visit = Column(
        String,
        nullable=False,
    )

    purpose = Column(
        String,
        nullable=False,
    )

    status = Column(
        String,
        default="Not Checked In",
    )

    entry_time = Column(
        DateTime,
        nullable=True,
    )

    exit_time = Column(
        DateTime,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.now,
    )


Base.metadata.create_all(bind=engine)


# ============================================================
# QR DIRECTORY
# ============================================================

QR_DIR = BASE_DIR / "qr_codes"
QR_DIR.mkdir(exist_ok=True)


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# REQUEST SCHEMA
# ============================================================

class VisitorCreate(BaseModel):
    name: str

    phone: str = Field(
        ...,
        pattern=r"^\d{10}$",
        description="Exactly 10 digits",
    )

    email: str = Field(
        ...,
        pattern=r"^[A-Za-z0-9._%+-]+@gmail\.com$",
        description="Valid Gmail address ending with @gmail.com",
    )

    person_to_visit: str
    purpose: str


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def calculate_visit_minutes(visitor: Visitor) -> float:
    """
    Calculate visitor duration in minutes.

    If the visitor is still inside,
    calculate duration from entry time
    until the current time.
    """

    if not visitor.entry_time:
        return 0.0

    end_time = visitor.exit_time or datetime.now()

    duration = (
        end_time - visitor.entry_time
    ).total_seconds() / 60

    return round(max(duration, 0), 2)


def visitor_to_dict(visitor: Visitor):
    """
    Convert database visitor object into
    JSON-safe API response.
    """

    return {
        "visitor_id": visitor.visitor_id,
        "name": visitor.name,
        "phone": visitor.phone,
        "email": visitor.email,
        "person_to_visit": visitor.person_to_visit,
        "purpose": visitor.purpose,
        "status": visitor.status,
        "entry_time": (
            visitor.entry_time.isoformat()
            if visitor.entry_time
            else None
        ),
        "exit_time": (
            visitor.exit_time.isoformat()
            if visitor.exit_time
            else None
        ),
        "created_at": (
            visitor.created_at.isoformat()
            if visitor.created_at
            else None
        ),
    }


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "AI Smart Visitor Management API is running",
        "version": "3.1.0",
        "status": "online",
    }


# ============================================================
# REGISTER VISITOR
# ============================================================

@app.post("/register")
def register_visitor(
    visitor_data: VisitorCreate,
    db: Session = Depends(get_db),
):
    """
    Registration rules:

    1. First-time visitor:
       ALLOWED

    2. Latest matching visit is "Not Checked In":
       BLOCKED

    3. Latest matching visit is "Checked In":
       BLOCKED

    4. Latest matching visit is "Checked Out":
       ALLOWED

    Visitor matching:
       - same phone OR
       - same Gmail
    """

    # --------------------------------------------------------
    # CLEAN INPUT
    # --------------------------------------------------------

    phone = visitor_data.phone.strip()
    email = visitor_data.email.strip().lower()

    # --------------------------------------------------------
    # FIND PREVIOUS VISITS
    # --------------------------------------------------------

    matching_visits = (
        db.query(Visitor)
        .filter(
            (Visitor.phone == phone)
            | (Visitor.email == email)
        )
        .order_by(
            Visitor.created_at.desc()
        )
        .all()
    )

    latest_visit = (
        matching_visits[0]
        if matching_visits
        else None
    )

    # --------------------------------------------------------
    # BLOCK 1:
    # PREVIOUS REGISTRATION NOT CHECKED IN
    # --------------------------------------------------------

    if (
        latest_visit
        and latest_visit.status == "Not Checked In"
    ):
        raise HTTPException(
            status_code=409,
            detail={
                "code": "VISITOR_REGISTRATION_INCOMPLETE",
                "message": (
                    f"{latest_visit.name} already has "
                    "a pending visit registration."
                ),
                "current_visit": visitor_to_dict(
                    latest_visit
                ),
            },
        )

    # --------------------------------------------------------
    # BLOCK 2:
    # VISITOR IS CURRENTLY INSIDE
    # --------------------------------------------------------

    if (
        latest_visit
        and latest_visit.status == "Checked In"
    ):
        raise HTTPException(
            status_code=409,
            detail={
                "code": "VISITOR_ALREADY_INSIDE",
                "message": (
                    f"{latest_visit.name} is already "
                    "inside the premises."
                ),
                "current_visit": visitor_to_dict(
                    latest_visit
                ),
            },
        )

    # --------------------------------------------------------
    # ALLOWED:
    # FIRST VISIT OR PREVIOUS VISIT CHECKED OUT
    # --------------------------------------------------------

    previous_visits = len(matching_visits)
    returning_visitor = previous_visits > 0

    # --------------------------------------------------------
    # CREATE NEW VISITOR RECORD
    # --------------------------------------------------------

    visitor_id = str(uuid.uuid4())

    visitor = Visitor(
        visitor_id=visitor_id,
        name=visitor_data.name.strip(),
        phone=phone,
        email=email,
        person_to_visit=(
            visitor_data.person_to_visit.strip()
        ),
        purpose=visitor_data.purpose.strip(),
        status="Not Checked In",
    )

    try:
        db.add(visitor)
        db.commit()
        db.refresh(visitor)

        # ----------------------------------------------------
        # GENERATE QR CODE
        # ----------------------------------------------------

        qr_path = QR_DIR / f"{visitor_id}.png"

        qr = qrcode.QRCode(
            version=1,
            box_size=10,
            border=4,
        )

        qr.add_data(visitor_id)
        qr.make(fit=True)

        qr_image = qr.make_image(
            fill_color="black",
            back_color="white",
        )

        qr_image.save(qr_path)

    except Exception:
        db.rollback()
        raise

    # --------------------------------------------------------
    # SUCCESS RESPONSE
    # --------------------------------------------------------

    return {
        "message": "Visitor registered successfully",
        "visitor_id": visitor_id,
        "qr_url": f"/qr/{visitor_id}",
        "returning_visitor": returning_visitor,
        "previous_visits": previous_visits,
        "visitor": visitor_to_dict(visitor),
    }


# ============================================================
# GET QR CODE
# ============================================================

@app.get("/qr/{visitor_id}")
def get_qr(visitor_id: str):
    qr_path = QR_DIR / f"{visitor_id}.png"

    if not qr_path.exists():
        raise HTTPException(
            status_code=404,
            detail="QR code not found",
        )

    return FileResponse(
        qr_path,
        media_type="image/png",
        filename=f"{visitor_id}.png",
        content_disposition_type="inline",
    )


# ============================================================
# DOWNLOAD QR CODE
# ============================================================

@app.get("/qr/{visitor_id}/download")
def download_qr(visitor_id: str):
    qr_path = QR_DIR / f"{visitor_id}.png"

    if not qr_path.exists():
        raise HTTPException(
            status_code=404,
            detail="QR code not found",
        )

    return FileResponse(
        qr_path,
        media_type="image/png",
        filename=f"{visitor_id}.png",
        content_disposition_type="attachment",
    )


# ============================================================
# GET ALL VISITORS
# ============================================================

@app.get("/visitors")
def get_visitors(
    db: Session = Depends(get_db),
):
    visitors = (
        db.query(Visitor)
        .order_by(
            Visitor.created_at.desc()
        )
        .all()
    )

    return [
        visitor_to_dict(visitor)
        for visitor in visitors
    ]


# ============================================================
# GET SINGLE VISITOR
# ============================================================

@app.get("/visitor/{visitor_id}")
def get_visitor(
    visitor_id: str,
    db: Session = Depends(get_db),
):
    visitor = (
        db.query(Visitor)
        .filter(
            Visitor.visitor_id == visitor_id
        )
        .first()
    )

    if not visitor:
        raise HTTPException(
            status_code=404,
            detail="Visitor not found",
        )

    return visitor_to_dict(visitor)


# ============================================================
# CHECK IN
# ============================================================

@app.post("/check-in/{visitor_id}")
def check_in(
    visitor_id: str,
    db: Session = Depends(get_db),
):
    visitor = (
        db.query(Visitor)
        .filter(
            Visitor.visitor_id == visitor_id
        )
        .first()
    )

    if not visitor:
        raise HTTPException(
            status_code=404,
            detail="Visitor not found",
        )

    if visitor.status == "Checked In":
        raise HTTPException(
            status_code=400,
            detail="Visitor is already checked in",
        )

    visitor.status = "Checked In"
    visitor.entry_time = datetime.now()
    visitor.exit_time = None

    db.commit()
    db.refresh(visitor)

    return {
        "message": "Visitor checked in successfully",
        "visitor": visitor_to_dict(visitor),
    }


# ============================================================
# CHECK OUT
# ============================================================

@app.post("/check-out/{visitor_id}")
def check_out(
    visitor_id: str,
    db: Session = Depends(get_db),
):
    visitor = (
        db.query(Visitor)
        .filter(
            Visitor.visitor_id == visitor_id
        )
        .first()
    )

    if not visitor:
        raise HTTPException(
            status_code=404,
            detail="Visitor not found",
        )

    if visitor.status != "Checked In":
        raise HTTPException(
            status_code=400,
            detail="Visitor is not currently checked in",
        )

    visitor.exit_time = datetime.now()
    visitor.status = "Checked Out"

    db.commit()
    db.refresh(visitor)

    duration = calculate_visit_minutes(
        visitor
    )

    return {
        "message": "Visitor checked out successfully",
        "visit_duration_minutes": duration,
        "visitor": visitor_to_dict(visitor),
    }


# ============================================================
# ANALYTICS
# ============================================================

@app.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
):
    visitors = (
        db.query(Visitor)
        .order_by(
            Visitor.created_at.desc()
        )
        .all()
    )

    total_visitors = len(visitors)

    currently_inside = sum(
        1
        for visitor in visitors
        if visitor.status == "Checked In"
    )

    checked_out = sum(
        1
        for visitor in visitors
        if visitor.status == "Checked Out"
    )

    pending = sum(
        1
        for visitor in visitors
        if visitor.status == "Not Checked In"
    )

    # --------------------------------------------------------
    # VISIT DURATIONS
    # --------------------------------------------------------

    completed_visits = [
        visitor
        for visitor in visitors
        if visitor.entry_time
    ]

    durations = [
        calculate_visit_minutes(visitor)
        for visitor in completed_visits
    ]

    average_visit_minutes = (
        round(
            sum(durations) / len(durations),
            2,
        )
        if durations
        else 0
    )

    longest_visit_minutes = (
        max(durations)
        if durations
        else 0
    )

    longest_visit_name = ""

    if completed_visits:
        longest_visitor = max(
            completed_visits,
            key=calculate_visit_minutes,
        )

        longest_visit_name = (
            longest_visitor.name
        )

    # --------------------------------------------------------
    # MOST VISITED PERSON
    # --------------------------------------------------------

    person_visit_counts = {}

    for visitor in visitors:
        person = visitor.person_to_visit.strip()

        person_visit_counts[person] = (
            person_visit_counts.get(person, 0) + 1
        )

    most_visited_person = ""

    if person_visit_counts:
        most_visited_person = max(
            person_visit_counts,
            key=person_visit_counts.get,
        )

    # --------------------------------------------------------
    # REPEAT VISITORS
    # --------------------------------------------------------

    visitor_groups = {}

    for visitor in visitors:
        phone = visitor.phone.strip()

        if phone not in visitor_groups:
            visitor_groups[phone] = {
                "visitor_id": visitor.visitor_id,
                "name": visitor.name,
                "phone": phone,
                "visit_count": 0,
            }

        visitor_groups[phone]["visit_count"] += 1

    repeat_visitors = [
        data
        for data in visitor_groups.values()
        if data["visit_count"] > 1
    ]

    # --------------------------------------------------------
    # SECURITY ALERTS
    # --------------------------------------------------------

    security_alerts = []

    for visitor in visitors:
        duration = calculate_visit_minutes(
            visitor
        )

        if visitor.status == "Checked In":

            if duration > 240:
                security_alerts.append(
                    {
                        "visitor_id": visitor.visitor_id,
                        "visitor": visitor.name,
                        "type": "Long Visit",
                        "severity": "High",
                        "message": (
                            "Visitor has been inside "
                            "for more than 4 hours."
                        ),
                    }
                )

            elif duration > 120:
                security_alerts.append(
                    {
                        "visitor_id": visitor.visitor_id,
                        "visitor": visitor.name,
                        "type": "Long Visit",
                        "severity": "Medium",
                        "message": (
                            "Visitor has been inside "
                            "for more than 2 hours."
                        ),
                    }
                )

    alert_summary = {
        "high": sum(
            1
            for alert in security_alerts
            if alert["severity"] == "High"
        ),
        "medium": sum(
            1
            for alert in security_alerts
            if alert["severity"] == "Medium"
        ),
        "low": sum(
            1
            for alert in security_alerts
            if alert["severity"] == "Low"
        ),
    }

    return {
        "total_visitors": total_visitors,
        "currently_inside": currently_inside,
        "checked_out": checked_out,
        "pending": pending,
        "average_visit_minutes": average_visit_minutes,
        "longest_visit_minutes": round(
            longest_visit_minutes,
            2,
        ),
        "longest_visit_name": longest_visit_name,
        "most_visited_person": most_visited_person,
        "person_visit_counts": person_visit_counts,
        "repeat_visitors": repeat_visitors,
        "security_alerts": security_alerts,
        "alert_summary": alert_summary,
    }


# ============================================================
# AI BEHAVIOR ANALYSIS
# ============================================================

@app.get("/ai-analysis")
def ai_behavior_analysis(
    db: Session = Depends(get_db),
):
    """
    Rule-Based AI Visitor Behavior Analysis.

    Analyzes:
    1. Repeat registrations
    2. Long visit duration
    3. Employee visit frequency
    4. Current check-in status
    """

    visitors = (
        db.query(Visitor)
        .order_by(
            Visitor.created_at.desc()
        )
        .all()
    )

    # --------------------------------------------------------
    # PHONE NUMBER VISIT COUNTS
    # --------------------------------------------------------

    phone_visit_counts = {}

    for visitor in visitors:
        phone = visitor.phone.strip()

        phone_visit_counts[phone] = (
            phone_visit_counts.get(phone, 0) + 1
        )

    # --------------------------------------------------------
    # EMPLOYEE / PERSON-TO-VISIT COUNTS
    # --------------------------------------------------------

    employee_visit_counts = {}

    for visitor in visitors:
        employee = visitor.person_to_visit.strip()

        employee_visit_counts[employee] = (
            employee_visit_counts.get(employee, 0) + 1
        )

    # --------------------------------------------------------
    # ANALYSIS RESULTS
    # --------------------------------------------------------

    visitor_scores = []
    behavior_alerts = []

    high_risk = 0
    medium_risk = 0
    low_risk = 0
    normal = 0

    # --------------------------------------------------------
    # ANALYZE EACH VISITOR
    # --------------------------------------------------------

    for visitor in visitors:

        risk_score = 0
        reasons = []

        phone = visitor.phone.strip()
        employee = visitor.person_to_visit.strip()

        visit_count = phone_visit_counts.get(
            phone,
            1,
        )

        employee_visit_count = (
            employee_visit_counts.get(
                employee,
                1,
            )
        )

        visit_duration = calculate_visit_minutes(
            visitor
        )

        # ----------------------------------------------------
        # RULE 1: VERY LONG VISIT
        # ----------------------------------------------------

        if visit_duration > 240:
            risk_score += 40

            reasons.append(
                "Visit duration exceeded 4 hours"
            )

        # ----------------------------------------------------
        # RULE 2: LONG VISIT
        # ----------------------------------------------------

        elif visit_duration > 120:
            risk_score += 20

            reasons.append(
                "Visit duration exceeded 2 hours"
            )

        # ----------------------------------------------------
        # RULE 3: REPEAT VISITOR
        # ----------------------------------------------------

        if visit_count >= 3:
            risk_score += 30

            reasons.append(
                "Visitor has registered 3 or more times"
            )

        elif visit_count == 2:
            risk_score += 10

            reasons.append(
                "Visitor has registered more than once"
            )

        # ----------------------------------------------------
        # RULE 4: FREQUENT EMPLOYEE VISITS
        # ----------------------------------------------------

        if employee_visit_count >= 5:
            risk_score += 20

            reasons.append(
                "High number of visitors for the same employee"
            )

        # ----------------------------------------------------
        # RULE 5: CURRENTLY INSIDE
        # ----------------------------------------------------

        if visitor.status == "Checked In":
            risk_score += 5

            reasons.append(
                "Visitor is currently inside the premises"
            )

        # ----------------------------------------------------
        # DETERMINE RISK LEVEL
        # ----------------------------------------------------

        if risk_score >= 70:
            risk_level = "High"
            high_risk += 1

        elif risk_score >= 40:
            risk_level = "Medium"
            medium_risk += 1

        elif risk_score >= 15:
            risk_level = "Low"
            low_risk += 1

        else:
            risk_level = "Normal"
            normal += 1

        # ----------------------------------------------------
        # VISITOR SCORE
        # ----------------------------------------------------

        visitor_scores.append(
            {
                "visitor_id": visitor.visitor_id,
                "name": visitor.name,
                "risk_score": risk_score,
                "risk_level": risk_level,
            }
        )

        # ----------------------------------------------------
        # BEHAVIOR ALERT
        # ----------------------------------------------------

        if risk_level != "Normal":
            behavior_alerts.append(
                {
                    "visitor_id": visitor.visitor_id,
                    "visitor": visitor.name,
                    "risk_score": risk_score,
                    "risk_level": risk_level,
                    "visit_count": visit_count,
                    "visit_duration_minutes": visit_duration,
                    "person_to_visit": visitor.person_to_visit,
                    "status": visitor.status,
                    "reasons": reasons,
                }
            )

    # --------------------------------------------------------
    # OVERALL STATUS
    # --------------------------------------------------------

    if high_risk > 0:
        overall_status = (
            "High Risk Behavior Detected"
        )

    elif medium_risk > 0:
        overall_status = (
            "Medium Risk Behavior Detected"
        )

    elif low_risk > 0:
        overall_status = (
            "Low Risk Behavior Detected"
        )

    else:
        overall_status = (
            "No Unusual Behavior Detected"
        )

    # --------------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------------

    return {
        "analysis_type": (
            "Rule-Based AI Behavior Analysis"
        ),
        "analysis_version": "1.1",
        "total_visitors": len(visitors),
        "overall_status": overall_status,
        "summary": {
            "high_risk": high_risk,
            "medium_risk": medium_risk,
            "low_risk": low_risk,
            "normal": normal,
        },
        "behavior_alerts": behavior_alerts,
        "visitor_scores": visitor_scores,
    }