// ============================================================
//  LifeGuardX — ESP32-CAM v1.9
//  ImgBB Upload → Firebase Realtime DB
//
//  ── FIXES v1.8 → v1.9 ────────────────────────────────────
//  FIX 1 — WiFi SSID updated to "Esptest" (matches ESP32-S3)
//           All 3 devices must be on SAME hotspot for demo
//           CAM was on "Qwe", S3 was on "Esptest" → mismatch
//
//  FIX 2 — attachInterrupt() moved AFTER initCamera() + WiFi
//           v1.8: ISR attached before camera init → trigger
//           during 5-frame warmup → captureAndUpload() before
//           camera ready → crash/null frame
//           v1.9: ISR attached at end of setup() after camera
//           and WiFi are both fully ready
//
//  FIX 3 — triggerFlag cleared if camera not ready
//           Extra safety: if triggerFlag fires but camReady=false
//           flag is cleared without capture attempt
//
//  ── VERIFIED FIREBASE PATHS (against ESP32-S3 v3.4) ──────
//  S3 resets:  accidentState/evidence  (PUT — clears old data)
//  S3 PATCHes: accidentState           (PATCH — never touches evidence)
//  CAM writes: accidentState/evidence/cam1_url    ✅ correct
//              accidentState/evidence/cam1_label  ✅ correct
//              accidentState/evidence/cam1_ready  ✅ correct
//              accidentState/evidence/captured_at ✅ correct
//  No conflict between S3 PATCH and CAM writes ✅
//
//  ── HOW TO FLASH (AI Thinker ESP32-CAM) ─────────────────
//  1. Board:      AI Thinker ESP32-CAM
//  2. Partition:  Huge APP (3MB No OTA / 1MB SPIFFS)
//  3. Hold IO0 on MB Base → Press RESET → Release IO0
//  4. Click Upload
//  5. After "Done uploading" → Press RESET → Serial 115200
//
//  ── POWER ────────────────────────────────────────────────
//  OPTION A — USB: MB Base USB port → own phone charger/laptop
//  OPTION B — Direct: 5V supply → MB Base 5V pin
//                     GND supply → MB Base GND pin
//                     Min 500mA required
//  GND always shared with ESP32-S3 regardless of power option
//
//  ── WIRING ───────────────────────────────────────────────
//  CAM1: ESP32-S3 GPIO16 → MB Base GPIO13
//        ESP32-S3 GND    → MB Base GND
//  CAM2: ESP32-S3 GPIO15 → MB Base GPIO13
//        ESP32-S3 GND    → MB Base GND
//
//  ── PER CAMERA — CHANGE ONLY THESE 2 LINES ──────────────
//  CAM1:  CAM_ID="cam1"   CAM_LABEL="Road Scene"
//  CAM2:  CAM_ID="cam2"   CAM_LABEL="Driver Condition"
//
//  ── AUTO TEST (without ESP32-S3) ─────────────────────────
//  1. Uncomment: #define AUTO_TEST_DELAY 15000
//  2. Uncomment the 4 lines in loop() marked AUTO TEST BLOCK
//  3. Recomment both when deploying with ESP32-S3
// ============================================================

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>

// ── CHANGE THESE 2 LINES PER CAMERA ──────────────────────
#define CAM_ID    "cam1"           // "cam1" or "cam2"
#define CAM_LABEL "Road Scene"     // "Road Scene" or "Driver Condition"
// ─────────────────────────────────────────────────────────

// ── AUTO TEST — uncomment ONLY when testing without ESP32-S3
// #define AUTO_TEST_DELAY 15000
// ─────────────────────────────────────────────────────────

// ── WiFi — MUST MATCH ESP32-S3 ───────────────────────────
// FIX 1: Changed from "Qwe" to "Esptest" to match ESP32-S3
// All 3 devices (ESP32-S3, CAM1, CAM2) must be on same WiFi
const char* WIFI_SSID = "Esptest";   // ← SAME as ESP32-S3
const char* WIFI_PASS = "test1234";  // ← SAME as ESP32-S3
// ─────────────────────────────────────────────────────────

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
#define TRIGGER_PIN  13   // GPIO13 — FALLING interrupt from ESP32-S3
#define IO0_PIN       0   // GPIO0  — MB Base button (manual trigger)
#define FLASH_PIN     4   // GPIO4  — onboard flash LED

