import asyncio
import wave
from datetime import datetime

import websockets

ESP32_IP = "10.38.50.20"
WS_URL = f"ws://{ESP32_IP}:81/"
current_time = datetime.now().strftime("%H:%M")


RECORD_SECONDS = 30
SAMPLE_RATE = 8000  # do not change!
OUTPUT_FILE = f"{current_time}_esp32_buffered_audio@{ESP32_IP}.wav"


async def record_wave():
    print(f"Connecting to ESP32 at {WS_URL}...")

    # We are tracking total BYTES now.
    # 8000 samples/sec * 30 seconds = 240,000 samples.
    # Each sample is a 16-bit integer (2 bytes).
    # So we need exactly 480,000 bytes.
    TARGET_BYTES = SAMPLE_RATE * RECORD_SECONDS * 2

    try:
        async with websockets.connect(WS_URL, max_size=None) as websocket:
            print(f"Connected! Collecting {TARGET_BYTES} bytes of audio. Keep quiet...")

            audio_frames = bytearray()  # A highly efficient binary array

            while len(audio_frames) < TARGET_BYTES:
                # Receive the chunk of 500 samples (1000 bytes)
                chunk = await websocket.recv()
                audio_frames.extend(chunk)

                # Progress tracker
                if len(audio_frames) % (SAMPLE_RATE * 2) == 0:
                    seconds = len(audio_frames) // (SAMPLE_RATE * 2)
                    print(f"Recorded {seconds}/{RECORD_SECONDS} seconds...")

            print(f"\nRecording complete. Saved exactly 30 seconds of audio.")

            # Save the raw binary array straight to the .wav file
            with wave.open(OUTPUT_FILE, "wb") as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(SAMPLE_RATE)
                wav_file.writeframes(audio_frames)

            print("Done! Try playing it now.")

    except Exception as e:
        print(f"Connection failed: {e}")


if __name__ == "__main__":
    asyncio.run(record_wave())
