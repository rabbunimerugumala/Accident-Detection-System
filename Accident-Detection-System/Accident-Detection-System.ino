/**************************************************************
 * PROJECT: Smart Accident + Hazard Detection & Alert System
 * MICROCONTROLLER: ESP32-S3 N16R8 (Dual Core)
 *
 * ----------------- SENSOR CONNECTIONS ----------------------
 * // These connections are kept exactly as in the original code to ensure hardware compatibility.
 * // No changes to pins for consistency with user's setup.
 *
 * MPU6050 (I2C)          // Accelerometer/Gyro for crash detection (tilt and g-force).
 *   SDA  -> GPIO 8       // SDA pin for I2C communication with MPU6050.
 *   SCL  -> GPIO 9       // SCL pin for clock signal in I2C bus.
 *
 * OLED SSD1306 (I2C)     // Display for real-time sensor data visualization.
 *   SDA  -> GPIO 4       // SDA for OLED I2C.
 *   SCL  -> GPIO 3       // SCL for OLED I2C.
 *
 * DHT11 (Temperature)    // Digital temperature sensor for environmental monitoring.
 *   DATA -> GPIO 7       // Single data pin for reading temperature (efficient one-wire protocol).
 *
 * MQ-2 Gas Sensor        // Analog gas/smoke sensor for hazard detection.
 *   DO   -> GPIO 5       // Analog output pin (reads voltage levels for gas concentration).
 *
 * Flame Sensor           // Digital flame/IR sensor for fire hazard.
 *   OUT  -> GPIO 6       // Digital output (HIGH/LOW for flame detected/not).
 *
 * Water Level Sensor     // Digital water detection for flooding hazard.
 *   OUT  -> GPIO 10      // Digital output (HIGH/LOW for water present/absent).
 *
 * NEO-M8N GPS (UART)     // GPS module for location tracking.
 *   TX   -> GPIO 18      // GPS TX to ESP RX for receiving NMEA data.
 *   RX   -> GPIO 17      // GPS RX to ESP TX for potential commands (though not used here).
 *
 * Buzzer                 // Audible alert for crash/hazard.
 *   +    -> GPIO 11      // PWM-capable pin for tone control if needed.
 *
 * Cancel Button (User STOP) // Button to cancel false-positive crash alerts.
 *   SW   -> GPIO 12      // Input with pulldown for reliable debouncing.
 *
 * LED Indicator          // Visual status LED.
 *   LED  -> GPIO 2       // Simple digital output for on/off/blinking.
 *
 **************************************************************/

// ------------------------ Includes --------------------------
// // Core Arduino library for basic functions.
#include <Arduino.h>
// // I2C library for sensor and display communication.
#include <Wire.h>
// // Standard integer types for portability.
#include <stdint.h>
// // OLED display library for efficient graphics rendering.
#include <Adafruit_SSD1306.h>
// // Graphics library for text and shapes on OLED.
#include <Adafruit_GFX.h>
// // DHT sensor library for temperature reading (optimized for low-power digital sensors).
#include "DHT.h"
// // Hardware serial for GPS UART communication.
#include <HardwareSerial.h>
// // WiFi library for network connectivity.
#include <WiFi.h>
// // HTTP client for Firebase uploads (efficient for REST API calls).
#include <HTTPClient.h>
// // TinyGPS++ for efficient GPS NMEA parsing (replaces custom faulty parsing).
#include <TinyGPSPlus.h>
// // Adafruit MPU6050 library for calibrated accelerometer/gyro readings (better than basic MPU6050 lib).
#include <Adafruit_MPU6050.h>
// // Required for MPU events.
#include <Adafruit_Sensor.h>

