/**************************************************************
 * PROJECT: LifeGuardX – Smart Accident & Hazard Detection
 * BOARD  : ESP32-S3 N16R8
 * LCD    : I2C 16x2 (0x27)
 * 
 * ----------------- SENSOR CONNECTIONS ----------------------
 * DHT11 Temperature Sensor
 *   DATA  -> GPIO 7
 *
 * MQ2 Gas Sensor
 *   AO    -> GPIO 5
 *
 * Flame Sensor
 *   DO    -> GPIO 6
 *
 * Water Sensor
 *   DO    -> GPIO 10
 *
 * MPU6050 (I2C Bus 1)
 *   SDA   -> GPIO 8
 *   SCL   -> GPIO 9
 *
 * LCD 16x2 (I2C Bus 0)
 *   SDA   -> GPIO 4
 *   SCL   -> GPIO 3
 *
 * GPS (UART1)
 *   TX -> GPIO 18
 *   RX -> GPIO 17
 *
 * Buzzer -> GPIO 11
 * Button -> GPIO 12
 * LED    -> GPIO 2
 **************************************************************/

#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <HardwareSerial.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <TinyGPSPlus.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

// --------------- PIN DEFINITIONS ----------------
#define PIN_DHT     7
#define PIN_MQ2     5
#define PIN_FLAME   6
#define PIN_WATER  10
#define PIN_BUZZER 11
#define PIN_BUTTON 12
#define PIN_LED     2

#define MPU_SDA     8
#define MPU_SCL     9

#define LCD_SDA     4
#define LCD_SCL     3

// --------------- LCD DISPLAY -------------------
LiquidCrystal_I2C lcd(0x27, 16, 2);
TwoWire WireLCD = TwoWire(0);
TwoWire WireMPU = TwoWire(1);

// --------------- SENSORS ------------------------
DHT dht(PIN_DHT, DHT11);
Adafruit_MPU6050 mpu;

HardwareSerial GPS(1);
TinyGPSPlus gps;

// --------------- WI-FI --------------------------
const char* WIFI_SSID = "ESPTest";
const char* WIFI_PASS = "test1234";

// --------------- FIREBASE URL -------------------
const char* FIREBASE_URL =
  "https://accident-detection-syste-f7f23-default-rtdb.firebaseio.com/accidentState.json";

// --------------- GLOBAL DATA ---------------------
float temperature_c = 0;
float g_force = 0;
float tilt_angle = 0;

bool fire_det = false;
bool gas_det = false;
bool water_det = false;

float gps_lat = 0;
float gps_lon = 0;
bool gps_fix = false;

unsigned long lastUpload = 0;
unsigned long lcdTimer = 0;
int lcdPage = 0;

// ------------------ FUNCTION ---------------------
void printBanner() {
  Serial.println("═══════════════════════════════");
  Serial.println("    RcubiX – LifeGuardX v1.0");
  Serial.println(" ESP32-S3 Accident Detection");
  Serial.println("═══════════════════════════════");
  Serial.printf("CPU: %d MHz | Flash: %d MB | PSRAM: %d MB\n",
                ESP.getCpuFreqMHz(),
                ESP.getFlashChipSize()/1048576,
                ESP.getPsramSize()/1048576);
  Serial.printf("MAC: %s\n", WiFi.macAddress().c_str());
  Serial.println("═══════════════════════════════\n");
}

void setup() {
  Serial.begin(115200);
  delay(500);

  printBanner();

  // PIN setup
  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_BUTTON, INPUT_PULLDOWN);
  pinMode(PIN_FLAME, INPUT);
  pinMode(PIN_WATER, INPUT);

  // LCD Init
  Serial.println("[LCD] Initializing...");
  WireLCD.begin(LCD_SDA, LCD_SCL);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.print("LifeGuardX Boot");

  // MPU Init
  Serial.println("[MPU] Initializing...");
  WireMPU.begin(MPU_SDA, MPU_SCL);
  if (mpu.begin(0x68, &WireMPU))
    Serial.println("[MPU] OK");
  else
    Serial.println("[MPU] ERROR");

  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);

  // DHT
  Serial.println("[DHT] Initializing...");
  dht.begin();

  // GPS
  Serial.println("[GPS] Initializing...");
  GPS.begin(9600, SERIAL_8N1, 18, 17);

  // WiFi
  Serial.print("[WiFi] Connecting");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 20) {
    delay(300);
    Serial.print(".");
    tries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected!");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi] FAILED");
  }

  lcd.clear();
  lcd.print("System Ready");
}

