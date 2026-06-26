#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>

const char* ssid     = "Lc01+";
const char* password = "88888888";

// This IP was grabbed using `hostname -i`, and it should be the local IP of the server the backend is no
const char* backend_ip = "10.38.50.170";

// dummy port for testing, code integration will need more sophistication
const int backend_port = 8000;

//const char* tree_id = "tree-uuid-here";

WebSocketsClient webSocket;

unsigned long lastTime = 0;
const unsigned long sampleInterval = 125; // 8000 Hz

// --- The Buffer ---
const int BUFFER_SIZE = 500;
int16_t audioBuffer[BUFFER_SIZE];
int bufferIndex = 0;

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("WebSocket disconnected!");
      break;

    case WStype_CONNECTED:
      Serial.println("WebSocket connected to Backend!");
      Serial.printf("Connected to url: %s\n", payload);
      break;

    case WStype_TEXT:
      Serial.printf("Backend says: %s\n", payload);
      break;

    case WStype_ERROR:
      Serial.println("WebSocket error!");
      break;
  }
}

void setup() {
  Serial.begin(115200);

  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected.");
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());

  // Connect to Backend WebSocket (Added the /api/v1 prefix!)
// Connect directly to the root of the mock server
  webSocket.begin(backend_ip, backend_port, "/");
  webSocket.onEvent(webSocketEvent);

  // Auto-reconnect every 5 seconds if connection drops
  webSocket.setReconnectInterval(5000);

  Serial.println("Connecting to Backend WebSocket...");
}

void loop() {
  webSocket.loop();

  // Check if connected before sending data
  if (webSocket.isConnected()) {
    unsigned long currentTime = micros();

    if (currentTime - lastTime >= sampleInterval) {
      lastTime = currentTime;

      // 1. Generate the mock 1500Hz sine wave
      float timeInSeconds = currentTime / 1000000.0;
      float sinValue = sin(timeInSeconds * 2.0 * PI * 1500.0);

      // 2. Get the raw 0-4095 value (Simulating 12-bit ADC)
      int simulatedADC = 2048 + (sinValue * 2047);

      // 3. Convert to 16-bit PCM audio format
      int centered = simulatedADC - 2048;
      int16_t pcm_value = centered * 16;

      // 4. Store in buffer
      audioBuffer[bufferIndex] = pcm_value;
      bufferIndex++;

      // 5. If buffer is full, send to Backend
      if (bufferIndex >= BUFFER_SIZE) {
        // webSocket.sendBIN pushes the memory block specifically to the connected server
        webSocket.sendBIN((uint8_t*)audioBuffer, sizeof(audioBuffer));
        bufferIndex = 0;
      }
    }
  }
}