// ---------------- PINS & CONSTANT DEFINITIONS ---------------
// // Pin definitions kept as constants for easy changes; no runtime overhead.
const uint8_t PIN_DHT      = 7;    // DHT11 data pin – efficient one-wire read.
const uint8_t PIN_MQ2      = 5;    // MQ-2 analog pin – use analogRead for precise gas levels.
const uint8_t PIN_FLAME    = 6;    // Flame sensor digital pin – fast digitalRead for detection.
const uint8_t PIN_WATER    = 10;   // Water sensor digital pin – quick binary check.
const uint8_t PIN_BUZZER   = 11;   // Buzzer pin – digitalWrite for simple on/off.
const uint8_t PIN_BUTTON   = 12;   // Button pin – INPUT_PULLDOWN for noise-free reading.
const uint8_t PIN_LED      = 2;    // LED pin – for visual feedback without delay.

const uint8_t PIN_SDA_OLED = 4;    // OLED SDA – separate I2C bus to avoid conflicts.
const uint8_t PIN_SCL_OLED = 3;    // OLED SCL – clock for display updates.

const uint8_t MPU_SDA      = 8;    // MPU SDA – dedicated I2C for sensor isolation.
const uint8_t MPU_SCL      = 9;    // MPU SCL – ensures no interference with OLED.

#define DHTTYPE DHT11              // Define DHT type – efficient for basic temp sensing.

// Crash state enum
// // Enum for crash states – memory-efficient uint8_t.
enum crash_state_t : uint8_t {
  CRASH_NONE = 0,
  CRASH_SUSPECTED,
  CRASH_CONFIRMED
};

// -------------------- GLOBAL VARIABLES ----------------------
// // Volatile for crash_state to handle potential interrupts (though not used here yet).
volatile crash_state_t crash_state = CRASH_NONE;

// // Sensor variables – floats for precision, bools for hazards to save memory.
float temperature_c = 0.0f;        // Temperature from DHT11.
float g_force       = 0.0f;        // Calculated G-force from MPU.
float tilt_angle    = 0.0f;        // Tilt angle from MPU.

bool hazard_fire    = false;       // Flame detection flag.
bool hazard_gas     = false;       // Gas leak flag.
bool hazard_water   = false;       // Water detection flag.

float gps_lat       = 0.0f;        // GPS latitude.
float gps_lon       = 0.0f;        // GPS longitude.

// // Non-blocking crash timer – efficient to avoid blocking delays.
unsigned long crash_suspect_time = 0;

// -------------------- OBJECTS -------------------------------
// // DHT object – initialized with pin and type for efficient readings.
DHT dht(PIN_DHT, DHTTYPE);
// // OLED object – with reset pin -1 (none) for standard setup.
Adafruit_SSD1306 display(128, 64, &Wire, -1);
// // GPS serial – UART1 on specific pins for reliable communication.
HardwareSerial GPS(1);
// // TinyGPS++ object – efficient parser for NMEA sentences.
TinyGPSPlus gps;
// // MPU6050 object – Adafruit version for calibrated, event-based reads.
Adafruit_MPU6050 mpu;

// ---------------- WIFI CREDENTIALS -------------------------
// // WiFi credentials – const char* for flash storage efficiency.
const char* WIFI_SSID = "ESPTest";
const char* WIFI_PASS = "test1234";

// ---------------- FIREBASE URL ------------------------------
// // Firebase URL – use POST for push instead of PUT to avoid overwriting.
const char* FIREBASE_URL = "https://accident-detection-syste-f7f23-default-rtdb.firebaseio.com/accidents.json";

// ---------------- FUNCTION PROTOTYPES -----------------------
// // Prototypes for tasks and helpers – allows forward declaration.
void sensorTask(void *pv);
void gpsTask(void *pv);
void displayTask(void *pv);
void cloudTask(void *pv);
void checkCrashLogic();
void oledPrint(const String&, const String&);

// ---------------- TWO I2C BUSES -----------------------------
// // Separate I2C instances – efficient to prevent bus conflicts on multi-sensor setup.
TwoWire WireOLED = TwoWire(0);  // I2C0 for OLED – dedicated for display updates.
TwoWire WireMPU  = TwoWire(1);  // I2C1 for MPU – isolated for fast sensor polling.

/**************************************************************
 * FUNCTION: setup()
 * PURPOSE : Initialize sensors, WiFi, display, tasks
 **************************************************************/
