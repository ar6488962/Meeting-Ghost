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
    prompt = f"""Analyze this meeting transcript and extract the following information:

TRANSCRIPT:
{transcript}

Please provide a JSON response with exactly these fields:
1. "summary": A concise 5-line maximum summary of the meeting
2. "decisions": A list of all decisions made (each as a string)
3. "action_items": A list of objects, each with: {{"owner": "person name", "task": "what to do", "deadline": "when"}}
4. "unresolved_issues": A list of issues or debates that remain open
5. "risks": A list of risks or concerns mentioned

IMPORTANT: Return only valid JSON, no other text. If a field is empty, use an empty list [].
If owner name cannot be determined, use "Unassigned"."""

    try:
        # Call Groq API using chat completions
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2000
        )
        
        if not response.choices or not response.choices[0].message.content:
            raise ValueError("No response from Groq API")
        
        # Parse JSON response
        response_text = response.choices[0].message.content.strip()
        
        # Try to extract JSON from response (in case there's extra text)
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
        else:
            json_str = response_text
        
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
