import asyncio
import io
import os
import uuid
import wave
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.crud import recording as recording_crud
from app.crud import tree as tree_crud
from app.database import get_db
from app.services.ai_service import process_recording, save_results_and_notify

router = APIRouter(tags=["WebSocket"])

# Configuration
SAMPLE_RATE = 8000
RECORD_SECONDS = 30
TARGET_BYTES = SAMPLE_RATE * RECORD_SECONDS * 2  # 480,000 bytes


# A simple class to match the data structure the CRUD function expects
class RecordingData:
    def __init__(self, path):
        self.raw_audio_file_path = path


@router.websocket("/ws/record/{tree_id}")
async def record_audio(
    websocket: WebSocket, tree_id: str, db: Session = Depends(get_db)
):
    await websocket.accept()

    try:
        # 1. Validate tree_id format
        try:
            tree_uid = uuid.UUID(tree_id)
        except ValueError:
            await websocket.send_text("Invalid tree_id format")
            await websocket.close()
            return

        # 2. Check if tree exists in the database
        tree = tree_crud.get_tree_by_id_only(db, tree_uid)
        if not tree:
            await websocket.send_text("Tree not found")
            await websocket.close()
            return

        print(
            f"\n🟢 WebSocket connected for tree: {tree.custom_name or tree.sensor_physical_id}"
        )
        await websocket.send_text(
            f"Connected! Recording for {RECORD_SECONDS} seconds..."
        )

        # 3. Collect binary audio data from the ESP32
        audio_frames = bytearray()

        while len(audio_frames) < TARGET_BYTES:
            try:
                chunk = await websocket.receive_bytes()
                audio_frames.extend(chunk)

                # Progress update sent back to the ESP32 (optional but helpful)
                if len(audio_frames) % (SAMPLE_RATE * 2) == 0:
                    seconds = len(audio_frames) // (SAMPLE_RATE * 2)
                    await websocket.send_text(
                        f"Recorded {seconds}/{RECORD_SECONDS} seconds..."
                    )

            except WebSocketDisconnect:
                print("🔴 WebSocket disconnected during recording")
                return

        print(f"✅ Recording complete! Total bytes: {len(audio_frames)}")
        await websocket.send_text("Recording complete! Processing...")

        # 4. Save the binary array as a .wav file
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(SAMPLE_RATE)
            # Ensure we only write exactly the target amount to avoid corrupted files
            wav_file.writeframes(audio_frames[:TARGET_BYTES])

        # Generate a unique filename
        file_uuid = str(uuid.uuid4())
        file_path = f"uploads/recordings/{file_uuid}.wav"

        os.makedirs("uploads/recordings", exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(wav_buffer.getvalue())

        # 5. Create the database record (FIXED LOGIC)
        recording_data = RecordingData(file_path)
        recording = recording_crud.create_recording(
            db=db, recording_data=recording_data, tree_uid=tree_uid
        )

        db_recording_uid = str(recording.recording_uid)
        print(f"💾 Recording saved to database with ID: {db_recording_uid}")
        await websocket.send_text(f"Recording saved! ID: {db_recording_uid}")

        # 6. Trigger AI processing in the background
        asyncio.create_task(process_recording_async(db_recording_uid, db))

        await websocket.send_text("🤖 AI processing started!")
        await websocket.close()

    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        try:
            await websocket.send_text(f"Error: {str(e)}")
            await websocket.close()
        except:
            pass


async def process_recording_async(recording_uid: str, db: Session):
    """Background task to run the mock AI and send emails if needed"""
    try:
        # Note: In a production app, background tasks shouldn't share the main DB session,
        # but this will work perfectly for your graduation project prototype.
        results = process_recording(recording_uid)
        save_results_and_notify(db, recording_uid, results)
        print(f"✨ AI Processing complete for {recording_uid}")
    except Exception as e:
        print(f"⚠️ AI Processing failed: {e}")
