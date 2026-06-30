"""
Intelligence Agent - Analyzes meeting transcripts using Groq LLM API.
Extracts: summary, decisions, action items, unresolved issues, and risks.
"""

import os
import json
import re
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv()

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def extract_meeting_intelligence(transcript: str) -> dict:
    """
    Analyzes a meeting transcript and extracts key information using Groq LLM.
    
    Args:
        transcript (str): The meeting transcript text
    
    Returns:
        dict: Structured meeting intelligence with keys:
            - summary (str): 5-line max meeting summary
            - decisions (list): All decisions made in the meeting
            - action_items (list): Action items with owner, task, and deadline
            - unresolved_issues (list): Issues/debates still open
            - risks (list): Risks mentioned in the meeting
            
    Raises:
        ValueError: If API key is missing or transcript is invalid
        Exception: If API call fails
    """
    
    if not os.getenv("GROQ_API_KEY"):
        raise ValueError("GROQ_API_KEY not found in environment variables")
    
    if not transcript or not isinstance(transcript, str):
        raise ValueError("Transcript must be a non-empty string")
    
    transcript = transcript.strip()
    
    # Prepare the prompt for Groq
    prompt = f"""You are a meeting analysis assistant. Analyze the meeting transcript below and respond with a JSON object containing exactly these fields:

- "summary": string, a concise 3-5 sentence summary of the meeting
- "decisions": array of strings, each decision made during the meeting
- "action_items": array of objects, each with keys "owner" (string), "task" (string), "deadline" (string)
- "unresolved_issues": array of strings, each open issue or unresolved debate
- "risks": array of strings, each risk or concern mentioned

Rules:
- Return ONLY the JSON object, nothing else
- Use empty arrays [] for fields with no data
- Use "Unassigned" if an action item has no clear owner
- Do NOT use newlines inside string values; keep all string values on a single line

TRANSCRIPT:
{transcript}"""

    try:
        # Call Groq API using chat completions
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )
        
        if not response.choices or not response.choices[0].message.content:
            raise ValueError("No response from Groq API")
        
        # Parse JSON response
        response_text = response.choices[0].message.content.strip()
        
        # Sanitize: remove control characters that break JSON parsing
        # (keeps newlines and tabs inside the outer JSON structure but strips bad chars)
        sanitized = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', response_text)
        
        # Try to extract JSON object from response (in case model adds extra text)
        json_match = re.search(r'\{.*\}', sanitized, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
        else:
            json_str = sanitized
        
        intelligence = json.loads(json_str)
        
        # Validate and clean response structure
        intelligence = _validate_intelligence_response(intelligence)
        
        return intelligence
    
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse Groq response as JSON: {str(e)}")
    
    except Exception as e:
        raise Exception(f"Intelligence extraction failed: {str(e)}")


def _validate_intelligence_response(response: dict) -> dict:
    """
    Validates and normalizes the intelligence response structure.
    
    Args:
        response (dict): Raw response from Groq
    
    Returns:
        dict: Validated response with correct structure
    """
    
    validated = {
        "summary": "",
        "decisions": [],
        "action_items": [],
        "unresolved_issues": [],
        "risks": []
    }
    
    # Validate summary
    if "summary" in response and response["summary"]:
        validated["summary"] = str(response["summary"]).strip()
    
    # Validate decisions
    if "decisions" in response and isinstance(response["decisions"], list):
        validated["decisions"] = [
            str(item).strip() for item in response["decisions"] if item
        ]
    
    # Validate action items
    if "action_items" in response and isinstance(response["action_items"], list):
        for item in response["action_items"]:
            if isinstance(item, dict):
                action_item = {
                    "owner": str(item.get("owner", "Unassigned")).strip() or "Unassigned",
                    "task": str(item.get("task", "")).strip(),
                    "deadline": str(item.get("deadline", "Not specified")).strip() or "Not specified"
                }
                if action_item["task"]:  # Only add if task is not empty
                    validated["action_items"].append(action_item)
    
    # Validate unresolved issues
    if "unresolved_issues" in response and isinstance(response["unresolved_issues"], list):
        validated["unresolved_issues"] = [
            str(item).strip() for item in response["unresolved_issues"] if item
        ]
    
    # Validate risks
    if "risks" in response and isinstance(response["risks"], list):
        validated["risks"] = [
            str(item).strip() for item in response["risks"] if item
        ]
    
    return validated


__all__ = ["extract_meeting_intelligence"]
