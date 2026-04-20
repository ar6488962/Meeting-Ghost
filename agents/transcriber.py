"""
Transcriber Agent - Converts audio files to text using Groq Whisper API.
Supports: mp3, mp4, wav, m4a, ogg, webm formats or accepts pre-transcribed text directly.
Automatically splits large audio files (>25MB) into 10-minute chunks for transcription.
"""

import imageio_ffmpeg
import os
os.environ["PATH"] += os.pathsep + os.path.dirname(imageio_ffmpeg.get_ffmpeg_exe())

import shutil
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False

# Load environment variables
load_dotenv()

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# File size limit in bytes (25MB for Groq API)
FILE_SIZE_LIMIT = 25 * 1024 * 1024
CHUNK_DURATION_MS = 10 * 60 * 1000  # 10 minutes in milliseconds
TEMP_CHUNKS_DIR = "temp_chunks"


def _get_file_size_mb(file_path: str) -> float:
    """
    Gets the size of a file in megabytes.
    
    Args:
        file_path (str): Path to the file
    
    Returns:
        float: File size in MB
    """
    file_size_bytes = os.path.getsize(file_path)
    return file_size_bytes / (1024 * 1024)


def _create_temp_chunks_dir() -> None:
    """
    Creates the temporary chunks directory if it doesn't exist.
    """
    if not os.path.exists(TEMP_CHUNKS_DIR):
        os.makedirs(TEMP_CHUNKS_DIR)


def _cleanup_temp_chunks_dir() -> None:
    """
    Safely deletes the temporary chunks directory and all its contents.
    """
    try:
        if os.path.exists(TEMP_CHUNKS_DIR):
            shutil.rmtree(TEMP_CHUNKS_DIR)
    except Exception as e:
        # Log but don't fail if cleanup doesn't work
        print(f"Warning: Could not clean up temp_chunks directory: {str(e)}")


def _split_audio_into_chunks(file_path: str) -> list:
    """
    Splits an audio file into 10-minute chunks and saves them as MP3 files.
    
    Args:
        file_path (str): Path to the original audio file
    
    Returns:
        list: List of chunk file paths
        
    Raises:
        Exception: If pydub is not available or audio processing fails
    """
    
    if not PYDUB_AVAILABLE:
        raise Exception(
            "Large audio file detected (>25MB) but pydub is not installed. "
            "Please install pydub: pip install pydub"
        )
    
    try:
        # Create temp directory for chunks
        _create_temp_chunks_dir()
        
        # Load audio file
        audio = AudioSegment.from_file(file_path)
        
        # Calculate number of chunks needed
        total_duration = len(audio)  # in milliseconds
        num_chunks = (total_duration + CHUNK_DURATION_MS - 1) // CHUNK_DURATION_MS
        
        chunk_paths = []
        
        # Split audio into chunks
        for i in range(num_chunks):
            start_ms = i * CHUNK_DURATION_MS
            end_ms = min((i + 1) * CHUNK_DURATION_MS, total_duration)
            
            # Extract chunk
            chunk = audio[start_ms:end_ms]
            
            # Save chunk as MP3
            chunk_path = os.path.join(TEMP_CHUNKS_DIR, f"chunk_{i:04d}.mp3")
            chunk.export(chunk_path, format="mp3")
            
            chunk_paths.append(chunk_path)
        
        return chunk_paths
    
    except Exception as e:
        _cleanup_temp_chunks_dir()
        raise Exception(
            f"Failed to split audio file: {str(e)}. "
            "Please try uploading a smaller file or use 'Paste Transcript' mode instead."
        )