void setup() {
  // // Start serial at 115200 baud – efficient for debug without overhead.
  Serial.begin(115200);

  // // Set pin modes – OUTPUT for actuators, INPUT_PULLDOWN for button to reduce noise.
  pinMode(PIN_LED, OUTPUT);       // LED for status indication.
  pinMode(PIN_BUZZER, OUTPUT);    // Buzzer for alerts.
  pinMode(PIN_BUTTON, INPUT_PULLDOWN);  // Button with internal pulldown for debouncing.

  // // Initialize OLED I2C bus – separate to avoid conflicts with MPU.
  WireOLED.begin(PIN_SDA_OLED, PIN_SCL_OLED);
  // // Start OLED display – check for success to ensure it's ready.
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED init failed");
    for(;;);  // Halt if failed – prevents running without display.
  }
  oledPrint("System Booting...", "Initializing...");  // Boot message on OLED.

  // // Initialize MPU I2C bus – separate for efficiency.
  WireMPU.begin(MPU_SDA, MPU_SCL);
  // // Start MPU6050 – with Adafruit lib for better calibration.
  if (!mpu.begin(0x68, &WireMPU)) {  // Address 0x68, using WireMPU bus.
    Serial.println("MPU6050 failed!");
    for(;;);  // Halt if sensor critical.
  }
  // // Set MPU ranges – 8G accel for crash detection, 500deg gyro for tilt.
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);  // Efficient for vehicle impacts.
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);       // Balanced sensitivity.
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);    // Filter noise for accurate readings.
  Serial.println("MPU6050 Connected");

  // // Start DHT sensor – simple init for periodic reads.
  dht.begin();

  // // Connect WiFi – with timeout for efficiency.
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  oledPrint("Connecting WiFi...", "");  // Update OLED during connect.
  int wifi_attempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifi_attempts < 40) {  // 20s timeout.
    delay(500);
    Serial.print(".");
    wifi_attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    oledPrint("WiFi Connected", "");
  } else {
    oledPrint("WiFi Failed", "Check Network");
    // // Optional: retry later in task.
  }

  // // Start GPS UART – 9600 baud standard for NEO-M8N, efficient for NMEA.
  GPS.begin(9600, SERIAL_8N1, 18, 17);

  // // Create FreeRTOS tasks – pinned to cores for efficiency (core 0: sensors/GPS, core 1: display/cloud).
  xTaskCreatePinnedToCore(sensorTask, "SensorTask", 4096, NULL, 1, NULL, 0);  // Core 0 for real-time sensor polling.
  xTaskCreatePinnedToCore(gpsTask,    "GPSTask",    4096, NULL, 1, NULL, 0);  // Core 0 for UART reading.
  xTaskCreatePinnedToCore(displayTask,"DisplayTask",4096, NULL, 1, NULL, 1);  // Core 1 for UI updates.
  xTaskCreatePinnedToCore(cloudTask,  "CloudTask",  8192, NULL, 1, NULL, 1);  // Core 1 for network (larger stack for HTTP).

  oledPrint("Ready", "System OK");  // Final boot message.
}

/**************************************************************
 * LOOP — NOT USED (FreeRTOS handles everything)
 **************************************************************/
void loop() { 
  vTaskDelay(1);  // Yield to tasks – efficient idle.
}

/**************************************************************
 * TASK: sensorTask
 * PURPOSE: Read sensor values continuously
 **************************************************************/
