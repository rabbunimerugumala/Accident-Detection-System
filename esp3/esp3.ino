/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║               LifeGuardX v3.4 FIXED — ESP32-S3 N16R8 Main Controller        ║
 * ║        Intelligent Accident Detection + Dual ESP32-CAM Evidence System       ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                              ║
 * ║  ── FIXES FROM v3.3 → v3.4 ─────────────────────────────────────────────  ║
 * ║                                                                              ║
 * ║  FIX 1 — DOUBLE NESTING BUG (CRITICAL)                                      ║
 * ║    v3.3: PUT to /accidentState.json with JSON {"accidentState":{...}}        ║
 * ║          → creates /accidentState/accidentState/... in DB (double nested)    ║
 * ║    v3.4: PUT to /accidentState.json with JSON {fields directly}              ║
 * ║          → creates /accidentState/accident, sensors, etc. (correct)          ║
 * ║    CHANGE: Removed doc.createNestedObject("accidentState") wrapper           ║
 * ║            All fields now go directly into doc root                          ║
 * ║                                                                              ║
 * ║  FIX 2 — PUT OVERWRITES EVIDENCE NODE (CRITICAL)                             ║
 * ║    v3.3: http.PUT(payload) every 2s → replaces ALL of /accidentState         ║
 * ║          → cameras write evidence → S3 PUT wipes it 2s later                 ║
 * ║          → evidence node NEVER appears in DB                                 ║
 * ║    v3.4: http.sendRequest("PATCH", payload) → only updates specified fields  ║
 * ║          → evidence node written by cameras is LEFT UNTOUCHED                ║
 * ║    CHANGE: PUT → PATCH in Step 10 Firebase upload                            ║
 * ║                                                                              ║
 * ║  FIX 3 — TILT THRESHOLD ALWAYS TRIGGERED (CRITICAL)                          ║
 * ║    v3.3: abs(tilt_angle) > 45° → at rest = 90° → ALWAYS true                ║
 * ║          → accident fires constantly even when device is perfectly still     ║
 * ║    v3.4: abs(abs(tilt_angle) - TILT_REST) > TILT_THRESHOLD                  ║
 * ║          → measures DEVIATION from 90° rest position                         ║
 * ║          → only triggers when tilt deviates >45° from rest (goes <45°/>135°)║
 * ║    CHANGE: Added TILT_REST = 90.0f constant                                  ║
 * ║            crash_detected uses tilt_deviation instead of raw tilt_angle      ║
 * ║                                                                              ║
 * ║  FIX 4 — CAMERA TRIGGER PULSE 150ms → 500ms                                 ║
 * ║    v3.3: 150ms pulse — camera loop polling at 20Hz can miss it               ║
 * ║    v3.4: 500ms pulse — ISR catches it but wider pulse = extra reliability    ║
 * ║                                                                              ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                              ║
 * ║  ── COMPLETE PIN CONNECTION MAP (ESP32-S3 N16R8) ────────────────────────  ║
 * ║                                                                              ║
 * ║  SENSOR / MODULE          ESP32-S3 PIN   NOTES                              ║
 * ║  ─────────────────────    ────────────   ──────────────────────────────     ║
 * ║  DHT11 DATA               GPIO 40        Temperature & humidity sensor      ║
 * ║  MQ2 ANALOG OUT (AO)      GPIO 5         ADC — >2200 counts = gas leak      ║
 * ║  FLAME SENSOR DO          GPIO 6         Digital — LOW = fire detected      ║
 * ║  WATER SENSOR S           GPIO 10        ADC — >1000 counts = wet           ║
 * ║  BUZZER +                 GPIO 11        HIGH = buzzer ON                   ║
 * ║  RESET BUTTON             GPIO 12        HIGH when pressed (PULLDOWN)       ║
 * ║  LED + (via 220Ω)         GPIO 2         HIGH=SAFE | LOW=ALERT              ║
 * ║  LCD SDA                  GPIO 4         I2C Bus 0                          ║
 * ║  LCD SCL                  GPIO 7         I2C Bus 0                          ║
 * ║  MPU6050 SDA              GPIO 8         I2C Bus 1 (separate from LCD)      ║
 * ║  MPU6050 SCL              GPIO 9         I2C Bus 1 (separate from LCD)      ║
 * ║  GPS TX → ESP32-S3        GPIO 18 (RX)   UART1                              ║
 * ║  GPS RX ← ESP32-S3        GPIO 17 (TX)   UART1                              ║
 * ║  CAM1 GPIO13 ← S3         GPIO 16        LOW 500ms pulse = capture          ║
 * ║  CAM2 GPIO13 ← S3         GPIO 15        LOW 500ms pulse = capture          ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <HardwareSerial.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <TinyGPSPlus.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