// ── STATE FLAGS ───────────────────────────────────────────
bool camReady  = false;  // true after initCamera() completes
bool wifiReady = false;  // true after WiFi connects

// ── HARDWARE INTERRUPT FLAG ───────────────────────────────
// volatile: compiler must not cache this — it changes inside ISR
// ISR sets this true → loop() reads and clears it safely
volatile bool triggerFlag = false;

// ── NON-BLOCKING LOCKOUT ──────────────────────────────────
// After capture, ignore new triggers for 5 seconds
// Prevents same accident pulse re-triggering capture
const unsigned long LOCKOUT_MS = 5000;
unsigned long lastCaptureTime  = 0;

// ── ISR — fires INSTANTLY on GPIO13 FALLING edge ─────────
// IRAM_ATTR: runs from RAM not flash — mandatory for ISR reliability
// Must be fast: only set flag, no Serial/WiFi/delay allowed here
void IRAM_ATTR onTrigger() {
  triggerFlag = true;
}

// ============================================================
//  BASE64 ENCODER
//  Encodes raw JPEG bytes to base64 string for ImgBB POST
// ============================================================
static const char b64chars[] =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

String base64Encode(const uint8_t* data, size_t len) {
  String result = "";
  result.reserve(((len / 3) + 1) * 4 + 4);
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
//  Init OV2640 sensor, apply quality settings,
//  discard 5 warmup frames so exposure stabilises
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
  cfg.frame_size   = FRAMESIZE_QVGA;  // 320×240 — fast upload, good evidence quality
  cfg.jpeg_quality = 10;              // 0=best 63=worst
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
  s->set_whitebal(s, 1);       // auto white balance
  s->set_awb_gain(s, 1);
  s->set_exposure_ctrl(s, 1);  // auto exposure
  s->set_aec2(s, 1);
  s->set_gain_ctrl(s, 1);      // auto gain
  s->set_agc_gain(s, 0);
  s->set_gainceiling(s, (gainceiling_t)2);
  s->set_bpc(s, 1);            // black pixel correction
  s->set_wpc(s, 1);            // white pixel correction
  s->set_raw_gma(s, 1);        // gamma correction
  s->set_lenc(s, 1);           // lens correction
  s->set_hmirror(s, 0);
  s->set_vflip(s, 0);

  // Discard 5 frames — first frames are dark before sensor warms up
  Serial.println("   Warming up (discarding 5 frames)...");
  for (int i = 0; i < 5; i++) {
    camera_fb_t* f = esp_camera_fb_get();
    if (f) esp_camera_fb_return(f);
    delay(200);
    Serial.printf("   Frame %d discarded\n", i + 1);
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
    Serial.printf("✅ WiFi OK — SSID:[%s] IP:%s\n\n",
                  WIFI_SSID, WiFi.localIP().toString().c_str());
    return true;
  }
  Serial.printf("❌ WiFi FAILED — check SSID:[%s] and password\n\n", WIFI_SSID);
  return false;
}

// ============================================================
//  CAPTURE GOOD FRAME
//  Flush stale frames, retry up to 5×, return valid JPEG
//  Caller MUST call esp_camera_fb_return(fb) after use
// ============================================================
camera_fb_t* captureGoodFrame() {
  const int MIN_SIZE  = 2000;  // minimum bytes for a valid JPEG
  const int MAX_TRIES = 5;

  for (int attempt = 1; attempt <= MAX_TRIES; attempt++) {
    // Flush 2 stale frames before each attempt
    // (buffer holds last frame — must clear before fresh capture)
    for (int d = 0; d < 2; d++) {
      camera_fb_t* stale = esp_camera_fb_get();
      if (stale) esp_camera_fb_return(stale);
      delay(150);
    }

    // Flash ON → short wait → capture → Flash OFF
    digitalWrite(FLASH_PIN, HIGH);
    delay(300);
    camera_fb_t* fb = esp_camera_fb_get();
    digitalWrite(FLASH_PIN, LOW);

    if (!fb) {
      Serial.printf("   Attempt %d: null frame — retrying\n", attempt);
      delay(300);
      continue;
    }

    Serial.printf("   Attempt %d: %d bytes", attempt, fb->len);

    if (fb->len >= MIN_SIZE) {
      Serial.println(" ✅ Accepted!");
      return fb;  // caller must free
    }

    Serial.printf(" ⚠️  Too small (min %d) — discarding\n", MIN_SIZE);
    esp_camera_fb_return(fb);
    delay(400);
  }

  Serial.println("❌ All capture attempts failed");
  return nullptr;
}

