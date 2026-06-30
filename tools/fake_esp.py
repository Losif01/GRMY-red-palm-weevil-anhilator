import asyncio
import sys

import librosa
import numpy as np
import websockets

# --- CONFIGURATION ---
# Replace this with your actual Tree UUID!
TREE_UUID = "500b9fae-a96a-4638-b3fc-bb3140c216b7"
BACKEND_URI = f"ws://localhost:8000/api/v1/ws/record/{TREE_UUID}"

# Point this to one of your test files
TEST_FILE = "app/AI_model/recordings sample 10_second/infested_8.wav"


async def simulate_hardware():
    print(f"🎙️ Loading test audio: {TEST_FILE} using librosa...")

    try:
        # 1. Load the audio using librosa
        # Forcing sr=8000 ensures it matches the ESP32 sample rate
        signal, sr = librosa.load(TEST_FILE, sr=8000)
        duration = len(signal) / sr
        print(f"✅ Loaded {duration:.1f} seconds of audio.")
    except Exception as e:
        print(f"❌ Failed to load audio: {e}")
        sys.exit(1)

    # 2. Convert Librosa's float32 array (-1.0 to 1.0) to 16-bit PCM
    # This perfectly mimics the raw electrical data the ESP32 sends
    pcm_audio = np.int16(signal * 32767)
    payload = pcm_audio.tobytes()

    print(f"🔌 Connecting to Backend: {BACKEND_URI}")
    try:
        async with websockets.connect(BACKEND_URI) as websocket:
            # Wait for the welcome message
            welcome = await websocket.recv()
            print(f"Backend says: {welcome}")

            # Stream the raw bytes to the server exactly as it is
            print(f"📤 Streaming {len(payload)} bytes to server...")
            chunk_size = 8000
            for i in range(0, len(payload), chunk_size):
                await websocket.send(payload[i : i + chunk_size])
                await asyncio.sleep(0.05)  # Tiny delay to simulate network transfer

            print("✅ Stream finished. Waiting for backend...")

            # Listen for backend confirmation.
            # If your backend triggers AI on disconnect, we will close cleanly after a short wait.
            try:
                while True:
                    response = await asyncio.wait_for(websocket.recv(), timeout=3.0)
                    print(f"Backend says: {response}")
            except asyncio.TimeoutError:
                print(
                    "⏱️ Stream complete. Closing connection to trigger backend AI processing..."
                )
            except websockets.exceptions.ConnectionClosed:
                print(
                    "🔌 Connection closed by backend. Check FastAPI terminal for AI results!"
                )

    except ConnectionRefusedError:
        print("❌ Connection refused. Is your FastAPI server running?")


if __name__ == "__main__":
    asyncio.run(simulate_hardware())