// ============================================================
//  SECTION 1: PIN DEFINITIONS (UNCHANGED)
// ============================================================

#define PIN_DHT    40
#define PIN_MQ2     5
#define PIN_FLAME   6
#define PIN_WATER  10
#define PIN_BUZZER 11
#define PIN_BUTTON 12
#define PIN_LED     2

#define LCD_SDA 4
#define LCD_SCL 7
#define MPU_SDA 8
#define MPU_SCL 9

#define PIN_CAM1 16  // Trigger output → ESP32-CAM #1 GPIO13 (Road Scene)
#define PIN_CAM2 15  // Trigger output → ESP32-CAM #2 GPIO13 (Driver Condition)

// ============================================================
//  SECTION 2: HARDWARE OBJECTS (UNCHANGED)
// ============================================================

LiquidCrystal_I2C lcd(0x27, 16, 2);
TwoWire WireMPU = TwoWire(1);
DHT dht(PIN_DHT, DHT11);
Adafruit_MPU6050 mpu;
HardwareSerial GPS(1);
TinyGPSPlus gps;

// ============================================================
//  SECTION 3: WiFi & Firebase CONFIGURATION
// ============================================================

// ── WiFi CONFIGURATION (DO NOT HARDCODE) ─────────────────────
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASS "YOUR_WIFI_PASS"

// ── FIREBASE URLs ────────────────────────────────────────────
// FIREBASE_URL  → main sensor data node (PATCH safe — won't wipe evidence)
// FIREBASE_EVIDENCE_URL → reset by resetEvidenceNode() before each accident
const char* FIREBASE_URL =
  "https://accident-detection-syste-f7f23-default-rtdb.firebaseio.com/accidentState.json";
const char* FIREBASE_EVIDENCE_URL =
  "https://accident-detection-syste-f7f23-default-rtdb.firebaseio.com/accidentState/evidence.json";

// ============================================================
//  SECTION 4: SENSOR THRESHOLDS
// ============================================================

const float G_THRESHOLD    = 2.5f;   // G-force to flag accident
const float TILT_THRESHOLD = 45.0f;  // Degrees deviation from rest to flag accident

// ── FIX 3: TILT REST POSITION ────────────────────────────────
// User's device rests flat at 0°.
// tilt_deviation = abs(abs(tilt_angle) - TILT_REST)
// Accident triggers when device deviates >45° FROM 0° rest
// Safe range: -45° to 45°
// Accident: tilt < -45° OR tilt > 45°
const float TILT_REST      = 0.0f;  // ← YOUR DEVICE'S RESTING TILT ANGLE

const float CRITICAL_G     = 5.0f;
const int   MQ2_THRESHOLD  = 2200;
const int   WATER_THRESHOLD = 1000;

// ============================================================
//  SECTION 5: TIMING CONSTANTS (UNCHANGED)
// ============================================================

const unsigned long UPLOAD_INTERVAL        = 2000;
const unsigned long LCD_INTERVAL           = 1500;
const unsigned long ACCIDENT_TIMEOUT       = 30000;
const unsigned long SENSOR_DEBUG_INTERVAL  = 5000;
const unsigned long BUTTON_LATCH_DURATION  = 12000;

// ============================================================
//  SECTION 6: GLOBAL STATE (UNCHANGED)
// ============================================================

float temperature_c = 0.0f;
float g_force       = 1.0f;
float tilt_angle    = 0.0f;
float tilt_deviation = 0.0f;  // ← NEW: deviation from TILT_REST — used for accident check

bool fire_det  = false;
bool gas_det   = false;
bool water_det = false;

float gps_lat       = 0.0f;
float gps_lon       = 0.0f;
bool  gps_fix       = false;
int   gps_satellites = 0;

