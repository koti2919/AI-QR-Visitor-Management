import os
import smtplib
from pathlib import Path
from email.message import EmailMessage

from dotenv import load_dotenv

load_dotenv()

GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")


def send_email(to_email, subject, body, attachment_path=None):
    if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
        print("EMAIL NOT SENT: Gmail settings are not configured.")
        return False

    try:
        message = EmailMessage()

        message["From"] = f"AI Smart Visitor Management <{GMAIL_ADDRESS}>"
        message["To"] = to_email
        message["Subject"] = subject

        message.set_content(body)

        # Attach QR code if provided
        if attachment_path:
            path = Path(attachment_path)

            if path.exists():
                with open(path, "rb") as file:
                    file_data = file.read()

                message.add_attachment(
                    file_data,
                    maintype="image",
                    subtype="png",
                    filename=path.name,
                )

        # Connect to Gmail SMTP
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
            server.send_message(message)

        print(f"Email sent successfully to {to_email}")

        return True

    except Exception as error:
        print(f"Email sending failed for {to_email}: {error}")

        return False


def send_approval_email(visitor, qr_path):
    subject = "Visitor Request Approved - AI Smart Visitor Management"

    body = f"""
Hello {visitor.name},

Good news!

Your visitor request has been APPROVED.

Visit Details
--------------------------------
Visitor Name: {visitor.name}
Person to Visit: {visitor.person_to_visit}
Purpose: {visitor.purpose}

Your QR code is attached to this email.

Please keep this QR code available when you arrive at the premises.

Thank you for using:

AI Smart Visitor Management System

Regards,
AI Smart Visitor Management
"""

    return send_email(
        visitor.email,
        subject,
        body,
        qr_path,
    )


def send_rejection_email(visitor):
    subject = "Visitor Request Update - AI Smart Visitor Management"

    body = f"""
Hello {visitor.name},

Thank you for using the AI Smart Visitor Management System.

Your visitor request has been reviewed.

Visit Details
--------------------------------
Visitor Name: {visitor.name}
Person to Visit: {visitor.person_to_visit}
Purpose: {visitor.purpose}

Unfortunately, your visitor request has been rejected by the host.

Thank you for your understanding.

We hope to assist you on another visit.

Regards,
AI Smart Visitor Management
"""

    return send_email(
        visitor.email,
        subject,
        body,
    )