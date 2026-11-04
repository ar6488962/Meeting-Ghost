"""
Email Sender Agent - Handles sending follow-up emails via Brevo API.

Uses Brevo's HTTPS API (port 443) which works perfectly on Render's free tier.
Allows sending emails to anyone using your verified sender email.
"""

import os
import urllib.request
import urllib.error
import json
import smtplib
from email.message import EmailMessage
from typing import Tuple


def _send_with_gmail(to_address: str, subject: str, body: str) -> Tuple[bool, str]:
    sender_email = os.getenv("GMAIL_ADDRESS") or os.getenv("SENDER_EMAIL")
    app_password = os.getenv("GMAIL_APP_PASSWORD")
    if not sender_email or not app_password:
        return False, "Gmail fallback is not configured. Set GMAIL_ADDRESS and GMAIL_APP_PASSWORD."

    message = EmailMessage()
    message["From"] = sender_email.strip()
    message["To"] = to_address.strip()
    message["Subject"] = subject
    message.set_content(body)

    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as smtp:
        smtp.login(sender_email.strip(), app_password)
        smtp.send_message(message)
    return True, "Email sent successfully via Gmail."


def send_email(to_address: str, subject: str, body: str) -> Tuple[bool, str]:
    """
    Send an email using Brevo API.

    Args:
        to_address (str): Recipient email address
        subject (str): Email subject line
        body (str): Email body content

    Returns:
        Tuple[bool, str]: (Success status, Message)
    """
    try:
        brevo_api_key = os.getenv("BREVO_API_KEY")
        # Use GMAIL_ADDRESS or SENDER_EMAIL as the sender since that is the email verified on Brevo
        sender_email = os.getenv("SENDER_EMAIL") or os.getenv("GMAIL_ADDRESS")

        if not to_address or "@" not in to_address:
            return False, "❌ Invalid recipient email address."

        if not brevo_api_key:
            return _send_with_gmail(to_address, subject, body)
        if not sender_email:
            return False, "❌ SENDER_EMAIL/GMAIL_ADDRESS not configured for Brevo."

        # Build Brevo API payload
        payload = json.dumps({
            "sender": {
                "name": "MeetingGhost AI",
                "email": sender_email.strip()
            },
            "to": [
                {
                    "email": to_address.strip()
                }
            ],
            "subject": subject,
            "textContent": body
        }).encode("utf-8")

        # Make HTTPS request to Brevo API
        req = urllib.request.Request(
            "https://api.brevo.com/v3/smtp/email",
            data=payload,
            headers={
                "api-key": brevo_api_key,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=15) as response:
            resp_data = json.loads(response.read().decode())
            if resp_data.get("messageId"):
                return True, "✅ Email sent successfully!"
            return False, "❌ Brevo API did not return a message ID."

    except urllib.error.HTTPError as e:
        error_body = e.read().decode() if e.fp else str(e)
        if e.code in (401, 403):
            try:
                return _send_with_gmail(to_address, subject, body)
            except Exception as gmail_error:
                return False, (
                    f"Brevo rejected the API key ({e.code}) and Gmail fallback failed: "
                    f"{gmail_error}"
                )
        return False, f"❌ Brevo API error {e.code}: {error_body}"

    except Exception as e:
        return False, f"❌ Error sending email: {str(e)}"
