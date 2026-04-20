"""
MeetingGhost Agents Package

Contains four specialized AI agents:
1. Transcriber - Audio transcription using OpenAI Whisper
2. Intelligence - Meeting analysis using Gemini API
3. Accountability - Action item tracking with SQLite
4. Communicator - Email generation using Gemini API
"""

from agents.transcriber import transcribe_audio, process_transcript
from agents.intelligence import extract_meeting_intelligence
from agents.accountability import (
    save_action_items,
    get_pending_items,
    mark_complete,
    get_overdue_count,
    delete_action_item
)
from agents.communicator import generate_follow_up_emails

__all__ = [
    "transcribe_audio",
    "process_transcript",
    "extract_meeting_intelligence",
    "save_action_items",
    "get_pending_items",
    "mark_complete",
    "get_overdue_count",
    "delete_action_item",
    "generate_follow_up_emails"
]