// ============================================================
//  UPLOAD TO IMGBB
//  base64 encode JPEG → URL-encode +/ → POST → parse URL
//  Returns public image URL string, or "" on failure
// ============================================================
String uploadToImgBB(const uint8_t* imgData, size_t imgLen) {
  Serial.printf("   Encoding %d bytes to base64...\n", imgLen);
  String b64 = base64Encode(imgData, imgLen);
  Serial.printf("   Base64 length: %d chars\n", b64.length());

  // CRITICAL: URL-encode + and / in base64 for form-encoded POST body
  // Without this: ImgBB returns 400 "Invalid base64 string"
  // + treated as space, / treated as path separator in form body
  b64.replace("+", "%2B");
  b64.replace("/", "%2F");

  String postBody = "key=";
  postBody += IMGBB_KEY;
  postBody += "&image=";
  postBody += b64;

  Serial.println("   Posting to ImgBB API...");

  HTTPClient http;
  http.begin("https://api.imgbb.com/1/upload");
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");
  http.setTimeout(30000);  // 30s — base64 payload is large

  int code = http.POST(postBody);
  Serial.printf("   ImgBB HTTP: %d\n", code);

  if (code != 200) {
    Serial.println("❌ ImgBB FAILED: " + http.getString().substring(0, 200));
    http.end();
    return "";
  }

  String response = http.getString();
  http.end();

  // Parse "url" (direct image link) from ImgBB JSON response
  // Response: {"data":{"id":"xxx","url":"https://i.ibb.co/xxx/img.jpg",...}}
  int idx = response.indexOf("\"url\":\"");
  if (idx == -1) {
    Serial.println("❌ URL not found in ImgBB response");
    Serial.println("   Raw (first 300): " + response.substring(0, 300));
    return "";
  }

  idx += 7;  // skip past: "url":"
  int endIdx = response.indexOf("\"", idx);
  String url  = response.substring(idx, endIdx);
  url.replace("\\/", "/");  // unescape JSON forward slashes

  Serial.println("✅ ImgBB URL: " + url);
  return url;
}

