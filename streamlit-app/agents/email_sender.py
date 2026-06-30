"""
Email Sender Agent - Handles sending follow-up emails via Gmail SMTP.

This module provides functionality to send emails using Gmail's SMTP server.
It requires GMAIL_ADDRESS and GMAIL_APP_PASSWORD to be set in the .env file.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from typing import Tuple


def send_email(to_address: str, subject: str, body: str) -> Tuple[bool, str]:
    """
    Send an email using Gmail SMTP server.
    
    Args:
        to_address (str): Recipient email address
        subject (str): Email subject line
        body (str): Email body content
    
    Returns:
        Tuple[bool, str]: (Success status, Message)
            - (True, "Email sent successfully") if sent
            - (False, "Error message") if failed
    """
    
    try:
        # Load credentials from environment
        gmail_address = os.getenv("GMAIL_ADDRESS")
        gmail_password = os.getenv("GMAIL_APP_PASSWORD")
        
        # Validate credentials
        if not gmail_address or not gmail_password:
            return False, "❌ Gmail credentials not configured. Please set GMAIL_ADDRESS and GMAIL_APP_PASSWORD in .env"
        
        # Validate recipient email
        if not to_address or not to_address.strip():
            return False, "❌ Recipient email address cannot be empty"
        
        # Validate email format (basic check)
        if "@" not in to_address or "." not in to_address.split("@")[-1]:
            return False, "❌ Invalid email address format"
        
        # Create email message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = gmail_address
        message["To"] = to_address.strip()
        
        # Attach body as plain text
        part = MIMEText(body, "plain")
        message.attach(part)
        
        # Send email via Gmail SMTP
        # Use port 465 for SMTP_SSL (not 587, which is for TLS)
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(gmail_address, gmail_password)
            server.sendmail(gmail_address, to_address.strip(), message.as_string())
        
        return True, "✅ Email sent successfully!"
    
    except smtplib.SMTPAuthenticationError:
        return False, "❌ Authentication failed. Check GMAIL_ADDRESS and GMAIL_APP_PASSWORD"
    
    except smtplib.SMTPException as e:
        return False, f"❌ SMTP error occurred: {str(e)}"
    
    except Exception as e:
        return False, f"❌ Error sending email: {str(e)}"
