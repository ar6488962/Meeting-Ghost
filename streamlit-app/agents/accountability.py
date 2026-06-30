"""
Accountability Agent - Tracks action items using SQLite database.
Stores action items, checks for overdue tasks, and manages status.
"""

import os
import sqlite3
from datetime import datetime
from typing import List, Dict, Tuple
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database file path
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "database", "meeting_ghost.db")


def _get_db_connection():
    """
    Gets a connection to the SQLite database.
    Creates the database and tables if they don't exist.
    
    Returns:
        sqlite3.Connection: Database connection
    """
    
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    
    # Create tables if they don't exist
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS action_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_name TEXT NOT NULL,
            task TEXT NOT NULL,
            deadline TEXT NOT NULL,
            meeting_date TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            created_at TEXT NOT NULL,
            completed_at TEXT
        )
    """)
    
    conn.commit()
    return conn


def save_action_items(meeting_date: str, action_items: List[Dict]) -> bool:
    """
    Saves action items from a meeting to the database.
    
    Args:
        meeting_date (str): Date of the meeting (YYYY-MM-DD format)
        action_items (List[Dict]): List of action items with keys: owner, task, deadline
    
    Returns:
        bool: True if successful, False otherwise
        
    Raises:
        ValueError: If input validation fails
        Exception: If database operation fails
    """
    
    if not meeting_date or not isinstance(meeting_date, str):
        raise ValueError("Meeting date must be a non-empty string in YYYY-MM-DD format")
    
    if not isinstance(action_items, list):
        raise ValueError("Action items must be a list")
    
    if not action_items:
        return True  # Nothing to save
    
    try:
        conn = _get_db_connection()
        cursor = conn.cursor()
        
        current_time = datetime.now().isoformat()
        
        for item in action_items:
            if not isinstance(item, dict):
                continue
            
            owner = str(item.get("owner", "Unassigned")).strip() or "Unassigned"
            task = str(item.get("task", "")).strip()
            deadline = str(item.get("deadline", "Not specified")).strip() or "Not specified"
            
            if not task:  # Skip items without a task
                continue
            
            cursor.execute("""
                INSERT INTO action_items 
                (owner_name, task, deadline, meeting_date, status, created_at)
                VALUES (?, ?, ?, ?, 'Pending', ?)
            """, (owner, task, deadline, meeting_date, current_time))
        
        conn.commit()
        conn.close()
        return True
    
    except Exception as e:
        raise Exception(f"Failed to save action items: {str(e)}")


def get_pending_items() -> List[Dict]:
    """
    Retrieves all pending and overdue action items from previous meetings.
    Checks for items that are still marked as 'Pending'.
    
    Returns:
        List[Dict]: List of pending action items with owner, task, deadline, and status
        
    Raises:
        Exception: If database operation fails
    """
    
    try:
        conn = _get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, owner_name, task, deadline, meeting_date, status, created_at
            FROM action_items
            WHERE status = 'Pending'
            ORDER BY created_at DESC
        """)
        
        rows = cursor.fetchall()
        conn.close()
        
        pending_items = []
        current_date = datetime.now().date()
        
        for row in rows:
            item = {
                "id": row["id"],
                "owner": row["owner_name"],
                "task": row["task"],
                "deadline": row["deadline"],
                "meeting_date": row["meeting_date"],
                "status": row["status"],
                "is_overdue": _is_overdue(row["deadline"], current_date)
            }
            pending_items.append(item)
        
        return pending_items
    
    except Exception as e:
        raise Exception(f"Failed to retrieve pending items: {str(e)}")


def mark_complete(item_id: int) -> bool:
    """
    Marks an action item as completed.
    
    Args:
        item_id (int): The ID of the action item to mark complete
    
    Returns:
        bool: True if successful, False if item not found
        
    Raises:
        ValueError: If item_id is invalid
        Exception: If database operation fails
    """
    
    if not isinstance(item_id, int) or item_id <= 0:
        raise ValueError("Item ID must be a positive integer")
    
    try:
        conn = _get_db_connection()
        cursor = conn.cursor()
        
        completed_time = datetime.now().isoformat()
        
        cursor.execute("""
            UPDATE action_items
            SET status = 'Completed', completed_at = ?
            WHERE id = ?
        """, (completed_time, item_id))
        
        conn.commit()
        
        # Check if item was actually updated
        rows_affected = cursor.rowcount
        conn.close()
        
        return rows_affected > 0
    
    except Exception as e:
        raise Exception(f"Failed to mark item complete: {str(e)}")


def get_overdue_count() -> int:
    """
    Gets the count of overdue pending action items.
    
    Returns:
        int: Number of overdue items
        
    Raises:
        Exception: If database operation fails
    """
    
    try:
        pending_items = get_pending_items()
        overdue_count = sum(1 for item in pending_items if item.get("is_overdue", False))
        return overdue_count
    
    except Exception as e:
        raise Exception(f"Failed to get overdue count: {str(e)}")


def _is_overdue(deadline: str, current_date) -> bool:
    """
    Checks if a deadline is overdue.
    
    Args:
        deadline (str): Deadline string (various formats)
        current_date: Current date to compare against
    
    Returns:
        bool: True if deadline is in the past, False otherwise
    """
    
    if deadline == "Not specified" or not deadline:
        return False
    
    try:
        # Try to parse common date formats
        for date_format in ["%Y-%m-%d", "%m/%d/%Y", "%d-%m-%Y"]:
            try:
                deadline_date = datetime.strptime(deadline, date_format).date()
                return deadline_date < current_date
            except ValueError:
                continue
        
        # If no format matched, assume not overdue (can't parse)
        return False
    
    except Exception:
        return False


def delete_action_item(item_id: int) -> bool:
    """
    Deletes an action item from the database.
    
    Args:
        item_id (int): The ID of the action item to delete
    
    Returns:
        bool: True if successful, False if item not found
        
    Raises:
        ValueError: If item_id is invalid
        Exception: If database operation fails
    """
    
    if not isinstance(item_id, int) or item_id <= 0:
        raise ValueError("Item ID must be a positive integer")
    
    try:
        conn = _get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM action_items WHERE id = ?", (item_id,))
        conn.commit()
        
        rows_affected = cursor.rowcount
        conn.close()
        
        return rows_affected > 0
    
    except Exception as e:
        raise Exception(f"Failed to delete action item: {str(e)}")


__all__ = [
    "save_action_items",
    "get_pending_items",
    "mark_complete",
    "get_overdue_count",
    "delete_action_item"
]
