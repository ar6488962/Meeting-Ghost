"""
Email Sender Agent - Handles sending follow-up emails via Resend API.

Uses Resend's HTTPS API instead of SMTP so it works on all hosting platforms
including Render's free tier which blocks outbound SMTP connections.
"""

import os
import urllib.request
import urllib.error
import json
from typing import Tuple


def send_email(to_address: str, subject: str, body: str) -> Tuple[bool, str]:
    """
    Send an email using Resend API (HTTPS-based, works on Render free tier).

    Args:
        to_address (str): Recipient email address
        subject (str): Email subject line
        body (str): Email body content

    Returns:
        Tuple[bool, str]: (Success status, Message)
    """
    try:
        resend_api_key = os.getenv("RESEND_API_KEY")
        from_address = os.getenv("RESEND_FROM_EMAIL", "MeetingGhost <onboarding@resend.dev>")

        if not resend_api_key:
            return False, "RESEND_API_KEY not configured. Please add it in Render environment variables."

        if not to_address or "@" not in to_address:
            return False, "Invalid recipient email address."

        # Build the request payload
        payload = json.dumps({
            "from": from_address,
            "to": [to_address.strip()],
            "subject": subject,
            "text": body,
        }).encode("utf-8")

        # Make HTTPS request to Resend API (port 443 - always open on Render)
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=payload,
            headers={
                "Authorization": f"Bearer {resend_api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=15) as response:
            resp_data = json.loads(response.read().decode())
            if resp_data.get("id"):
                return True, "Email sent successfully!"
            return False, "Resend API did not return an email ID."

    except urllib.error.HTTPError as e:
        error_body = e.read().decode() if e.fp else str(e)
        return False, f"Resend API error {e.code}: {error_body}"

    except Exception as e:
        return False, f"Error sending email: {str(e)}"
