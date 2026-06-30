"""
Communicator Agent - Drafts personalized follow-up emails using Groq LLM API.
Creates professional emails for each person with their assigned action items.
"""

import os
from typing import List, Dict
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv()

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_follow_up_emails(action_items: List[Dict]) -> List[Dict]:
    """
    Generates personalized follow-up emails for each person with action items.
    Groups action items by owner and creates a professional email for each.
    
    Args:
        action_items (List[Dict]): List of action items with keys:
            - owner (str): Person's name
            - task (str): What they committed to
            - deadline (str): When it's due
    
    Returns:
        List[Dict]: List of emails with keys:
            - recipient (str): Person's name
            - subject (str): Email subject line
            - body (str): Email body
            
    Raises:
        ValueError: If API key is missing or action items are invalid
        Exception: If email generation fails
    """
    
    if not os.getenv("GROQ_API_KEY"):
        raise ValueError("GROQ_API_KEY not found in environment variables")
    
    if not isinstance(action_items, list) or not action_items:
        raise ValueError("Action items must be a non-empty list")
    
    # Group action items by owner
    owners_tasks = {}
    for item in action_items:
        if not isinstance(item, dict):
            continue
        
        owner = str(item.get("owner", "")).strip()
        task = str(item.get("task", "")).strip()
        deadline = str(item.get("deadline", "")).strip()
        
        if not owner or owner == "Unassigned" or not task:
            continue
        
        if owner not in owners_tasks:
            owners_tasks[owner] = []
        
        owners_tasks[owner].append({
            "task": task,
            "deadline": deadline if deadline else "Not specified"
        })
    
    if not owners_tasks:
        return []
    
    emails = []
    
    try:
        # Generate email for each person
        for owner, tasks in owners_tasks.items():
            email = _generate_email_for_owner(owner, tasks)
            if email:
                emails.append(email)
        
        return emails
    
    except Exception as e:
        raise Exception(f"Email generation failed: {str(e)}")


def _generate_email_for_owner(owner: str, tasks: List[Dict]) -> Dict:
    """
    Generates a professional follow-up email for a specific person.
    
    Args:
        owner (str): Person's name
        tasks (List[Dict]): List of tasks with task and deadline
    
    Returns:
        Dict: Email with recipient, subject, and body
        
    Raises:
        Exception: If email generation fails
    """
    
    # Format tasks for the prompt
    tasks_text = "\n".join([
        f"- {task['task']} (Due: {task['deadline']})"
        for task in tasks
    ])
    
    prompt = f"""Draft a professional follow-up email for {owner} regarding action items from our meeting.

Action items assigned to {owner}:
{tasks_text}

Create an email with:
1. Professional greeting
2. Brief recap of the meeting
3. Clear list of their commitments
4. Deadlines
5. Professional closing with support offer

Keep the email concise (150-200 words), professional, friendly tone.
Format the response as:
SUBJECT: [subject line]
BODY: [email body]"""

    try:
        # Call Groq API using chat completions
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1000
        )
        
        if not response.choices or not response.choices[0].message.content:
            raise ValueError("No response from Groq API")
        
        response_text = response.choices[0].message.content.strip()
        
        # Parse subject and body
        email = _parse_email_response(response_text, owner)
        
        return email
    
    except Exception as e:
        raise Exception(f"Failed to generate email for {owner}: {str(e)}")


def _parse_email_response(response_text: str, owner: str) -> Dict:
    """
    Parses the email response from Groq into subject and body.
    
    Args:
        response_text (str): Raw response from Groq
        owner (str): Recipient's name
    
    Returns:
        Dict: Parsed email with recipient, subject, and body
    """
    
    subject = ""
    body = ""
    
    # Try to extract SUBJECT and BODY
    if "SUBJECT:" in response_text:
        parts = response_text.split("BODY:")
        subject_part = parts[0].split("SUBJECT:")[1].strip()
        subject = subject_part.split("\n")[0].strip()
        
        if len(parts) > 1:
            body = parts[1].strip()
        else:
            body = subject_part.split("\n", 1)[1].strip() if "\n" in subject_part else ""
    else:
        # Fallback: treat first line as subject if not explicitly marked
        lines = response_text.split("\n")
        subject = lines[0][:60] if lines else "Meeting Follow-up"
        body = "\n".join(lines[1:]) if len(lines) > 1 else response_text
    
    # Clean up subject if it still contains BODY
    if "BODY:" in subject:
        subject = subject.split("BODY:")[0].strip()
    
    # Ensure we have a valid subject
    if not subject or subject.startswith("SUBJECT"):
        subject = f"Follow-up: Your Action Items from Our Meeting"
    
    # Clean up body
    body = body.strip()
    if not body:
        body = response_text.strip()
    
    return {
        "recipient": owner,
        "subject": subject,
        "body": body
    }


__all__ = ["generate_follow_up_emails"]
