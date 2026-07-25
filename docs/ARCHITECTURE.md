┌──────────────────────────────────────────────────────────────────────────────┐
│                             LIFEGUARDX PRO SYSTEM                            │
│                                                                              │
│  ┌──────────────────────────────┐                                             │
│  │       HARDWARE LAYER        │                                             │
│  │     (ESP32-S3 + Sensors)     │                                             │
│  │                             │                                             │
│  │  Sensors → WiFi → Firebase ──┼────────────────────────────────────────┐  │
│  │  (reads every 100ms)         │                                          │  │
│  │  (uploads every ~1-2s)       │                                          ▼  │
│  └──────────────────────────────┘                                             │
│          ▲                                                                    │
│          │ (Hardware Trigger)                                                 │
│          │                                                                    │
│  ┌──────────────────────────────┐                                             │
│  │     DUAL CAMERA LAYER        │                                             │
│  │                              │                                             │
│  │  2x ESP32-CAM (ImgBB API)    │                                             │
│  │  - Captures on incident      │                                             │
│  │  - Uploads evidence photos    │                                             │
│  └──────────────────────────────┘                                             │
│                                                                               │
│  ┌─────────────────────────────┐      ┌──────────────────────────────────┐  │
│  │       CLOUD LAYER           │      │       SOFTWARE LAYER             │  │
│  │                             │      │    (Anti-Gravity Dashboard)      │  │
│  │  Firebase Realtime DB       │─Push─▶  React + MediaPipe AI            │  │
│  │  /accidentState             │      │  - AIRiskAnalyzer (Inference)    │  │
│  │  (PATCH-based updates)      │      │  - BiometricIntel (478 landmarks)│  │
│  │                             │      │  - GPS Map (NMEA/Decimal Fix)    │  │
│  │  Instant push updates       │      │  - Dark-Mode Glassmorphism       │  │
│  │  to all connected clients   │      │  - Watchdog System               │  │
│  └─────────────────────────────┘      └──────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