void sensorTask(void *pv) {
  for (;;) {
    // // Read DHT temperature – isnan check for invalid reads, efficient single call.
    temperature_c = dht.readTemperature();
    if (isnan(temperature_c)) temperature_c = 0.0f;  // Default to 0 on error.

    // // Read MPU6050 – using event struct for calibrated data.
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);  // Efficient batch read of accel/gyro/temp.

    // // Calculate G-force – sqrt for magnitude, normalized to g (9.81 m/s²).
    g_force = sqrt(a.acceleration.x * a.acceleration.x + 
                   a.acceleration.y * a.acceleration.y + 
                   a.acceleration.z * a.acceleration.z) / 9.81f;

    // // Calculate tilt – atan2 for angle from Y/Z axes, in degrees for readability.
    tilt_angle = atan2(a.acceleration.y, a.acceleration.z) * 180 / PI;

    // // Read MQ-2 – analogRead for voltage level, threshold calibrated (adjust 500 after testing).
    int mq_value = analogRead(PIN_MQ2);  // 12-bit resolution on ESP32-S3 for precision.
    hazard_gas = (mq_value > 500);      // Threshold: test in clean air (~100-300), set 1.5x higher.

    // // Read flame sensor – digitalRead for fast binary detection.
    hazard_fire = digitalRead(PIN_FLAME);  // LOW active typically (check sensor spec).

    // // Read water sensor – digitalRead for quick presence check.
    hazard_water = digitalRead(PIN_WATER); // HIGH when water detected (common config).

    // // Debug print – optional, can remove for production to save cycles.
    Serial.println("---- SENSOR DATA ----");
    Serial.printf("Temp: %.2f°C\n", temperature_c);
    Serial.printf("G-Force: %.2f\n", g_force);
    Serial.printf("Tilt: %.2f°\n", tilt_angle);
    Serial.printf("Fire: %d Gas: %d Water: %d\n", hazard_fire, hazard_gas, hazard_water);
    Serial.printf("GPS: %.5f , %.5f\n\n", gps_lat, gps_lon);

    // // Check crash logic – non-blocking for efficiency.
    checkCrashLogic();

    // // Delay 300ms – balanced for ~3Hz updates without overloading core.
    vTaskDelay(300 / portTICK_PERIOD_MS);
  }
}

/**************************************************************
 * FUNCTION: checkCrashLogic()
 * PURPOSE : Detect crash/fall and handle cancel logic
 **************************************************************/
void checkCrashLogic() {
  // // Detection criteria – tilt >65° for fall, g>3 for impact (tunable).
  bool bikeFall = abs(tilt_angle) > 65.0f;
  bool carImpact = g_force > 3.0f;

  // // Suspect crash if none before – start timer non-blocking.
  if ((bikeFall || carImpact) && crash_state == CRASH_NONE) {
    crash_state = CRASH_SUSPECTED;
    crash_suspect_time = millis();
    digitalWrite(PIN_BUZZER, HIGH);  // Alert on.
    Serial.println("Crash suspected...");
  }

  // // Handle suspected state – check button or timeout without blocking.
  if (crash_state == CRASH_SUSPECTED) {
    if (digitalRead(PIN_BUTTON) == HIGH) {  // Button press (assuming active HIGH).
      crash_state = CRASH_NONE;
      digitalWrite(PIN_BUZZER, LOW);
      Serial.println("Crash cancelled");
    } else if (millis() - crash_suspect_time >= 15000) {  // 15s timeout.
      digitalWrite(PIN_BUZZER, LOW);
      crash_state = CRASH_CONFIRMED;
      Serial.println("CRASH CONFIRMED!");
      // // Optional: trigger immediate cloud upload here.
    }
  }
}

/**************************************************************
 * TASK: gpsTask
 * PURPOSE: Read GPS latitude and longitude
 **************************************************************/
void gpsTask(void *pv) {
  for (;;) {
    // // Read available bytes – non-blocking loop for efficiency.
    while (GPS.available() > 0) {
      gps.encode(GPS.read());  // Feed to TinyGPS++ parser.
    }

    // // Update globals if valid – checks validity internally.
    if (gps.location.isValid()) {
      gps_lat = gps.location.lat();
      gps_lon = gps.location.lng();
    }

    // // Delay 100ms – fast enough for GPS updates (~1Hz typical).
    vTaskDelay(100 / portTICK_PERIOD_MS);
  }
}

/**************************************************************
 * TASK: displayTask
 * PURPOSE: Show all values on OLED Display
 **************************************************************/
