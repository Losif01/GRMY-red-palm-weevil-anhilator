from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
import wave
import io
import uuid
from datetime import datetime
from app.database import get_db
from app.crud import recording as recording_crud
from app.crud import tree as tree_crud
from app.services.ai_service import process_recording, save_results_and_notify
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(tags=["WebSocket"])

# Configuration
SAMPLE_RATE = 8000
RECORD_SECONDS = 30
TARGET_BYTES = SAMPLE_RATE * RECORD_SECONDS * 2  # 480,000 bytes

@router.websocket("/ws/record/{tree_id}")
async def record_audio(
    websocket: WebSocket,
    tree_id: str,
    db: Session = Depends(get_db)
):
    await websocket.accept()
    
    try:
        # Validate tree_id
        try:
            tree_uid = uuid.UUID(tree_id)
        except ValueError:
            await websocket.send_text("Invalid tree_id format")
            await websocket.close()
            return
        
        # Check if tree exists
        tree = tree_crud.get_tree_by_id_only(db, tree_uid)
        if not tree:
            await websocket.send_text("Tree not found")
            await websocket.close()
            return
        
        print(f"\n WebSocket connected for tree: {tree.custom_name or tree.sensor_physical_id}")
        await websocket.send_text(f"Connected! Recording for 30 seconds...")
        
        # Collect audio data
        audio_frames = bytearray()
        
        while len(audio_frames) < TARGET_BYTES:
            try:
                # Receive binary chunk from ESP32
                chunk = await websocket.receive_bytes()
                audio_frames.extend(chunk)
                
                # Progress update
                if len(audio_frames) % (SAMPLE_RATE * 2) == 0:
                    seconds = len(audio_frames) // (SAMPLE_RATE * 2)
                    await websocket.send_text(f"Recorded {seconds}/{RECORD_SECONDS} seconds...")
                
            except WebSocketDisconnect:
                print("WebSocket disconnected during recording")
                return
        
        print(f"Recording complete! Total bytes: {len(audio_frames)}")
        await websocket.send_text("Recording complete! Processing...")
        
        # Save WAV file
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, 'wb') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(SAMPLE_RATE)
            wav_file.writeframes(audio_frames)
        
        wav_buffer.seek(0)
        
        # Create recording in DB
        recording_uid = str(uuid.uuid4())
        file_path = f"uploads/recordings/{recording_uid}.wav"
        
        # Save file to disk
        import os
        os.makedirs("uploads/recordings", exist_ok=True)
        with open(file_path, 'wb') as f:
            f.write(wav_buffer.getvalue())
        
        # Create recording record
        recording_data = {
            "recording_uid": recording_uid,
            "tree_id": tree_uid,
            "raw_audio_file_path": file_path,
            "recording_duration": RECORD_SECONDS,
            "sample_rate": SAMPLE_RATE,
            "processing_status": "Pending"
        }
        
        recording = recording_crud.create_recording(db, recording_data)
        
        print(f"Recording saved: {recording_uid}")
        await websocket.send_text(f"Recording saved! ID: {recording_uid}")
        
        # Trigger AI processing (in background)
        import asyncio
        asyncio.create_task(process_recording_async(recording_uid, db))
        
        await websocket.send_text("AI processing started!")
        await websocket.close()
        
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.send_text(f"Error: {str(e)}")
        await websocket.close()


async def process_recording_async(recording_uid: str, db: Session):
    try:
        results = process_recording(recording_uid)
        
        save_results_and_notify(db, recording_uid, results)
        
        print(f"Processing complete for {recording_uid}")
    except Exception as e:
        print(f"Processing failed: {e}")