// ============================================================
//  SAVE TO FIREBASE REALTIME DB
//
//  Writes to: accidentState/evidence/<CAM_ID>_url
//                                   <CAM_ID>_label
//                                   <CAM_ID>_ready  ← dashboard watches this
//                                   captured_at
//
//  PATH VERIFIED against ESP32-S3 v3.4:
//    S3 resetEvidenceNode() PUTs to: accidentState/evidence  ← clears whole node
//    S3 PATCH goes to:               accidentState           ← never touches evidence
//    CAM PUTs to:                    accidentState/evidence/cam1_url etc. ← correct
//    No conflict — PATCH on S3 side preserves evidence written here ✅
// ============================================================
void saveToDatabase(String photoURL) {
  Serial.println("💾 Saving to Firebase...");

  // Base evidence path — same for both cameras
  String base = "https://" + String(PROJECT_ID)
                + "-default-rtdb.firebaseio.com/accidentState/evidence/";
  HTTPClient http;
  int r;

  // 1. Save photo URL — dashboard renders this as <img src>
  http.begin(base + String(CAM_ID) + "_url.json");
  http.addHeader("Content-Type", "application/json");
  r = http.PUT("\"" + photoURL + "\"");
  Serial.printf("   %s_url    → HTTP %d\n", CAM_ID, r);
  http.end();

  // 2. Save label — dashboard shows as image caption
  http.begin(base + String(CAM_ID) + "_label.json");
  http.addHeader("Content-Type", "application/json");
  r = http.PUT("\"" + String(CAM_LABEL) + "\"");
  Serial.printf("   %s_label  → HTTP %d\n", CAM_ID, r);
  http.end();

  // 3. Set ready = true — dashboard shows photo ONLY when this is true
  //    Dashboard listens: when cam1_ready && cam2_ready → show evidence panel
  http.begin(base + String(CAM_ID) + "_ready.json");
  http.addHeader("Content-Type", "application/json");
  r = http.PUT("true");
  Serial.printf("   %s_ready  → HTTP %d\n", CAM_ID, r);
  http.end();

  // 4. Timestamp in seconds — dashboard shows "captured X seconds ago"
  http.begin(base + "captured_at.json");
  http.addHeader("Content-Type", "application/json");
  r = http.PUT(String(millis() / 1000));
  Serial.printf("   captured_at → HTTP %d\n", r);
  http.end();

  if (r == 200) {
    Serial.println("✅ Firebase saved — evidence live on dashboard!");
    // 5 fast blinks = full pipeline success (capture → ImgBB → Firebase)
    for (int i = 0; i < 5; i++) {
      digitalWrite(FLASH_PIN, HIGH); delay(80);
      digitalWrite(FLASH_PIN, LOW);  delay(80);
    }
  } else {
    Serial.println("❌ Firebase save failed");
    Serial.println("   Check: DB rules set to public read/write");
    Serial.println("   Check: WiFi still connected");
  }
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// ============================================================
//  CAPTURE AND UPLOAD — FULL PIPELINE
//  Step 1: captureGoodFrame()
//  Step 2: uploadToImgBB()   → get public URL
//  Step 3: saveToDatabase()  → write URL to Firebase evidence node
// ============================================================
void captureAndUpload() {
  Serial.println("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.printf("📸 [%s] — %s\n", CAM_ID, CAM_LABEL);
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Step 1 — capture (retries up to 5× with stale frame flush)
  Serial.println("Step 1: Capturing...");
  camera_fb_t* fb = captureGoodFrame();
  if (!fb) {
    Serial.println("❌ Capture failed — aborting pipeline");
    return;
  }
  Serial.printf("✅ Frame captured: %d bytes\n", fb->len);

  // Step 2 — encode + upload to ImgBB
  Serial.println("Step 2: Uploading to ImgBB...");
  String url = uploadToImgBB(fb->buf, fb->len);
  esp_camera_fb_return(fb);  // free buffer IMMEDIATELY after encode — don't hold it

  if (url.length() == 0) {
    Serial.println("❌ ImgBB upload failed — aborting pipeline");
    return;
  }

  // Step 3 — write URL + metadata to Firebase evidence node
  Serial.println("Step 3: Saving to Firebase evidence node...");
  saveToDatabase(url);
}

// ============================================================
//  SETUP — runs once on power-on or RESET button
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("\n╔══════════════════════════════════════╗");
  Serial.printf( "║  LifeGuardX CAM v1.9 — %-14s  ║\n", CAM_ID);
  Serial.println("║  ImgBB → Firebase Realtime DB         ║");
  Serial.printf( "║  Label:  %-28s  ║\n", CAM_LABEL);
  Serial.printf( "║  WiFi:   %-28s  ║\n", WIFI_SSID);
  Serial.println("╚══════════════════════════════════════╝\n");

  // ── Pin setup ─────────────────────────────────────────────
  pinMode(TRIGGER_PIN, INPUT_PULLUP);  // HIGH when idle, LOW when S3 triggers
  // IO0 cannot be used as a button — it is the camera's 20MHz XCLK!
  pinMode(FLASH_PIN,   OUTPUT);
  digitalWrite(FLASH_PIN, LOW);        // Flash OFF at startup

  // ── Camera init (includes 5-frame warmup ~1.5s) ───────────
  camReady = initCamera();
  if (!camReady) {
    Serial.println("❌ Camera FAILED — check ribbon cable and power");
    Serial.println("   Halting — rapid blink = hardware fault");
    while (1) {
      digitalWrite(FLASH_PIN, HIGH); delay(100);
      digitalWrite(FLASH_PIN, LOW);  delay(100);
    }
  }

  // ── WiFi ──────────────────────────────────────────────────
  wifiReady = connectWiFi();
  if (!wifiReady) {
    Serial.println("⚠️  WiFi failed — trigger will be ignored until connected");
  }

  // ── FIX 2: Attach interrupt AFTER camera + WiFi ready ─────
  // Attaching before initCamera() means ISR could fire during
  // 5-frame warmup → captureAndUpload() called before camera is
  // initialised → null frame or crash
  // Attach HERE so camera is guaranteed ready when ISR fires
  attachInterrupt(digitalPinToInterrupt(TRIGGER_PIN), onTrigger, FALLING);
  Serial.println("⚡ [ISR] GPIO13 interrupt attached — FALLING edge (camera ready)");

  // ── 3 slow blinks = fully ready ───────────────────────────
  for (int i = 0; i < 3; i++) {
    digitalWrite(FLASH_PIN, HIGH); delay(400);
    digitalWrite(FLASH_PIN, LOW);  delay(400);
  }

  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.printf("📷 [%s] v1.9 READY — waiting for trigger\n", CAM_ID);
  Serial.printf("   WiFi SSID: %s\n", WIFI_SSID);
  Serial.println("   Triggers: GPIO13 ISR (from S3) | IO0 button (manual)");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// ============================================================
//  LOOP — runs continuously
// ============================================================
void loop() {

  // ── WiFi watchdog ─────────────────────────────────────────
  // Reconnects if WiFi drops (hotspot restart etc.)
  if (WiFi.status() != WL_CONNECTED) {
    Serial.printf("⚠️  WiFi lost — reconnecting to [%s]...\n", WIFI_SSID);
    detachInterrupt(digitalPinToInterrupt(TRIGGER_PIN));  // pause ISR during reconnect
    WiFi.reconnect();
    int t = 0;
    while (WiFi.status() != WL_CONNECTED && t < 20) { delay(500); t++; }
    attachInterrupt(digitalPinToInterrupt(TRIGGER_PIN), onTrigger, FALLING);  // resume ISR
    if (WiFi.status() == WL_CONNECTED)
      Serial.printf("✅ WiFi reconnected — IP: %s\n", WiFi.localIP().toString().c_str());
    else
      Serial.println("❌ WiFi reconnect failed — will retry next loop");
    return;
  }

  // ── GPIO13 ISR TRIGGER — from ESP32-S3 ───────────────────
  // triggerFlag set by onTrigger() ISR on FALLING edge of GPIO13
  // S3 sends: resetEvidenceNode() → 500ms LOW on GPIO16/15
  // This ISR fires at the start of that 500ms LOW pulse
  if (triggerFlag) {
    triggerFlag = false;  // clear immediately

    // FIX 3: ignore if camera not ready (shouldn't happen now but safe)
    if (!camReady) {
      Serial.println("⚠️  Trigger ignored — camera not ready");
      return;
    }

    unsigned long now = millis();
    if (now - lastCaptureTime < LOCKOUT_MS) {
      // Within lockout window — same accident pulse, ignore
      Serial.printf("⏱️  Trigger ignored — lockout (%lus remaining)\n",
                    (LOCKOUT_MS - (now - lastCaptureTime)) / 1000);
    } else {
      // Valid new trigger — run full pipeline
      Serial.println("🔔 GPIO13 triggered by ESP32-S3 — starting capture pipeline!");
      lastCaptureTime = now;  // start lockout
      captureAndUpload();
    }
  }

  // ── IO0 BUTTON REMOVED ───────────────────────────────────
  // IO0 is XCLK (20MHz camera clock). Reading it with digitalRead
  // causes constant false triggers. Manual button removed.

  // ── AUTO TEST BLOCK ───────────────────────────────────────
  // For testing capture pipeline WITHOUT ESP32-S3 connected
  //
  // TO ENABLE:
  //   1. Uncomment: #define AUTO_TEST_DELAY 15000  (top of file)
  //   2. Uncomment the 4 lines below
  //   3. Flash → camera fires 15s after boot automatically
  //
  // TO DISABLE (before demo with ESP32-S3):
  //   Recomment both the #define and the 4 lines below
  //
  // static bool autoTestDone = false;
  // if (!autoTestDone && millis() > AUTO_TEST_DELAY) {
  //   autoTestDone = true;
  //   Serial.println("⏱️  AUTO TEST firing — 15s elapsed");
  //   captureAndUpload();
  // }

  delay(20);  // ISR fires regardless of this delay
}