bool   accident_detected  = false;
String accident_severity  = "SAFE";
unsigned long accident_time = 0;

bool  button_raw        = false;
bool  button_latch      = false;
unsigned long button_latch_time = 0;

unsigned long lastUpload      = 0;
unsigned long lcdTimer        = 0;
unsigned long sensorDebugTimer = 0;
int lcdPage = 0;

bool   cameras_triggered   = false;
String current_accident_id = "";

// ============================================================
//  SECTION 7: UTILITY FUNCTIONS (UNCHANGED)
// ============================================================

void printDashes(int count = 60) {
  for (int i = 0; i < count; i++) Serial.print("─");
  Serial.println();
}

void printBanner() {
  Serial.println("\n═══════════════════════════════════════════════════════════════");
  Serial.println("                  🚨 LifeGuardX v3.4 FIXED                     ");
  Serial.println("═══════════════════════════════════════════════════════════════");
  Serial.printf("🖥️  CPU: %dMHz | 💾 Flash: %dMB | 🧠 PSRAM: %dMB\n",
                ESP.getCpuFreqMHz(),
                ESP.getFlashChipSize() / (1024 * 1024),
                ESP.getPsramSize()     / (1024 * 1024));
  Serial.printf("📶 WiFi MAC: %s\n", WiFi.macAddress().c_str());
  Serial.println("FIXES: [1]No double-nest [2]PATCH not PUT [3]Tilt from 90° rest [4]500ms pulse");
  Serial.println("═══════════════════════════════════════════════════════════════\n");
}

void printSensorDebug() {
  int mq2_raw   = analogRead(PIN_MQ2);
  int water_raw = analogRead(PIN_WATER);
  int flame_raw = digitalRead(PIN_FLAME);

  Serial.println("\n═══════ LifeGuardX v3.4 — 5s SENSOR DEBUG ═══════");
  Serial.printf("🔍 RAW SENSORS:\n");
  Serial.printf("  🏭 MQ2=%4d  → %s (threshold:%d)\n",
                mq2_raw, mq2_raw > MQ2_THRESHOLD ? "🚨LEAK" : "✅OK", MQ2_THRESHOLD);
  Serial.printf("  🔥 Flame=%d   → %s (LOW=fire detected)\n",
                flame_raw, flame_raw == LOW ? "🚨FIRE" : "✅OK");
  Serial.printf("  💧 Water=%4d → %s (>%d=wet)\n",
                water_raw, water_raw > WATER_THRESHOLD ? "🚨WET" : "✅DRY", WATER_THRESHOLD);
  Serial.printf("📊 CORE SENSORS:\n");
  Serial.printf("  🌡️  Temp      = %.1f °C\n",  temperature_c);
  Serial.printf("  ⚖️  G-Force   = %.2f g\n",   g_force);
  Serial.printf("  ↕️  Tilt      = %.1f °\n",   tilt_angle);
  Serial.printf("  📐 TiltDev   = %.1f ° (from %.0f° rest) threshold=%.0f°\n",
                tilt_deviation, TILT_REST, TILT_THRESHOLD);  // ← shows deviation for debugging
  Serial.printf("🛰️  GPS: Fix=%s | Satellites=%d\n",
                gps_fix ? "YES" : "NO", gps_satellites);
  Serial.printf("📷 CAM: Triggered=%s | ID=%s\n",
                cameras_triggered ? "YES" : "NO",
                current_accident_id.length() > 0 ? current_accident_id.c_str() : "none");
  Serial.printf("🔔 OUTPUTS: LED=%s | Buzzer=%s | BtnRaw=%s | BtnLatch=%s (%lus/%lus)\n",
                digitalRead(PIN_LED)    == HIGH ? "🟢HIGH(SAFE)" : "🔴LOW(ALERT)",
                digitalRead(PIN_BUZZER) == HIGH ? "ON" : "OFF",
                button_raw   ? "🔘PRESSED" : "RELEASED",
                button_latch ? "🔒TRUE"    : "false",
                button_latch ? (millis() - button_latch_time) / 1000 : 0UL,
                BUTTON_LATCH_DURATION / 1000);
  Serial.printf("🚨 STATUS: Fire=%s | Gas=%s | Water=%s | Accident=%s\n",
                fire_det        ? "🚨YES" : "✅NO",
                gas_det         ? "🚨YES" : "✅NO",
                water_det       ? "🚨YES" : "✅NO",
                accident_detected ? accident_severity.c_str() : "✅SAFE");
  Serial.println("═══════════════════════════════════════════════════════════\n");
}

