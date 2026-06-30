"""
MeetingGhost - Multi-Agent AI System for Meeting Summarization,
Accountability Tracking and Automated Follow-up.

Main Streamlit application that orchestrates all four agents:
1. Transcriber - Converts audio to text
2. Intelligence - Analyzes meetings
3. Accountability - Tracks action items
4. Communicator - Drafts follow-up emails
"""

import os
import io
from datetime import datetime
from dotenv import load_dotenv
import streamlit as st
from agents.transcriber import process_transcript
from agents.intelligence import extract_meeting_intelligence
from agents.accountability import (
    save_action_items,
    get_pending_items,
    mark_complete,
    delete_action_item,
    get_overdue_count
)
from agents.communicator import generate_follow_up_emails
from agents.email_sender import send_email

# Load environment variables
load_dotenv()

# Page configuration
st.set_page_config(
    page_title="MeetingGhost",
    page_icon="👻",
    layout="wide",
    initial_sidebar_state="expanded"
)

# JavaScript to auto-scroll to tabs after email form submission
st.markdown("""
<script>
    // Auto-scroll to tabs section if we just submitted an email form
    if (window.location.hash === '' && document.querySelectorAll('[data-testid="stTabs"]').length > 0) {
        // Check if we have tabs and if the user is likely coming from an email form submit
        const tabs = document.querySelectorAll('[data-testid="stTabs"]');
        if (tabs.length > 0) {
            // Small delay to let Streamlit finish rendering
            setTimeout(() => {
                const emailsTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('✉️ Emails'));
                if (emailsTab) {
                    emailsTab.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 200);
        }
    }
</script>
""", unsafe_allow_html=True)

