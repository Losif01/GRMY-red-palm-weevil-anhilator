import asyncio
import wave
from datetime import datetime

import websockets

# Audio configuration
SAMPLE_RATE = 8000
RECORD_SECONDS = 30
TARGET_BYTES = SAMPLE_RATE * RECORD_SECONDS * 2  # 480,000 bytes


async def handle_connection(websocket):
    print("\n🟢 ESP32 Connected! Starting 30-second recording...")

    audio_frames = bytearray()

    try:
        # Read the binary stream chunk by chunk
        async for message in websocket:
            audio_frames.extend(message)

            # Progress tracker (prints every 1 second of audio)
            if len(audio_frames) % (SAMPLE_RATE * 2) == 0:
                seconds = len(audio_frames) // (SAMPLE_RATE * 2)
                print(f"Recorded {seconds}/{RECORD_SECONDS} seconds...")

            # Stop listening once we hit our target duration
            if len(audio_frames) >= TARGET_BYTES:
                print("\n✅ Reached 30 seconds of audio. Processing...")
                break

        # Save the file if we got enough data
        if len(audio_frames) >= TARGET_BYTES:
            # Trim to exactly 480,000 bytes in case the last chunk overshot slightly
            exact_frames = audio_frames[:TARGET_BYTES]

            timestamp = datetime.now().strftime("%H-%M-%S")
            output_filename = f"esp32_test_{timestamp}.wav"

            with wave.open(output_filename, "wb") as wav_file:
                wav_file.setnchannels(1)  # Mono audio
                wav_file.setsampwidth(2)  # 16-bit integer
                wav_file.setframerate(SAMPLE_RATE)
                wav_file.writeframes(exact_frames)

            print(f"🎉 Success! Audio saved to: {output_filename}")

            # Close connection so the ESP32 knows to go back to sleep (or restart loop)
            await websocket.close()

    except websockets.exceptions.ConnectionClosed:
        print("🔴 ESP32 Disconnected prematurely.")


async def main():
    print("🚀 Starting mock WebSocket server on ws://0.0.0.0:8000")
    print("Waiting for ESP32 to connect...")
    async with websockets.serve(handle_connection, "0.0.0.0", 8000):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