// ============================================================
//  SECTION 7B: ESP32-CAM CONTROL FUNCTIONS
// ============================================================

void setupCameraTriggers() {
  pinMode(PIN_CAM1, OUTPUT);
  pinMode(PIN_CAM2, OUTPUT);
  digitalWrite(PIN_CAM1, HIGH);  // Idle HIGH — cameras wait for LOW pulse
  digitalWrite(PIN_CAM2, HIGH);
  Serial.println("📷 [CAM] Trigger pins ready — CAM1:GPIO16 | CAM2:GPIO15 (idle HIGH)");
}

void resetEvidenceNode() {
  if (WiFi.status() != WL_CONNECTED) return;

  current_accident_id = "ACC_" + String(millis() / 1000);

  // Reset evidence node — cameras will write cam1_url, cam2_url etc. after this
  // Using PUT here is correct — we WANT to wipe old evidence for new accident
  String payload = "{"
    "\"cam1_url\":\"\","
    "\"cam1_label\":\"Road Scene\","
    "\"cam1_ready\":false,"
    "\"cam2_url\":\"\","
    "\"cam2_label\":\"Driver Condition\","
    "\"cam2_ready\":false,"
    "\"captured_at\":0,"
    "\"accident_id\":\"" + current_accident_id + "\""
  "}";

  HTTPClient http;
  http.begin(FIREBASE_EVIDENCE_URL);
  http.addHeader("Content-Type", "application/json");
  int code = http.PUT(payload);  // PUT is correct here — intentionally clears old photos
  http.end();

  Serial.printf("📷 [CAM] Evidence reset — AccidentID:%s | HTTP:%d\n",
                current_accident_id.c_str(), code);
}

/*
 * triggerCameras() — FIX 4: Pulse width 150ms → 500ms
 * ─────────────────────────────────────────────────────
 * 500ms gives camera ISR a wider window to detect pulse
 * even if camera is briefly busy in another operation
 */
void triggerCameras() {
  Serial.println("📷 [CAM] Accident — triggering both cameras...");

  resetEvidenceNode();
  delay(300);  // Wait for Firebase write before cameras start polling

  // CAM1 — Road Scene (GPIO16) — 500ms pulse
  Serial.println("📷 [CAM1] GPIO16 LOW 500ms → Road Scene camera");
  digitalWrite(PIN_CAM1, LOW);
  delay(500);                   // ← FIXED: 500ms (was 150ms)
  digitalWrite(PIN_CAM1, HIGH);
  Serial.println("📷 [CAM1] Triggered ✅ — Road Scene capturing...");

  delay(500);  // Gap between cameras — prevents WiFi collision

  // CAM2 — Driver Condition (GPIO15) — 500ms pulse
  Serial.println("📷 [CAM2] GPIO15 LOW 500ms → Driver camera");
  digitalWrite(PIN_CAM2, LOW);
  delay(500);                   // ← FIXED: 500ms (was 150ms)
  digitalWrite(PIN_CAM2, HIGH);
  Serial.println("📷 [CAM2] Triggered ✅ — Driver capturing...");

  cameras_triggered = true;
  Serial.println("📷 [CAM] Both cameras triggered — photos uploading → Firebase DB");
}