def _transcribe_chunk(chunk_path: str, chunk_number: int, total_chunks: int) -> str:
    """
    Transcribes a single audio chunk using Groq Whisper API.
    
    Args:
        chunk_path (str): Path to the audio chunk
        chunk_number (int): Current chunk number (for logging)
        total_chunks (int): Total number of chunks (for logging)
    
    Returns:
        str: Transcript of the chunk
        
    Raises:
        Exception: If transcription fails
    """
    
    try:
        with open(chunk_path, "rb") as audio_file:
            # Call Groq Whisper API
            transcript_response = client.audio.transcriptions.create(
                model="whisper-large-v3-turbo",
                file=audio_file
            )
        
        transcript = transcript_response.text.strip()
        return transcript
    
    except Exception as e:
        raise Exception(
            f"Failed to transcribe chunk {chunk_number}/{total_chunks}: {str(e)}"
        )


def transcribe_audio(file_path: str) -> str:
    """
    Transcribes an audio file using Groq Whisper API.
    For files larger than 25MB, automatically splits into 10-minute chunks.
    
    Args:
        file_path (str): Path to audio file (mp3, mp4, wav, m4a, ogg, webm)
    
    Returns:
        str: Clean transcript of the audio
        
    Raises:
        FileNotFoundError: If audio file doesn't exist
        ValueError: If API key is missing
        Exception: If transcription fails
    """
    
    if not os.getenv("GROQ_API_KEY"):
        raise ValueError("GROQ_API_KEY not found in environment variables")
    
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found: {file_path}")
    
    try:
        # Check file size
        file_size_mb = _get_file_size_mb(file_path)
        
        # If file is small enough, transcribe directly
        if file_size_mb <= 25:
            try:
                with open(file_path, "rb") as audio_file:
                    # Call Groq Whisper API
                    transcript_response = client.audio.transcriptions.create(
                        model="whisper-large-v3-turbo",
                        file=audio_file
                    )
                
                transcript = transcript_response.text.strip()
                
                if not transcript:
                    raise ValueError("No speech detected in audio file")
                
                return transcript
            
            except Exception as e:
                raise Exception(f"Transcription failed: {str(e)}")
        
        # File is too large, split into chunks
        else:
            try:
                chunk_paths = _split_audio_into_chunks(file_path)
                
                # Transcribe each chunk
                all_transcripts = []
                for chunk_num, chunk_path in enumerate(chunk_paths, 1):
                    chunk_transcript = _transcribe_chunk(
                        chunk_path,
                        chunk_num,
                        len(chunk_paths)
                    )
                    if chunk_transcript:
                        all_transcripts.append(chunk_transcript)
                
                # Join all transcripts with space
                combined_transcript = " ".join(all_transcripts).strip()
                
                if not combined_transcript:
                    raise ValueError("No speech detected in audio file")
                
                return combined_transcript
            
            except Exception as e:
                raise Exception(f"Large file transcription failed: {str(e)}")
    
    finally:
        # Always clean up temp chunks
        _cleanup_temp_chunks_dir()


def process_transcript(transcript_input: str) -> str:
    """
    Processes transcript input - either returns plain text directly
    or transcribes audio file if path is provided.
    
    Args:
        transcript_input (str): Either text transcript or path to audio file
    
    Returns:
        str: Cleaned transcript text
        
    Raises:
        ValueError: If input is invalid or empty
        Exception: If transcription fails
    """
    
    if not transcript_input or not isinstance(transcript_input, str):
        raise ValueError("Transcript input must be a non-empty string")
    
    transcript_input = transcript_input.strip()
    
    # Check if input is a file path
    if os.path.exists(transcript_input):
        # Verify it's a supported audio format
        supported_formats = {".mp3", ".mp4", ".wav", ".m4a", ".ogg", ".webm"}
        file_ext = Path(transcript_input).suffix.lower()
        
        if file_ext not in supported_formats:
            raise ValueError(
                f"Unsupported audio format: {file_ext}. "
                f"Supported formats: {', '.join(supported_formats)}"
            )
        
        return transcribe_audio(transcript_input)
    
    # Otherwise treat as plain text transcript
    else:
        return transcript_input


# Placeholder for database operations if needed in future
__all__ = ["transcribe_audio", "process_transcript"]