# Universal CSS for both light and dark modes
st.markdown("""
<style>
    /* Universal text styling */
    [data-testid="stMarkdownContainer"] p {
        color: inherit !important;
    }
    
    /* Main title - adapts to theme */
    .main-title {
        font-size: 2.5em;
        font-weight: bold;
        margin-bottom: 10px;
        background: linear-gradient(135deg, #1f77b4 0%, #2ca02c 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    /* Subtitle */
    .subtitle {
        font-size: 1.1em;
        margin-bottom: 20px;
        opacity: 0.8;
    }
    
    /* Summary box - theme-aware */
    .summary-box {
        padding: 20px;
        border-radius: 8px;
        margin: 15px 0;
        background: linear-gradient(135deg, rgba(31, 119, 180, 0.08) 0%, rgba(44, 160, 44, 0.08) 100%);
        border: 1px solid rgba(31, 119, 180, 0.2);
    }
    
    /* Decision box - yellow-tinted */
    .decision-box {
        padding: 15px;
        border-left: 4px solid #ffc107;
        margin: 10px 0;
        border-radius: 4px;
        background: linear-gradient(90deg, rgba(255, 193, 7, 0.1) 0%, transparent 100%);
    }
    
    /* Risk box - red-tinted */
    .risk-box {
        padding: 15px;
        border-left: 4px solid #dc3545;
        margin: 10px 0;
        border-radius: 4px;
        background: linear-gradient(90deg, rgba(220, 53, 69, 0.1) 0%, transparent 100%);
    }
    
    /* Issue box - neutral-tinted */
    .issue-box {
        padding: 15px;
        border-left: 4px solid #6c757d;
        margin: 10px 0;
        border-radius: 4px;
        background: linear-gradient(90deg, rgba(108, 117, 125, 0.08) 0%, transparent 100%);
    }
    
    /* Email draft - blue-tinted */
    .email-draft {
        padding: 15px;
        border-radius: 8px;
        margin: 15px 0;
        border: 1px solid rgba(31, 119, 180, 0.3);
        background: linear-gradient(135deg, rgba(31, 119, 180, 0.08) 0%, rgba(52, 168, 224, 0.08) 100%);
    }
    
    /* Pending warning - warning-tinted */
    .pending-warning {
        padding: 15px;
        border-radius: 8px;
        margin: 15px 0;
        border-left: 4px solid #ff9800;
        background: linear-gradient(90deg, rgba(255, 152, 0, 0.1) 0%, transparent 100%);
    }
    
    /* Success message styling */
    .success-message {
        padding: 12px;
        border-radius: 6px;
        border-left: 4px solid #28a745;
        background: linear-gradient(90deg, rgba(40, 167, 69, 0.1) 0%, transparent 100%);
    }
    
    /* Error message styling */
    .error-message {
        padding: 12px;
        border-radius: 6px;
        border-left: 4px solid #dc3545;
        background: linear-gradient(90deg, rgba(220, 53, 69, 0.1) 0%, transparent 100%);
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if "meeting_processed" not in st.session_state:
    st.session_state.meeting_processed = False
if "current_meeting_intelligence" not in st.session_state:
    st.session_state.current_meeting_intelligence = None
if "current_transcript" not in st.session_state:
    st.session_state.current_transcript = ""
if "email_sent_tracking" not in st.session_state:
    st.session_state.email_sent_tracking = {}
if "current_emails" not in st.session_state:
    st.session_state.current_emails = []
if "app_mode" not in st.session_state:
    st.session_state.app_mode = "Process New Meeting"
if "email_send_counter" not in st.session_state:
    st.session_state.email_send_counter = 0


def main():
    """Main Streamlit application function."""
    
    # Header
    st.markdown('<p class="main-title">👻 MeetingGhost</p>', unsafe_allow_html=True)
    st.markdown(
        '<p class="subtitle">Intelligent Meeting Summarization, Accountability Tracking &amp; Follow-up</p>',
        unsafe_allow_html=True
    )
    
    # Display notification if email was just sent (persist for a few reruns)
    if st.session_state.email_send_counter > 0:
        email_to = st.session_state.get("email_just_sent_to", "recipient")
        st.markdown(f"""
        <div style="padding: 14px; background: linear-gradient(90deg, rgba(40, 167, 69, 0.15) 0%, transparent 100%); 
        border-left: 5px solid #28a745; border-radius: 8px; margin: 15px 0; font-weight: 600;">
            <span style="color: #155724; font-size: 1.05em;">✅ Email successfully sent to {email_to}</span>
        </div>
        """, unsafe_allow_html=True)
        st.session_state.email_send_counter -= 1
    
    st.divider()
    
    # Sidebar for navigation — use session state so it persists across reruns
    with st.sidebar:
        st.markdown("## 📋 Navigation")
        mode_options = ["Process New Meeting", "Pending Action Items", "Help"]
        current_index = mode_options.index(st.session_state.app_mode) if st.session_state.app_mode in mode_options else 0
        app_mode = st.radio(
            "Select Mode:",
            mode_options,
            index=current_index,
            key="sidebar_radio"
        )
        st.session_state.app_mode = app_mode
    
    # Main content based on mode
    if app_mode == "Process New Meeting":
        process_meeting_mode()
    elif app_mode == "Pending Action Items":
        pending_items_mode()
    else:
        help_mode()


def process_meeting_mode():
    """Mode for processing a new meeting."""
    
    st.markdown("### 🎙️ Process New Meeting")
    st.markdown("Upload an audio file or paste a transcript to analyze your meeting.")
    
    # Input method selection
    input_method = st.radio(
        "Choose input method:",
        ["Upload Audio File", "Paste Transcript"],
        horizontal=True
    )
    
    transcript = None
    
    if input_method == "Upload Audio File":
        uploaded_file = st.file_uploader(
            "Upload audio file (mp3, mp4, wav, etc.)",
            type=["mp3", "mp4", "wav", "m4a", "flac", "ogg", "webm"]
        )
        
        if uploaded_file is not None:
            with st.spinner("📝 Transcribing audio... This may take a moment..."):
                try:
                    # Save uploaded file temporarily
                    temp_path = f"/tmp/{uploaded_file.name}"
                    os.makedirs("/tmp", exist_ok=True)
                    
                    with open(temp_path, "wb") as f:
                        f.write(uploaded_file.getbuffer())
                    
                    # Transcribe
                    transcript = process_transcript(temp_path)
                    
                    # Clean up
                    os.remove(temp_path)
                    
                    st.success("✅ Audio transcribed successfully!")
                
                except Exception as e:
                    st.error(f"❌ Transcription failed: {str(e)}")
                    return
    
    else:  # Paste Transcript
        transcript_input = st.text_area(
            "Paste your meeting transcript:",
            height=150,
            placeholder="Paste the meeting transcript here..."
        )
        
        if transcript_input.strip():
            try:
                transcript = process_transcript(transcript_input)
            except Exception as e:
                st.error(f"❌ Invalid input: {str(e)}")
                return
    
    # Process meeting button
    if transcript and st.button("🚀 Analyze Meeting", key="analyze_btn"):
        analyze_meeting(transcript)


def analyze_meeting(transcript: str):
    """Analyzes a meeting transcript with all agents."""
    
    st.session_state.current_transcript = transcript
    
    # Show progress
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    try:
        # Step 1: Extract intelligence
        status_text.text("🧠 Extracting meeting intelligence...")
        progress_bar.progress(25)
        
        intelligence = extract_meeting_intelligence(transcript)
        st.session_state.current_meeting_intelligence = intelligence
        progress_bar.progress(50)
        
        # Step 2: Check for pending items
        status_text.text("📋 Checking for pending action items...")
        pending_items = get_pending_items()
        progress_bar.progress(75)
        
        # Step 3: Save new action items
        status_text.text("💾 Saving action items...")
        meeting_date = datetime.now().strftime("%Y-%m-%d")
        save_action_items(meeting_date, intelligence["action_items"])
        progress_bar.progress(90)
        
        # Step 4: Generate follow-up emails
        status_text.text("✉️ Generating follow-up emails...")
        emails = generate_follow_up_emails(intelligence["action_items"])
        st.session_state.current_emails = emails  # persist across reruns
        progress_bar.progress(100)
        
        status_text.text("")
        progress_bar.empty()
        
        # Display results
        st.success("✅ Meeting analysis complete!")
        
        # Show pending items warning if any exist
        if pending_items:
            show_pending_items_warning(pending_items)
        
        st.divider()
        
        # Display results tabs
        tab1, tab2, tab3, tab4, tab5 = st.tabs(
            ["📊 Summary", "✅ Decisions", "📝 Action Items", "⚠️ Issues & Risks", "✉️ Emails"]
        )
        
        with tab1:
            display_summary(intelligence)
        
        with tab2:
            display_decisions(intelligence)
        
        with tab3:
            display_action_items(intelligence)
        
        with tab4:
            display_issues_and_risks(intelligence)
        
        with tab5:
            display_emails(emails)
        
        st.session_state.meeting_processed = True
    
    except Exception as e:
        status_text.text("")
        progress_bar.empty()
        st.error(f"❌ Analysis failed: {str(e)}")
        return


def show_pending_items_warning(pending_items: list):
    """Displays a warning about pending action items from previous meetings."""
    
    if not pending_items:
        return
    
    overdue_count = sum(1 for item in pending_items if item.get("is_overdue"))
    
    warning_html = f"""
    <div class="pending-warning">
        <strong>⚠️ Pending Action Items from Previous Meetings</strong><br>
        <small>{len(pending_items)} pending items | {overdue_count} overdue</small>
    </div>
    """
    st.markdown(warning_html, unsafe_allow_html=True)
    
    with st.expander("View pending items"):
        for item in pending_items:
            status_indicator = "🔴 OVERDUE" if item.get("is_overdue") else "🟡 PENDING"
            st.write(
                f"**{item['owner']}** - {item['task']}\n"
                f"Deadline: {item['deadline']} | {status_indicator}"
            )


def display_summary(intelligence: dict):
    """Displays the meeting summary."""
    
    st.subheader("📊 Meeting Summary")
    
    summary = intelligence.get("summary", "")
    if summary:
        st.write(summary)
    else:
        st.info("No summary available")


def display_decisions(intelligence: dict):
    """Displays decisions made in the meeting."""
    
    st.subheader("✅ Decisions Made")
    
    decisions = intelligence.get("decisions", [])
    if decisions:
        for idx, decision in enumerate(decisions, 1):
            decision_html = f"""
            <div class="decision-box">
                <strong>Decision {idx}:</strong> {decision}
            </div>
            """
            st.markdown(decision_html, unsafe_allow_html=True)
    else:
        st.info("No specific decisions recorded")


def display_action_items(intelligence: dict):
    """Displays action items in a table format."""
    
    st.subheader("📝 Action Items")
    
    action_items = intelligence.get("action_items", [])
    if action_items:
        # Create table data
        table_data = []
        for item in action_items:
            table_data.append({
                "Owner": item.get("owner", "Unassigned"),
                "Task": item.get("task", ""),
                "Deadline": item.get("deadline", "Not specified")
            })
        
        st.dataframe(table_data, width='stretch')
        
        # Download button
        csv_data = "Owner,Task,Deadline\n"
        for item in table_data:
            csv_data += f'"{item["Owner"]}","{item["Task"]}","{item["Deadline"]}"\n'
        
        st.download_button(
            label="📥 Download as CSV",
            data=csv_data,
            file_name=f"action_items_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            mime="text/csv"
        )
    else:
        st.info("No action items recorded")


def display_issues_and_risks(intelligence: dict):
    """Displays unresolved issues and risks."""
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("🔧 Unresolved Issues")
        issues = intelligence.get("unresolved_issues", [])
        if issues:
            for issue in issues:
                issue_html = f"""
                <div class="issue-box">
                    {issue}
                </div>
                """
                st.markdown(issue_html, unsafe_allow_html=True)
        else:
            st.info("No unresolved issues")
    
    with col2:
        st.subheader("⚠️ Risks Mentioned")
        risks = intelligence.get("risks", [])
        if risks:
            for risk in risks:
                risk_html = f"""
                <div class="risk-box">
                    {risk}
                </div>
                """
                st.markdown(risk_html, unsafe_allow_html=True)
        else:
            st.info("No risks mentioned")


def display_emails(emails: list):
    """Displays draft follow-up emails with options to copy or send."""
    
    st.subheader("✉️ Draft Follow-up Emails")
    
    if emails:
        for idx, email in enumerate(emails, 1):
            with st.container():
                col1, col2 = st.columns([0.85, 0.15])
                
                with col1:
                    st.write(f"**To:** {email['recipient']}")
                    st.write(f"**Subject:** {email['subject']}")
                
                with col2:
                    if st.button("📋 Copy", key=f"copy_{idx}"):
                        full_email = f"To: {email['recipient']}\nSubject: {email['subject']}\n\n{email['body']}"
                        st.write(full_email)
                        st.session_state[f"copy_status_{idx}"] = True
                
                email_html = f"""
                <div class="email-draft">
                    {email['body']}
                </div>
                """
                st.markdown(email_html, unsafe_allow_html=True)
                
                # Email sending section with form to prevent navigation
                with st.form(key=f"email_form_{idx}", clear_on_submit=False):
                    col_email, col_btn = st.columns([0.75, 0.25])
                    
                    with col_email:
                        recipient = st.text_input(
                            "Recipient email address",
                            value=st.session_state.get(f"email_input_{idx}", ""),
                            key=f"email_input_{idx}",
                            placeholder="Enter email address e.g. sarah@company.com"
                        )
                    
                    with col_btn:
                        submitted = st.form_submit_button("🚀 Send", use_container_width=True)
                    
                    if submitted:
                        email_value = recipient.strip() if recipient else ""
                        
                        # Validate and send
                        if not email_value:
                            st.error("❌ Please enter a recipient email address")
                        elif "@" not in email_value or "." not in email_value:
                            st.error("❌ Please enter a valid email address")
                        else:
                            # Send email
                            success, message = send_email(
                                to_address=email_value,
                                subject=email['subject'],
                                body=email['body']
                            )
                            
                            if success:
                                st.session_state[f"email_input_{idx}"] = ""  # Clear input
                                st.session_state.email_send_counter = 3  # Show notification at top
                                st.session_state.email_just_sent_to = email_value
                                st.success(f"✅ Email sent successfully to {email_value}!")
                            else:
                                st.error(f"❌ {message}")
                
                st.divider()
    else:
        st.info("No emails to generate (no assigned action items)")


def pending_items_mode():
    """Mode for viewing and managing pending action items."""
    
    st.markdown("### 📋 Pending Action Items")
    st.markdown("Track and manage action items from previous meetings.")
    
    try:
        pending_items = get_pending_items()
        
        if not pending_items:
            st.info("✅ No pending action items! Great job staying on top of things.")
            return
        
        # Summary stats
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("Total Pending", len(pending_items))
        
        with col2:
            overdue_count = sum(1 for item in pending_items if item.get("is_overdue"))
            st.metric("Overdue Items", overdue_count)
        
        with col3:
            pending_count = len(pending_items) - overdue_count
            st.metric("On Track", pending_count)
        
        st.divider()
        
        # Display items with action buttons
        st.subheader("📝 Items List")
        
        for item in pending_items:
            col1, col2, col3 = st.columns([0.7, 0.15, 0.15])
            
            status_badge = "🔴 OVERDUE" if item.get("is_overdue") else "🟡 PENDING"
            
            with col1:
                st.write(
                    f"**{item['owner']}** - {item['task']}\n"
                    f"*Due: {item['deadline']}* | {status_badge}"
                )
            
            with col2:
                if st.button("✅ Complete", key=f"complete_{item['id']}"):
                    mark_complete(item['id'])
                    st.success("Marked as complete!")
                    st.rerun()
            
            with col3:
                if st.button("🗑️ Delete", key=f"delete_{item['id']}"):
                    delete_action_item(item['id'])
                    st.success("Item deleted!")
                    st.rerun()
            
            st.divider()
    
    except Exception as e:
        st.error(f"❌ Failed to load pending items: {str(e)}")


def help_mode():
    """Help and information page."""
    
    st.markdown("### 📚 Help & Information")
    
    st.markdown("""
    ## About MeetingGhost
    
    MeetingGhost is an intelligent meeting management system that helps teams:
    - **Transcribe** meetings from audio files or text
    - **Summarize** meeting content automatically
    - **Track** action items and accountability
    - **Follow-up** with personalized emails
    
    ## How It Works
    
    ### 1. Transcription
    - Upload audio files (mp3, mp4, wav, etc.) or paste a transcript
    - Uses Groq Whisper for accurate speech-to-text
    
    ### 2. Intelligence Extraction
    - Analyzes transcripts using Groq LLaMA 3.3 70B
    - Extracts: summary, decisions, action items, issues, risks
    
    ### 3. Accountability Tracking
    - Saves action items to local SQLite database
    - Tracks owner, task, deadline, and status
    - Identifies overdue items automatically
    
    ### 4. Follow-up Communication
    - Generates personalized emails for each person
    - Uses Groq LLaMA 3.3 70B to create professional, personalized messages
    - One-click copy to send via your email client
    
    ## Features
    
    ✅ **Audio Transcription** - Upload and transcribe meetings
    ✅ **AI Analysis** - Automatic extraction of key information
    ✅ **Action Item Tracking** - Persistent database of all tasks
    ✅ **Smart Reminders** - Warning for pending/overdue items
    ✅ **Email Drafts** - Auto-generated follow-up communications
    ✅ **Professional UI** - Clean, intuitive interface
    
    ## Setup Requirements
    
    Before using MeetingGhost, ensure you have:
    
    1. **Environment Variables** (in .env file):
       - `GROQ_API_KEY` - For Whisper transcription and intelligence extraction
    
    2. **Python Packages** (installed via requirements.txt):
       - streamlit
       - groq
       - python-dotenv
    
    ## Tips for Best Results
    
    - **Clear Audio**: Ensure meeting recordings are clear with minimal background noise
    - **Speaker Identification**: Mention speaker names in the transcript for better tracking
    - **Specific Deadlines**: Include dates/times when assigning tasks
    - **Review Before Send**: Always review generated emails before sending
    
    ## Support
    
    For issues or questions, check that:
    - Your API keys are correctly set in the .env file
    - You have internet connection for API calls
    - Audio files are in supported formats
    - Database file is in the database folder
    """)


if __name__ == "__main__":
    main()
