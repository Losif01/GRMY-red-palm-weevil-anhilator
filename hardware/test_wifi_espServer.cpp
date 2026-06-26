#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsServer.h>
//! This file was only created to test esp connection inside a local network and try and download a .wav packet stream
//! DO NOT EVER USE THIS IN PRODUCTION
const char* ssid     = "Lc01+";
const char* password = "88888888";

WebSocketsServer webSocket = WebSocketsServer(81);

unsigned long lastTime = 0;
const unsigned long sampleInterval = 125; // 8000 Hz

// --- The Buffer ---
const int BUFFER_SIZE = 500;
int16_t audioBuffer[BUFFER_SIZE]; // Array of 16-bit integers
int bufferIndex = 0;

void setup() {
  Serial.begin(115200);

  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected.");
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());

  webSocket.begin();
  Serial.println("WebSocket Binary Stream Started.");
}

void loop() {
  webSocket.loop();

  unsigned long currentTime = micros();

  if (currentTime - lastTime >= sampleInterval) {
    lastTime = currentTime;

    // 1. Generate the wave
    float timeInSeconds = currentTime / 1000000.0;
    float sinValue = sin(timeInSeconds * 2.0 * PI * 1500.0);

    // 2. Get the raw 0-4095 value
    int simulatedADC = 2048 + (sinValue * 2047);

    // 3. Convert immediately to 16-bit PCM audio format
    int centered = simulatedADC - 2048;
    int16_t pcm_value = centered * 16;

    // 4. Store it in the array
    audioBuffer[bufferIndex] = pcm_value;
    bufferIndex++;

    // 5. If the buffer is full, blast the whole thing over Wi-Fi
    if (bufferIndex >= BUFFER_SIZE) {
      // Send the memory block as binary bytes
      webSocket.broadcastBIN((uint8_t*)audioBuffer, sizeof(audioBuffer));

      // Reset the index to start filling the buffer again
      bufferIndex = 0;
    }
  }
}




#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>

const char* ssid     = "Lc01+";
const char* password = "88888888";

const char* backend_ip = "192.168.1.100";
const int backend_port = 8000;
const char* tree_id = "your-tree-uuid-here";

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
      Serial.printf("Connected to: %s\n", payload);
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

  // Connect to Backend WebSocket
  String ws_path = String("/ws/record/") + tree_id;
  webSocket.begin(backend_ip, backend_port, ws_path.c_str());
  webSocket.onEvent(webSocketEvent);

  // Auto-reconnect every 5 seconds
  webSocket.setReconnectInterval(5000);

  Serial.println("Connecting to Backend WebSocket...");
}

void loop() {
  webSocket.loop();

  // Check if connected before sending
  if (webSocket.isConnected()) {
    unsigned long currentTime = micros();

    if (currentTime - lastTime >= sampleInterval) {
      lastTime = currentTime;

      // 1. Generate the wave (mock audio)
      float timeInSeconds = currentTime / 1000000.0;
      float sinValue = sin(timeInSeconds * 2.0 * PI * 1500.0);

      // 2. Get the raw 0-4095 value
      int simulatedADC = 2048 + (sinValue * 2047);

      // 3. Convert to 16-bit PCM audio format
      int centered = simulatedADC - 2048;
      int16_t pcm_value = centered * 16;

      // 4. Store in buffer
      audioBuffer[bufferIndex] = pcm_value;
      bufferIndex++;

      // 5. If buffer is full, send to Backend
      if (bufferIndex >= BUFFER_SIZE) {
        // Send to Backend (not broadcast)
        webSocket.sendBIN((uint8_t*)audioBuffer, sizeof(audioBuffer));

        Serial.printf("Sent %d bytes to Backend\n", sizeof(audioBuffer));

        // Reset buffer
        bufferIndex = 0;
      }
    }
  }
}