// ============================================================
//  SECTION 8: SETUP (UNCHANGED STRUCTURE)
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(2000);
  printBanner();

  pinMode(PIN_LED,    OUTPUT);   digitalWrite(PIN_LED,    HIGH);
  pinMode(PIN_BUZZER, OUTPUT);   digitalWrite(PIN_BUZZER, LOW);
  pinMode(PIN_BUTTON, INPUT_PULLDOWN);
  pinMode(PIN_FLAME,  INPUT);
  pinMode(PIN_WATER,  INPUT);

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  Serial.println("🔌 [PINS] OK");

  setupCameraTriggers();

  Wire.begin(LCD_SDA, LCD_SCL);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("LifeGuardX v3.4");
  lcd.setCursor(0, 1); lcd.print("Initializing...");
  Serial.println("📺 [LCD] Ready");

  dht.begin();
  Serial.println("🌡️ [DHT11] Ready");

  WireMPU.begin(MPU_SDA, MPU_SCL);
  delay(100);
  WireMPU.beginTransmission(0x68);
  WireMPU.write(0x6B);
  WireMPU.write(0x00);
  WireMPU.endTransmission(true);
  delay(200);

  if (!mpu.begin(0x68, &WireMPU)) {
    Serial.println("❌ [MPU6050] FAILED!");
    lcd.clear(); lcd.print("MPU ERROR!");
    while (1) { digitalWrite(PIN_LED, !digitalRead(PIN_LED)); delay(500); }
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  Serial.println("⚖️ [MPU6050] Ready");

  GPS.begin(9600, SERIAL_8N1, 18, 17);
  Serial.println("🛰️ [GPS] Ready");

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("📶 [WIFI] Connecting");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500); Serial.print("."); attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n📶 [WIFI] ✅ IP: %s\n", WiFi.localIP().toString().c_str());
    lcd.clear(); lcd.print("WiFi Connected!");
    lcd.setCursor(0, 1); lcd.print(WiFi.localIP().toString().substring(0, 13));
    delay(3000);
  } else {
    Serial.println("\n📶 [WIFI] ❌ OFFLINE");
    lcd.clear(); lcd.print("WiFi OFFLINE");
    lcd.setCursor(0, 1); lcd.print("Sensors OK");
    delay(3000);
  }

  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("LifeGuardX v3.4");
  lcd.setCursor(0, 1); lcd.print("System Ready!");
  Serial.println("\n✅ [SYSTEM READY] All fixes applied — main loop starting\n");
  delay(1000);
}

