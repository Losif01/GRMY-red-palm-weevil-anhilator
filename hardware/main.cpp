// {
//   "message": "Group 'Test0' has been created successfully.",
//   "group": {
//     "group_uid": "8bc548a8-572c-4e8e-9ce3-8de2e078c515",
//     "owner_id": "443caf23-2099-488a-ba26-91fec444e636",
//     "group_name": "Test0",
//     "created_at": "2026-06-28T15:34:20.137480+03:00",
//     "reading_interval_minutes": 60
//   }
// }

// {
//   "message": "Tree 'Miki' has been added successfully to group 'Test0'.",
//   "tree": {
//     "tree_uid": "9e58bca0-a7e3-4835-8c54-2668679a2bc3",
//     "sensor_physical_id": "10.38.50.20",
//     "owner_id": "443caf23-2099-488a-ba26-91fec444e636",
//     "group_id": "8bc548a8-572c-4e8e-9ce3-8de2e078c515",
//     "display_order": 2,
//     "custom_name": "Miki",
//     "current_status": "ONLINE",
//     "battery_status": "OK",
//     "next_reading_at": null,
//     "latest_reading_classification": null,
//     "registered_at": "2026-06-28T15:57:05.764751+03:00"
//   }
// }

#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <SPI.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- CONFIGURATION ---
const char* ssid     = "Lc01+";
const char* password = "88888888";
const char* backend_ip = "10.38.50.170";
const int backend_port = 8000;
const char* tree_id = "500b9fae-a96a-4638-b3fc-bb3140c216b7";



WebSocketsClient webSocket;

// --- HARDWARE CONFIGURATION ---
const int CS_PIN = 5;

// --- TIMING & SLEEP CONFIGURATION ---
#define uS_TO_M_FACTOR 60000000ULL // Conversion factor for Microseconds to Minutes
int sleepIntervalMinutes = 60;     // Default to 60, will be updated by the server
unsigned long streamStartTime = 0;
const unsigned long STREAM_DURATION = 11000; // 11 seconds of streaming

unsigned long lastSampleTime = 0;
const unsigned long sampleInterval = 125; // 8000 Hz

const int BUFFER_SIZE = 512;
int16_t audioBuffer[BUFFER_SIZE];
int bufferIndex = 0;
bool isStreaming = false;

int buffersSent = 0;
const int TARGET_BUFFERS = 175; // 175 buffers * 1024 bytes = 179,200 bytes

// --- WEBSOCKET EVENT HANDLER ---
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_CONNECTED) {
    Serial.println("🟢 WebSocket connected! Starting 11-second stream...");
    isStreaming = true;
    streamStartTime = millis();
  } else if (type == WStype_DISCONNECTED) {
    isStreaming = false;
  }
}

// --- MISSION CONTROL (Runs once per wake-up) ---
void setup() {
  Serial.begin(115200);
  delay(1000); // Brief wake-up delay
  Serial.println("\n\n=== ESP-32D WAKING UP FROM DEEP SLEEP ===");

  SPI.begin();
  pinMode(CS_PIN, OUTPUT);
  digitalWrite(CS_PIN, HIGH);

  // 1. Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected.");

  // 2. Send Heartbeat (HTTP PUT)
  HTTPClient http;
  String heartbeatUrl = String("http://") + backend_ip + ":" + backend_port + "/api/v1/trees/" + tree_id + "/status";
  http.begin(heartbeatUrl);
  http.addHeader("Content-Type", "application/json");

  // Hardcoding battery to OK since we lack the IC
  String jsonPayload = "{\"battery_level\":\"OK\"}";
  int httpResponseCode = http.PUT(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println(" Heartbeat accepted by server.");
    // In a full production version, you would parse the JSON response here
    // to dynamically update the sleepIntervalMinutes variable.
  } else {
    Serial.println("Heartbeat failed, continuing anyway...");
  }
  http.end();

  // 3. Open WebSocket for Audio
  String ws_path = String("/api/v1/ws/record/") + tree_id;
  webSocket.begin(backend_ip, backend_port, ws_path.c_str());
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop();

  if (isStreaming) {
    unsigned long currentTime = micros();

    // The strict 8000Hz metronome
    if (currentTime - lastSampleTime >= sampleInterval) {
      lastSampleTime = currentTime;

      digitalWrite(CS_PIN, LOW);
      SPI.transfer(0x01);
      byte msb = SPI.transfer(0xA0);
      byte lsb = SPI.transfer(0x00);
      digitalWrite(CS_PIN, HIGH);

      uint16_t adcValue = ((msb & 0x0F) << 8) | lsb;
      int16_t pcm_value = (adcValue - 2048) * 16;

      audioBuffer[bufferIndex++] = pcm_value;

      // When the buffer is full, send it!
      if (bufferIndex >= BUFFER_SIZE) {
        webSocket.sendBIN((uint8_t*)audioBuffer, sizeof(audioBuffer));
        bufferIndex = 0;
        buffersSent++; // Track successful sends

        // --- NEW: Trigger sleep ONLY when target data is reached ---
        if (buffersSent >= TARGET_BUFFERS) {
          Serial.print("📦 Target data reached! Total buffers sent: ");
          Serial.println(buffersSent);

          webSocket.disconnect();
          isStreaming = false;
          buffersSent = 0; // Reset for next time

          delay(500); // Let the WiFi chip finish sending the disconnect frame

          Serial.printf("💤 Mission complete. Sleeping for %d minutes...\n", sleepIntervalMinutes);
          esp_sleep_enable_timer_wakeup(sleepIntervalMinutes * uS_TO_M_FACTOR);
          esp_deep_sleep_start();
        }
      }
    }
  }
}
