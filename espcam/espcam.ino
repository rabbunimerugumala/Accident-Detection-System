// ============================================================
//  LifeGuardX — ESP32-CAM v1.9 FIXED
//  ImgBB Upload → Firebase Realtime DB
//
//  FIXES IN v1.9
//  • ImgBB upload now uses WiFiClientSecure + HTTPClient.begin(client, url)
//  • client.setInsecure() added for HTTPS stability/testing
//  • Better timeout handling for slow networks
//  • Added heap / RSSI / payload debug logs
//  • Safer String reserve() usage to reduce fragmentation
//  • Better error messages using http.errorToString()
//  • Slightly smaller image size for more reliable upload
// ============================================================

#include "esp_camera.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// ── CHANGE THESE 2 LINES PER CAMERA ──────────────────────
#define CAM_ID    "cam1"           // "cam1" or "cam2"
#define CAM_LABEL "Road Scene"     // "Road Scene" or "Driver Condition"
// ─────────────────────────────────────────────────────────

// ── AUTO TEST — uncomment ONLY when testing without ESP32-S3
// #define AUTO_TEST_DELAY 15000
// ─────────────────────────────────────────────────────────

const char* WIFI_SSID  = "Rabbuni";
const char* WIFI_PASS  = "Rabbuni123";
const char* PROJECT_ID = "accident-detection-syste-f7f23";
const char* IMGBB_KEY  = "1389cd2403a9ec9cd49d5e9bbce84944";

// ── AI-Thinker pin map — DO NOT CHANGE ───────────────────
#define PWDN_GPIO_NUM  32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM   0
#define SIOD_GPIO_NUM  26
#define SIOC_GPIO_NUM  27
#define Y9_GPIO_NUM    35
#define Y8_GPIO_NUM    34
#define Y7_GPIO_NUM    39
#define Y6_GPIO_NUM    36
#define Y5_GPIO_NUM    21
#define Y4_GPIO_NUM    19
#define Y3_GPIO_NUM    18
#define Y2_GPIO_NUM     5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM  23
#define PCLK_GPIO_NUM  22

// ── CONTROL PINS ─────────────────────────────────────────
#define TRIGGER_PIN  13
#define IO0_PIN       0
#define FLASH_PIN     4

// ── STATE FLAGS ───────────────────────────────────────────
bool camReady  = false;
bool wifiReady = false;

// ── INTERRUPT TRIGGER FLAG ────────────────────────────────
volatile bool triggerFlag = false;

// ── NON-BLOCKING LOCKOUT ──────────────────────────────────
const unsigned long LOCKOUT_MS = 5000;
unsigned long lastCaptureTime  = 0;

void IRAM_ATTR onTrigger() {
  triggerFlag = true;
}

// ============================================================
//  BASE64 ENCODER
// ============================================================
static const char b64chars[] =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

String base64Encode(const uint8_t* data, size_t len) {
  size_t outLen = ((len + 2) / 3) * 4;
  String result;
  result.reserve(outLen + 4);

  for (size_t i = 0; i < len; i += 3) {
    uint8_t b0 = data[i];
    uint8_t b1 = (i + 1 < len) ? data[i + 1] : 0;
    uint8_t b2 = (i + 2 < len) ? data[i + 2] : 0;

    result += b64chars[(b0 >> 2)];
    result += b64chars[((b0 & 0x03) << 4) | (b1 >> 4)];
    result += (i + 1 < len) ? b64chars[((b1 & 0x0F) << 2) | (b2 >> 6)] : '=';
    result += (i + 2 < len) ? b64chars[b2 & 0x3F] : '=';
  }
  return result;
}

