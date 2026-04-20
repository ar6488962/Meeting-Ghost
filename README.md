# 👻 MeetingGhost

**Multi-Agent AI System for Meeting Summarization, Accountability Tracking and Automated Follow-up**

A powerful Streamlit application that intelligently analyzes meetings, extracts key information, tracks action items, and automates follow-up communications.

## Features

✨ **Audio Transcription** - Upload audio files (mp3, mp4, wav) or paste transcripts directly
🧠 **AI Meeting Analysis** - Automatic extraction using Google Gemini 1.5 Flash:
  - Meeting summaries
  - Decisions made
  - Action items with owners and deadlines
  - Unresolved issues
  - Identified risks

📊 **Action Item Tracking** - Persistent SQLite database for:
  - Storing action items from all meetings
  - Tracking completion status
  - Identifying overdue items
  - Managing accountability

✉️ **Intelligent Follow-ups** - Automated email generation:
  - Personalized for each attendee
  - Professional tone
  - Auto-generated based on commitments

## Architecture

The system consists of 4 specialized AI agents:

### 1. Transcriber Agent (`agents/transcriber.py`)
- Uses OpenAI Whisper API for audio transcription
- Accepts: mp3, mp4, wav, m4a, flac, ogg, webm formats
- Falls back to direct text input
- Returns: Clean transcript string

### 2. Intelligence Agent (`agents/intelligence.py`)
- Analyzes meeting transcripts using Google Gemini 1.5 Flash
- Extracts structured meeting insights:
  - Summary (5 lines max)
  - Decisions made
  - Action items (owner, task, deadline)
  - Unresolved issues
  - Mentioned risks
- Returns: Structured dictionary of intelligence

### 3. Accountability Agent (`agents/accountability.py`)
- Stores action items in SQLite database
- Tracks: owner, task, deadline, meeting date, status, timestamps
- Features:
  - Save new action items
  - Retrieve pending items
  - Identify overdue tasks
  - Mark items complete
  - Delete items
- Persistent storage across sessions

### 4. Communicator Agent (`agents/communicator.py`)
- Uses Google Gemini to draft follow-up emails
- Creates personalized emails for each person
- Email includes:
  - Professional greeting
  - Meeting recap
  - Their specific commitments
  - Clear deadlines
  - Professional closing
- Returns: List of emails (recipient, subject, body)

## Setup Instructions

### Prerequisites
- Python 3.9+
- Windows/Mac/Linux
- API Keys:
  - OpenAI API Key (for Whisper transcription)
  - Google Gemini API Key (for intelligence and emails)

### Installation

1. **Clone/Extract the project:**
   ```bash
   cd MeetingGhost
   ```

2. **Create and activate virtual environment:**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate
   
   # Mac/Linux
   python -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create `.env` file** in project root:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### Running the Application

```bash
streamlit run app.py
```

The application will open in your default browser at `http://localhost:8501`

## Usage Guide

### Processing a New Meeting

1. **Select Input Method:**
   - Upload audio file (auto-transcribed via Whisper)
   - Paste transcript text directly

2. **Analyze Meeting:**
   - Click "Analyze Meeting" button
   - System processes through all 4 agents
   - Results display in organized tabs

3. **View Results:**
   - **Summary Tab**: Meeting overview
   - **Decisions Tab**: All decisions made
   - **Action Items Tab**: Table of tasks with owners and deadlines
   - **Issues & Risks Tab**: Unresolved items and risks
   - **Emails Tab**: Draft follow-up emails (ready to copy)

### Managing Action Items

1. **Check Pending Items:**
   - Navigate to "Pending Action Items" mode
   - View all pending items from previous meetings
   - See statistics (total, overdue, on track)

2. **Update Status:**
   - Mark items as complete
   - Delete items
   - View overdue warnings

3. **Email Generation:**
   - Personalized for each assignee
   - One-click copy to clipboard
   - Ready to send via your email client

## Project Structure

```
MeetingGhost/
├── .env                          # API keys (create this)
├── app.py                        # Main Streamlit application
├── requirements.txt              # Python dependencies
├── agents/
│   ├── __init__.py              # Package initialization
│   ├── transcriber.py           # Audio to text (OpenAI Whisper)
│   ├── intelligence.py          # Analysis (Google Gemini)
│   ├── accountability.py        # Database (SQLite)
│   └── communicator.py          # Email draft (Google Gemini)
└── database/
    ├── __init__.py
    └── meeting_ghost.db         # SQLite database (auto-created)
```

## Dependencies

- **streamlit==1.32.0** - Web UI framework
- **openai==1.3.0** - OpenAI Whisper API
- **google-generativeai==0.3.0** - Google Gemini API
- **python-dotenv==1.0.0** - Environment variable management

## Error Handling

The system includes comprehensive error handling:
- ✅ Validates API keys are loaded
- ✅ Checks input validity
- ✅ Handles transcription failures gracefully
- ✅ Manages database errors
- ✅ Provides user-friendly error messages

## Best Practices

### For Best Results:

1. **Audio Quality** - Ensure clear audio with minimal background noise
2. **Speaker Names** - Mention who is speaking for better attribution
3. **Specific Deadlines** - Use clear date formats (YYYY-MM-DD)
4. **Review Before Sending** - Always review generated emails before sending
5. **Regular Backups** - The SQLite database stores all historical data

### Security:

- ✅ Never hardcode API keys
- ✅ Use `.env` file with `.gitignore`
- ✅ Keep API keys confidential
- ✅ Regularly rotate keys as needed

## API Costs

- **OpenAI Whisper**: ~$0.006 per minute of audio
- **Google Gemini 1.5 Flash**: Very affordable for text analysis and generation

Costs are per actual usage. Test with free tier first.

## Future Enhancements

Potential additions:
- [ ] Support for more languages
- [ ] Calendar integration for deadline reminders
- [ ] Slack/Teams bot integration
- [ ] Custom email templates
- [ ] Meeting analytics dashboard
- [ ] Multi-user collaboration features
- [ ] Export to PDF reports

## Troubleshooting

### "OPENAI_API_KEY not found"
- Ensure `.env` file exists in project root
- Check API key is correctly set: `OPENAI_API_KEY=your_key`

### "GEMINI_API_KEY not found"
- Ensure `.env` file has: `GEMINI_API_KEY=your_key`
- Generate key at https://makersuite.google.com/app/apikey

### Audio transcription fails
- Check audio file format is supported
- Ensure audio is clear and not corrupted
- Try smaller audio files first

### Email generation is slow
- Normal on first run (API warmup)
- Subsequent requests are faster
- Check internet connection

## License

This project is provided as-is for use.

## Support

For issues:
1. Check that API keys are correctly configured
2. Verify internet connection
3. Ensure all dependencies are installed
4. Review error messages in Streamlit console

---

Built with ❤️ using Streamlit, OpenAI Whisper, and Google Gemini
