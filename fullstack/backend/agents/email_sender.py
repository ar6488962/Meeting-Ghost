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
import time
from email.message import EmailMessage
from typing import Tuple


def _send_with_gmail(
    sender_email: str, to_address: str, subject: str, body: str
) -> Tuple[bool, str]:
    app_password = os.getenv("GMAIL_APP_PASSWORD")
    if not sender_email or not app_password:
        return False, "Gmail fallback is not configured for this profile."

    message = EmailMessage()
    message["From"] = sender_email.strip()
    message["To"] = to_address.strip()
    message["Subject"] = subject
    message.set_content(body)

    errors = []
    for port in (587, 465):
        try:
            if port == 587:
                with smtplib.SMTP("smtp.gmail.com", port, timeout=15) as smtp:
                    smtp.ehlo()
                    smtp.starttls()
                    smtp.ehlo()
                    smtp.login(sender_email.strip(), app_password)
                    smtp.send_message(message)
            else:
                with smtplib.SMTP_SSL("smtp.gmail.com", port, timeout=15) as smtp:
                    smtp.login(sender_email.strip(), app_password)
                    smtp.send_message(message)
            return True, "Email sent successfully via Gmail."
        except (OSError, smtplib.SMTPException) as error:
            errors.append(f"port {port}: {error}")
            if port == 587:
                time.sleep(1)

    return False, (
        "Gmail could not be reached from the server. "
        "Configure a valid Brevo API key, or enable outbound Gmail SMTP. "
        + "; ".join(errors)
    )


def send_email(
    sender_email: str, to_address: str, subject: str, body: str
) -> Tuple[bool, str]:
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

        if not to_address or "@" not in to_address:
            return False, "❌ Invalid recipient email address."
        if not sender_email or "@" not in sender_email:
            return False, "❌ Your profile email is not valid."

        if not brevo_api_key:
            return _send_with_gmail(sender_email, to_address, subject, body)

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
            success, fallback_message = _send_with_gmail(
                sender_email, to_address, subject, body
            )
            if success:
                return True, fallback_message
            return False, (
                f"Brevo rejected the API key ({e.code}) and Gmail fallback failed: "
                f"{fallback_message}"
            )
        return False, f"❌ Brevo API error {e.code}: {error_body}"

    except Exception as e:
        return False, f"❌ Error sending email: {str(e)}"