void displayTask(void *pv) {
  for (;;) {
    // // Clear display – efficient full refresh each time.
    display.clearDisplay();
    // // Set text properties – size 1 for fitting more data.
    display.setTextSize(1);
    display.setTextColor(WHITE);

    // // Print sensor data – formatted for readability.
    display.setCursor(0, 0);
    display.printf("Temp: %.1fC\n", temperature_c);  // Temp from DHT.
    display.printf("Crash: %d\n", crash_state);       // Crash state enum.
    display.printf("F:%d G:%d W:%d\n", hazard_fire, hazard_gas, hazard_water);  // Hazards.
    display.printf("G:%.2f T:%.1f\n", g_force, tilt_angle);  // MPU data.
    display.printf("Lat:%.2f\nLon:%.2f", gps_lat, gps_lon);  // GPS coords.

    // // Update screen – efficient SSD1306 buffer transfer.
    display.display();

    // // Delay 300ms – ~3Hz refresh, balances responsiveness and power.
    vTaskDelay(300 / portTICK_PERIOD_MS);
  }
}

/**************************************************************
 * TASK: cloudTask
 * PURPOSE: Upload data to Firebase every 2 seconds
 **************************************************************/
void cloudTask(void *pv) {
  for (;;) {
    // // Check WiFi – reconnect if lost for reliability.
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi lost – reconnecting...");
      WiFi.reconnect();
      vTaskDelay(5000 / portTICK_PERIOD_MS);  // Wait 5s before retry.
      continue;
    }

    // // HTTP client – scoped for efficiency (auto-cleanup).
    HTTPClient http;
    http.begin(FIREBASE_URL);
    http.addHeader("Content-Type", "application/json");

    // // Timestamp – use millis for local time (or NTP if added later).
    unsigned long ts = millis();

    // // Build JSON – String concatenation efficient for small payloads.
    String json = "{";
    json += "\"vehicle_id\":\"VEHICLE_01\",";
    json += "\"timestamp\":" + String(ts) + ",";
    json += "\"online\":true,";

    json += "\"sensors\":{";
    json += "\"temperature\":" + String(temperature_c) + ",";
    json += "\"gforce\":" + String(g_force) + ",";
    json += "\"tilt_angle\":" + String(tilt_angle) + ",";
    json += "\"sound_level\":0,";  // Placeholder – add mic if needed.
    json += "\"fire\":" + String(hazard_fire) + ",";
    json += "\"gas_leak\":" + String(hazard_gas) + ",";
    json += "\"water_detected\":" + String(hazard_water);
    json += "},";

    json += "\"location\":{";
    json += "\"latitude\":" + String(gps_lat, 6) + ",";  // 6 decimals for precision.
    json += "\"longitude\":" + String(gps_lon, 6) + ",";
    json += "\"gps_fix\":" + String(gps_lat != 0.0f && gps_lon != 0.0f ? "true" : "false");
    json += "},";

    json += "\"accident\":{";
    json += "\"detected\":" + String(crash_state == CRASH_CONFIRMED ? "true" : "false") + ",";
    json += "\"severity\":\"SAFE\"";  // TODO: Calculate based on g_force.
    json += "},";

    json += "\"system\":{";
    json += "\"device_status\":\"MONITORING\",";
    json += "\"gps_fix\":" + String(gps_lat != 0.0f && gps_lon != 0.0f ? "true" : "false");
    json += "}";

    json += "}";

    // // Send POST – use POST instead of PUT for push (appends new entry).
    int code = http.POST(json);  // Changed to POST for non-overwriting uploads.
    Serial.printf("Firebase Response: %d\n", code);
    Serial.println(json);

    http.end();  // Close connection – efficient resource release.

    // // Delay 2000ms – 2s interval for cloud updates without flooding.
    vTaskDelay(2000 / portTICK_PERIOD_MS);
  }
}

/**************************************************************
 * FUNCTION: oledPrint
 * PURPOSE : Print two lines on OLED (boot/status)
 **************************************************************/
void oledPrint(const String &line1, const String &line2) {
  // // Clear and print – simple for boot messages.
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);
  display.println(line1);
  display.println(line2);
  display.display();  // Immediate update.
}