// ============================================================
//  CAMERA INIT
// ============================================================
bool initCamera() {
  Serial.println("📷 Initializing camera...");

  camera_config_t cfg;
  cfg.ledc_channel = LEDC_CHANNEL_0;
  cfg.ledc_timer   = LEDC_TIMER_0;
  cfg.pin_d0       = Y2_GPIO_NUM;
  cfg.pin_d1       = Y3_GPIO_NUM;
  cfg.pin_d2       = Y4_GPIO_NUM;
  cfg.pin_d3       = Y5_GPIO_NUM;
  cfg.pin_d4       = Y6_GPIO_NUM;
  cfg.pin_d5       = Y7_GPIO_NUM;
  cfg.pin_d6       = Y8_GPIO_NUM;
  cfg.pin_d7       = Y9_GPIO_NUM;
  cfg.pin_xclk     = XCLK_GPIO_NUM;
  cfg.pin_pclk     = PCLK_GPIO_NUM;
  cfg.pin_vsync    = VSYNC_GPIO_NUM;
  cfg.pin_href     = HREF_GPIO_NUM;
  cfg.pin_sscb_sda = SIOD_GPIO_NUM;
  cfg.pin_sscb_scl = SIOC_GPIO_NUM;
  cfg.pin_pwdn     = PWDN_GPIO_NUM;
  cfg.pin_reset    = RESET_GPIO_NUM;
  cfg.xclk_freq_hz = 20000000;
  cfg.pixel_format = PIXFORMAT_JPEG;

  // Smaller / safer upload settings
  cfg.frame_size   = FRAMESIZE_CIF;   // smaller than before for reliability
  cfg.jpeg_quality = 15;              // smaller payload, still usable
  cfg.fb_count     = 1;

  esp_err_t err = esp_camera_init(&cfg);
  if (err != ESP_OK) {
    Serial.printf("❌ Camera FAILED: 0x%x\n", err);
    return false;
  }

  sensor_t* s = esp_camera_sensor_get();
  s->set_brightness(s, 1);
  s->set_contrast(s, 1);
  s->set_saturation(s, 0);
  s->set_whitebal(s, 1);
  s->set_awb_gain(s, 1);
  s->set_exposure_ctrl(s, 1);
  s->set_aec2(s, 1);
  s->set_gain_ctrl(s, 1);
  s->set_agc_gain(s, 0);
  s->set_gainceiling(s, (gainceiling_t)2);
  s->set_bpc(s, 1);
  s->set_wpc(s, 1);
  s->set_raw_gma(s, 1);
  s->set_lenc(s, 1);
  s->set_hmirror(s, 0);
  s->set_vflip(s, 0);

  Serial.println("   Warming up (discarding 5 frames)...");
  for (int i = 0; i < 5; i++) {
    camera_fb_t* f = esp_camera_fb_get();
    if (f) esp_camera_fb_return(f);
    delay(200);
    Serial.printf("   Discarded frame %d\n", i + 1);
  }

  Serial.println("✅ Camera ready");
  return true;
}