void loop() {

  // ---------------- GPS ---------------------
  while (GPS.available()) gps.encode(GPS.read());
  if (gps.location.isValid()) {
    gps_lat = gps.location.lat();
    gps_lon = gps.location.lng();
    gps_fix = true;
  } else gps_fix = false;

  // ---------------- DHT ---------------------
  float t = dht.readTemperature();
  if (!isnan(t)) temperature_c = t;
  else Serial.println("[DHT] ERROR");

  // ---------------- MPU ---------------------
  sensors_event_t a, g, temp_ev;
  mpu.getEvent(&a, &g, &temp_ev);
  g_force = sqrt(a.acceleration.x*a.acceleration.x +
                 a.acceleration.y*a.acceleration.y +
                 a.acceleration.z*a.acceleration.z) / 9.81;
  tilt_angle = atan2(a.acceleration.y, a.acceleration.z) * 180 / PI;

  // --------------- HAZARDS --------------------
  gas_det   = analogRead(PIN_MQ2) > 500;
  fire_det  = digitalRead(PIN_FLAME);
  water_det = digitalRead(PIN_WATER);

  // ---------------- DEBUG ---------------------
  Serial.println("──────── SENSOR LOG ────────");
  Serial.printf("[TEMP] %.2f°C\n", temperature_c);
  Serial.printf("[GFORCE] %.2fG\n", g_force);
  Serial.printf("[TILT] %.2f°\n", tilt_angle);
  Serial.printf("[FIRE] %d | [GAS] %d | [WATER] %d\n", fire_det, gas_det, water_det);

  if (gps_fix)
    Serial.printf("[GPS] %.6f, %.6f\n", gps_lat, gps_lon);
  else
    Serial.println("[GPS] No Fix");

  Serial.printf("[ONLINE] %s\n", WiFi.status() == WL_CONNECTED ? "YES" : "NO");
  Serial.println("────────────────────────────");

  // ---------------- LCD ROTATION ----------------
  if (millis() - lcdTimer > 1000) {
    lcdTimer = millis();
    lcd.clear();

    if (lcdPage == 0) {
      lcd.print("T:"); lcd.print(temperature_c);
      lcd.setCursor(0,1);
      lcd.print("G:"); lcd.print(g_force);
    }

    else if (lcdPage == 1) {
      lcd.print("Tilt:"); lcd.print(tilt_angle);
      lcd.setCursor(0,1);
      lcd.print("F:"); lcd.print(fire_det);
      lcd.print(" G:"); lcd.print(gas_det);
    }

    else if (lcdPage == 2) {
      if (gps_fix) {
        lcd.print("LAT:"); lcd.print(gps_lat, 2);
        lcd.setCursor(0,1);
        lcd.print("LON:"); lcd.print(gps_lon, 2);
      } else {
        lcd.print("GPS NO FIX");
      }
    }

    lcdPage++;
    if (lcdPage > 2) lcdPage = 0;
  }

  // ---------------- FIREBASE UPDATE ----------------
  if (millis() - lastUpload > 2000) {
    lastUpload = millis();

    bool onlineState = (WiFi.status() == WL_CONNECTED);

    String json = "{";
    json += "\"vehicle_id\":\"VEHICLE_01\",";
    json += "\"online\":" + String(onlineState ? "true" : "false") + ",";
    json += "\"sensors\":{";
    json += "\"temperature\":" + String(temperature_c) + ",";
    json += "\"gforce\":" + String(g_force) + ",";
    json += "\"tilt_angle\":" + String(tilt_angle) + ",";
    json += "\"fire\":" + String(fire_det ? "true" : "false") + ",";
    json += "\"gas_leak\":" + String(gas_det ? "true" : "false") + ",";
    json += "\"water_detected\":" + String(water_det ? "true" : "false");
    json += "},";
    json += "\"location\":{";
    json += "\"latitude\":" + String(gps_lat, 6) + ",";
    json += "\"longitude\":" + String(gps_lon, 6) + ",";
    json += "\"gps_fix\":" + String(gps_fix ? "true" : "false");
    json += "},";
    json += "\"accident\":{";
    json += "\"detected\":false,";
    json += "\"severity\":\"SAFE\"";
    json += "}";
    json += "}";

    if (onlineState) {
      HTTPClient http;
      http.begin(FIREBASE_URL);
      http.addHeader("Content-Type", "application/json");
      int code = http.PUT(json);
      Serial.printf("[UPLOAD] HTTP %d\n", code);
      http.end();
    } else {
      Serial.println("[UPLOAD] SKIPPED — OFFLINE");
    }
  }

  delay(100);
}