// ============================================================
//  SECTION 9: MAIN LOOP
// ============================================================
void loop() {

  // ── STEP 1: GPS ──────────────────────────────────────────
  while (GPS.available() > 0) gps.encode(GPS.read());
  gps_fix = gps.location.isValid();
  if (gps_fix) {
    gps_lat        = gps.location.lat();
    gps_lon        = gps.location.lng();
    gps_satellites = gps.satellites.value();
  } else {
    gps_lat = gps_lon = 0.0f;
    gps_satellites = 0;
  }

  // ── STEP 2: TEMPERATURE ──────────────────────────────────
  float temp_reading = dht.readTemperature();
  if (!isnan(temp_reading)) temperature_c = temp_reading;

  // ── STEP 3: MPU6050 ──────────────────────────────────────
  sensors_event_t accel, gyro, temp_mpu;
  mpu.getEvent(&accel, &gyro, &temp_mpu);

  g_force = sqrt(
    accel.acceleration.x * accel.acceleration.x +
    accel.acceleration.y * accel.acceleration.y +
    accel.acceleration.z * accel.acceleration.z
  ) / 9.81f;

  tilt_angle = roundf(atan2f(accel.acceleration.y, accel.acceleration.z) * 180.0f / PI);

  // ── FIX 3: TILT DEVIATION FROM REST POSITION ─────────────
  // User's device rests flat at 0°.
  // tilt_deviation = how far current tilt is from the 90° resting position
  // Safe zone: TILT_REST ± TILT_THRESHOLD  →  45° to 135°
  // Crash zone: tilt goes below 45° (forward fall) or above 135° (backward)
  tilt_deviation = abs(abs(tilt_angle) - TILT_REST);

  // ── STEP 4: HAZARD SENSORS ───────────────────────────────
  gas_det   = (analogRead(PIN_MQ2)   > MQ2_THRESHOLD);
  fire_det  = !digitalRead(PIN_FLAME);
  water_det = (analogRead(PIN_WATER) > WATER_THRESHOLD);

  // ── STEP 5: BUTTON LATCH ─────────────────────────────────
  button_raw = (digitalRead(PIN_BUTTON) == HIGH);
  if (button_raw && !button_latch) {
    button_latch      = true;
    button_latch_time = millis();
    Serial.println("🔘 [BUTTON] Press detected → Latch ON");
  }
  if (button_latch && (millis() - button_latch_time >= BUTTON_LATCH_DURATION)) {
    button_latch = false;
    Serial.println("🔘 [BUTTON] 12s expired → Latch OFF");
  }

  // ── STEP 6: ACCIDENT DETECTION ───────────────────────────
  // ── FIX 3 APPLIED: use tilt_deviation not raw tilt_angle ──
  // NEW (fixed):  tilt_deviation > TILT_THRESHOLD
  //               deviation from 0° rest > 45° → only real crashes
  
  // ── ANTI-BOUNCE PROTECTION ───────────────────────────────
  // Because the sensor is mounted on a pad and "moves some", 
  // temporary wobbles are ignored. Tilt must be sustained for 1000ms.
  static unsigned long tilt_start_time = 0;
  bool sustained_tilt = false;
  
  if (tilt_deviation > TILT_THRESHOLD) {
    if (tilt_start_time == 0) tilt_start_time = millis();
    if (millis() - tilt_start_time > 1000) { // Sustained for 1 full second
      sustained_tilt = true;
    }
  } else {
    tilt_start_time = 0; // Reset if it goes back to safe angle
  }

  bool crash_detected = (g_force > G_THRESHOLD || sustained_tilt);

  if (crash_detected && !accident_detected) {
    accident_detected = true;
    accident_time     = millis();
    accident_severity = (g_force > CRITICAL_G) ? "CRITICAL" : "MODERATE";
    Serial.printf("🚨🚨🚨 [ACCIDENT] %s | G=%.2fg | Tilt=%.1f° | Dev=%.1f°\n",
                  accident_severity.c_str(), g_force, tilt_angle, tilt_deviation);

    if (!cameras_triggered) {
      triggerCameras();  // resetEvidence + 500ms pulse to CAM1 + CAM2
    }
  }

  // Clear accident on button or 30s timeout
  if (accident_detected && (millis() - accident_time > ACCIDENT_TIMEOUT || button_raw)) {
    accident_detected   = false;
    accident_severity   = "SAFE";
    cameras_triggered   = false;   // Allow cameras to fire on next accident
    current_accident_id = "";
    
    // ── FIX: RESET CAMERA PINS TO IDLE (HIGH) ──────────────
    // If we don't do this, the pins might float or stay LOW, 
    // causing the ESP-CAM to infinitely trigger.
    digitalWrite(PIN_CAM1, HIGH);
    digitalWrite(PIN_CAM2, HIGH);
    
    Serial.printf("✅ [ACCIDENT CLEARED] Reason: %s\n",
                  button_raw ? "BUTTON PRESS" : "30s AUTO-TIMEOUT");
  }

  // ── STEP 7: LED + BUZZER ─────────────────────────────────
  bool any_hazard = accident_detected || fire_det || gas_det || water_det;
  digitalWrite(PIN_BUZZER, any_hazard ? HIGH : LOW);
  digitalWrite(PIN_LED,    any_hazard ? HIGH : LOW);

  // ── STEP 8: LCD ──────────────────────────────────────────
  if (millis() - lcdTimer > LCD_INTERVAL) {
    lcdTimer = millis();
    lcd.clear();

    if (any_hazard) {
      lcd.setCursor(0, 0); lcd.print("*** EMERGENCY ***");
      lcd.setCursor(0, 1);
      if      (accident_detected) lcd.print(accident_severity.substring(0, 8));
      else if (fire_det)          lcd.print("FIRE DETECTED!");
      else if (gas_det)           lcd.print("GAS LEAK!");
      else                        lcd.print("WATER ALERT!");
    } else {
      switch (lcdPage) {
        case 0:
          lcd.setCursor(0, 0); lcd.printf("Temp: %.1f C",  temperature_c);
          lcd.setCursor(0, 1); lcd.printf("G-Force: %.2fg", g_force);
          break;
        case 1:
          lcd.setCursor(0, 0); lcd.print("Tilt / Deviation:");
          lcd.setCursor(0, 1); lcd.printf("%.0fdeg Dev:%.0f", tilt_angle, tilt_deviation);
          break;
        case 2:
          lcd.setCursor(0, 0); lcd.print(gps_fix ? "GPS: FIXED" : "GPS: SEARCHING");
          lcd.setCursor(0, 1);
          if (gps_fix) lcd.printf("Sats: %2d", gps_satellites);
          else         lcd.print("Waiting...");
          break;
      }
      lcdPage = (lcdPage + 1) % 3;
    }
  }

  // ── STEP 9: SERIAL DEBUG ─────────────────────────────────
  if (millis() - sensorDebugTimer > SENSOR_DEBUG_INTERVAL) {
    printSensorDebug();
    sensorDebugTimer = millis();
  }

  // ── STEP 10: FIREBASE UPLOAD (every 2s) ──────────────────
  // ── FIX 1: JSON root = doc (no "accidentState" wrapper) ──
  // ── FIX 2: PATCH not PUT — leaves evidence node untouched ─
  //
  // FIX 1 EXPLANATION:
  //   FIREBASE_URL = ".../accidentState.json"  (already points to accidentState node)
  //   OLD code: doc.createNestedObject("accidentState") → JSON = {"accidentState":{...}}
  //             Firebase writes at accidentState/accidentState/... (DOUBLE NESTED!)
  //   NEW code: fields go directly into doc → JSON = {"accident":{...}, "sensors":{...}}
  //             Firebase writes at accidentState/accident, accidentState/sensors (CORRECT!)
  //
  // FIX 2 EXPLANATION:
  //   PUT = REPLACE entire node → cameras write evidence → 2s later PUT wipes it
  //   PATCH = UPDATE only specified fields → evidence node written by cameras is UNTOUCHED
  //   http.sendRequest("PATCH", payload) sends PATCH method to Firebase REST API

  if (millis() - lastUpload > UPLOAD_INTERVAL && WiFi.status() == WL_CONNECTED) {
    lastUpload = millis();

    DynamicJsonDocument doc(4096);
    // ── FIX 1: NO wrapper — fields go directly into doc ──────
    // Old: JsonObject accidentState = doc.createNestedObject("accidentState"); ← REMOVED
    // New: use doc["field"] directly

    JsonObject accident = doc.createNestedObject("accident");
    accident["detected"] = accident_detected;
    accident["severity"] = accident_severity.c_str();

    JsonObject location = doc.createNestedObject("location");
    location["gps_fix"]   = gps_fix;
    location["latitude"]  = gps_lat;
    location["longitude"] = gps_lon;

    doc["online"] = true;

    JsonObject sensors = doc.createNestedObject("sensors");
    sensors["fire"]          = fire_det;
    sensors["gas_leak"]      = gas_det;
    sensors["gforce"]        = roundf(g_force        * 10) / 10.0f;
    sensors["temperature"]   = roundf(temperature_c  * 10) / 10.0f;
    sensors["tilt_angle"]    = roundf(tilt_angle     * 10) / 10.0f;
    sensors["tilt_deviation"]= roundf(tilt_deviation * 10) / 10.0f;  // ← extra field for dashboard
    sensors["water_detected"]= water_det;

    doc["button_pressed"] = button_latch;  // What UI sees (12s latch)
    doc["button_raw"]     = button_raw;    // Live physical state

    JsonObject system = doc.createNestedObject("system");
    system["device_status"] = "ONLINE";
    system["gps_fix"]       = gps_fix;

    doc["timestamp"]  = millis() / 1000;
    doc["vehicle_id"] = "VEHICLE_01";

    // ── evidence node intentionally NOT included here ────────
    // Cameras write directly to accidentState/evidence/
    // PATCH preserves it — evidence stays until next accident reset

    String jsonPayload;
    serializeJsonPretty(doc, jsonPayload);

    HTTPClient http;
    http.begin(FIREBASE_URL);
    http.addHeader("Content-Type", "application/json");

    // ── FIX 2: PATCH not PUT ──────────────────────────────────
    // sendRequest("PATCH", ...) → only updates fields in this JSON
    // Does NOT delete evidence node or any other sibling nodes
    int httpCode = http.sendRequest("PATCH", jsonPayload);

    Serial.printf("📤 Firebase PATCH: HTTP %d | %d bytes | BtnRaw:%s | BtnLatch:%s | LatchAge:%lus\n",
                  httpCode,
                  jsonPayload.length(),
                  button_raw   ? "PRESSED" : "IDLE",
                  button_latch ? "TRUE(12s)" : "false",
                  button_latch ? (millis() - button_latch_time) / 1000 : 0UL);
    http.end();

    printDashes(50);
  }

  delay(100);  // ~10Hz loop
}