// ============================================================
//  WiFi CONNECT
// ============================================================
bool connectWiFi() {
  Serial.printf("📶 Connecting to [%s]...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int t = 0;
  while (WiFi.status() != WL_CONNECTED && t < 40) {
    delay(500);
    Serial.print(".");
    t++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("✅ WiFi OK — IP: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("   RSSI: %d dBm\n\n", WiFi.RSSI());
    return true;
  }

  Serial.println("❌ WiFi FAILED\n");
  return false;
}

// ============================================================
//  CAPTURE GOOD FRAME
// ============================================================
camera_fb_t* captureGoodFrame() {
  const int MIN_SIZE  = 2000;
  const int MAX_TRIES = 5;

  for (int attempt = 1; attempt <= MAX_TRIES; attempt++) {
    for (int d = 0; d < 2; d++) {
      camera_fb_t* stale = esp_camera_fb_get();
      if (stale) esp_camera_fb_return(stale);
      delay(150);
    }

    digitalWrite(FLASH_PIN, HIGH);
    delay(300);
    camera_fb_t* fb = esp_camera_fb_get();
    digitalWrite(FLASH_PIN, LOW);

    if (!fb) {
      Serial.printf("   Attempt %d: null — retrying\n", attempt);
      delay(300);
      continue;
    }

    Serial.printf("   Attempt %d: %d bytes", attempt, fb->len);

    if (fb->len >= MIN_SIZE) {
      Serial.println(" ✅ Accepted!");
      return fb;
    }

    Serial.println(" ⚠️  Too small — discarding");
    esp_camera_fb_return(fb);
    delay(400);
  }

  Serial.println("❌ All capture attempts failed");
  return nullptr;
}

// ============================================================
//  UPLOAD TO IMGBB
//  Uses WiFiClientSecure for HTTPS
// ============================================================
String uploadToImgBB(const uint8_t* imgData, size_t imgLen) {
  Serial.printf("   Encoding %d bytes...\n", imgLen);

  String b64 = base64Encode(imgData, imgLen);
  Serial.printf("   Base64: %d chars\n", b64.length());

  b64.replace("+", "%2B");
  b64.replace("/", "%2F");
  b64.replace("=", "%3D");

  String postBody;
  postBody.reserve(b64.length() + 64);
  postBody = "key=";
  postBody += IMGBB_KEY;
  postBody += "&image=";
  postBody += b64;

  Serial.println("   Posting to ImgBB...");
  Serial.printf("   WiFi RSSI: %d dBm\n", WiFi.RSSI());
  Serial.printf("   Free heap: %u bytes\n", ESP.getFreeHeap());
  Serial.printf("   POST body: %d chars\n", postBody.length());

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ ImgBB FAILED: WiFi not connected");
    return "";
  }

  WiFiClientSecure client;
  client.setInsecure();   // good for testing; avoids cert validation issues
  client.setTimeout(60000);

  HTTPClient http;
  http.setTimeout(60000);
  http.setConnectTimeout(15000);
  http.setReuse(false);

  bool begun = http.begin(client, "https://api.imgbb.com/1/upload");
  if (!begun) {
    Serial.println("❌ ImgBB FAILED: http.begin() failed");
    return "";
  }

  http.addHeader("Content-Type", "application/x-www-form-urlencoded");
  http.addHeader("Connection", "close");
  http.addHeader("User-Agent", "ESP32-CAM");

  int code = http.POST(postBody);
  Serial.printf("   ImgBB HTTP: %d\n", code);

  if (code < 0) {
    Serial.printf("❌ ImgBB FAILED: %s\n", http.errorToString(code).c_str());
    http.end();
    return "";
  }

  String response = http.getString();
  Serial.printf("   Response length: %d chars\n", response.length());

  if (code != 200) {
    Serial.println("❌ ImgBB FAILED: " + response.substring(0, 300));
    http.end();
    return "";
  }

  http.end();

  int idx = response.indexOf("\"url\":\"");
  if (idx == -1) {
    Serial.println("❌ URL not found in ImgBB response");
    Serial.println("   Raw: " + response.substring(0, 300));
    return "";
  }

  idx += 7;
  int endIdx = response.indexOf("\"", idx);
  String url = response.substring(idx, endIdx);
  url.replace("\\/", "/");

  Serial.println("✅ ImgBB URL: " + url);
  return url;
}

// ============================================================
//  SAVE TO FIREBASE REALTIME DB
// ============================================================
void saveToDatabase(String photoURL) {
  Serial.println("💾 Saving to Firebase...");

  String base = "https://" + String(PROJECT_ID) +
                "-default-rtdb.firebaseio.com/accidentState/evidence/";

  HTTPClient http;
  WiFiClientSecure client;
  client.setInsecure();

  int r = 0;

  http.begin(client, base + String(CAM_ID) + "_url.json");
  http.addHeader("Content-Type", "application/json");
  r = http.PUT("\"" + photoURL + "\"");
  Serial.printf("   %s_url     → %d\n", CAM_ID, r);
  http.end();

  http.begin(client, base + String(CAM_ID) + "_label.json");
  http.addHeader("Content-Type", "application/json");
  r = http.PUT("\"" + String(CAM_LABEL) + "\"");
  Serial.printf("   %s_label   → %d\n", CAM_ID, r);
  http.end();

  http.begin(client, base + String(CAM_ID) + "_ready.json");
  http.addHeader("Content-Type", "application/json");
  r = http.PUT("true");
  Serial.printf("   %s_ready   → %d\n", CAM_ID, r);
  http.end();

  http.begin(client, base + "captured_at.json");
  http.addHeader("Content-Type", "application/json");
  r = http.PUT(String(millis() / 1000));
  Serial.printf("   captured_at → %d\n", r);
  http.end();

  if (r == 200) {
    Serial.println("✅ Firebase saved — photo live on dashboard!");
    for (int i = 0; i < 5; i++) {
      digitalWrite(FLASH_PIN, HIGH); delay(80);
      digitalWrite(FLASH_PIN, LOW);  delay(80);
    }
  } else {
    Serial.println("❌ Firebase failed — check DB rules / HTTPS / URL");
  }

  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// ============================================================
//  CAPTURE AND UPLOAD — FULL PIPELINE
// ============================================================
void captureAndUpload() {
  Serial.println("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.printf("📸 [%s] — %s\n", CAM_ID, CAM_LABEL);
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  Serial.println("Step 1: Capturing...");
  camera_fb_t* fb = captureGoodFrame();
  if (!fb) {
    Serial.println("❌ Capture failed — aborting");
    return;
  }
  Serial.printf("✅ Frame: %d bytes\n", fb->len);

  Serial.println("Step 2: Uploading to ImgBB...");
  String url = uploadToImgBB(fb->buf, fb->len);
  esp_camera_fb_return(fb);

  if (url.length() == 0) {
    Serial.println("❌ Upload failed — aborting");
    return;
  }

  Serial.println("Step 3: Saving to Firebase...");
  saveToDatabase(url);
}

// ============================================================
//  SETUP
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("\n╔══════════════════════════════════════╗");
  Serial.printf( "║  LifeGuardX CAM v1.9 — %-14s  ║\n", CAM_ID);
  Serial.println("║  ImgBB → Firebase Realtime DB         ║");
  Serial.printf( "║  Label: %-29s  ║\n", CAM_LABEL);
  Serial.println("╚══════════════════════════════════════╝\n");

  pinMode(IO0_PIN, INPUT_PULLUP);
  pinMode(FLASH_PIN, OUTPUT);
  digitalWrite(FLASH_PIN, LOW);

  pinMode(TRIGGER_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(TRIGGER_PIN), onTrigger, FALLING);
  Serial.println("⚡ [ISR] GPIO13 interrupt attached — FALLING edge");

  camReady = initCamera();
  if (!camReady) {
    Serial.println("❌ Camera FAILED — check ribbon cable + power");
    while (1) {
      digitalWrite(FLASH_PIN, HIGH); delay(100);
      digitalWrite(FLASH_PIN, LOW);  delay(100);
    }
  }

  wifiReady = connectWiFi();
  if (!wifiReady) {
    Serial.println("⚠️  WiFi failed — retrying in loop");
  }

  for (int i = 0; i < 3; i++) {
    digitalWrite(FLASH_PIN, HIGH); delay(400);
    digitalWrite(FLASH_PIN, LOW);  delay(400);
  }

  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.printf("📷 [%s] READY\n", CAM_ID);
  Serial.println("   GPIO13 interrupt active — cannot miss trigger");
  Serial.println("   IO0 button = manual test anytime");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// ============================================================
//  LOOP
// ============================================================
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi lost — reconnecting...");
    detachInterrupt(digitalPinToInterrupt(TRIGGER_PIN));
    WiFi.disconnect(true);
    WiFi.begin(WIFI_SSID, WIFI_PASS);

    int t = 0;
    while (WiFi.status() != WL_CONNECTED && t < 20) {
      delay(500);
      Serial.print(".");
      t++;
    }
    Serial.println();

    attachInterrupt(digitalPinToInterrupt(TRIGGER_PIN), onTrigger, FALLING);

    if (WiFi.status() == WL_CONNECTED) {
      Serial.printf("✅ WiFi reconnected — IP: %s | RSSI: %d dBm\n",
                    WiFi.localIP().toString().c_str(), WiFi.RSSI());
    }
    return;
  }

  if (triggerFlag) {
    triggerFlag = false;

    unsigned long now = millis();
    if (now - lastCaptureTime < LOCKOUT_MS) {
      Serial.printf("⏱️  Trigger ignored — lockout active (%lus remaining)\n",
                    (LOCKOUT_MS - (now - lastCaptureTime)) / 1000);
    } else {
      Serial.println("🔔 GPIO13 triggered by ESP32-S3 — capturing!");
      lastCaptureTime = now;
      captureAndUpload();
    }
  }

  if (digitalRead(IO0_PIN) == LOW) {
    Serial.println("🔘 IO0 pressed — manual capture!");

    unsigned long now = millis();
    if (now - lastCaptureTime >= LOCKOUT_MS) {
      lastCaptureTime = now;
      captureAndUpload();
    } else {
      Serial.println("⏱️  Manual press ignored — lockout active");
    }

    while (digitalRead(IO0_PIN) == LOW) delay(10);
    delay(500);
  }

  // static bool autoTestDone = false;
  // if (!autoTestDone && millis() > AUTO_TEST_DELAY) {
  //   autoTestDone = true;
  //   Serial.println("⏱️  AUTO TEST firing!");
  //   captureAndUpload();
  // }

  delay(20);
}
