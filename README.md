# 🛡️ LifeGuardX Pro
### Anti-Gravity Pro Telemetry & Intelligent Accident Detection System (AI Integrated)

![ESP32-S3](https://img.shields.io/badge/ESP32--S3-Firmware-E7352C?logo=espressif&logoColor=white&style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white&style=for-the-badge)
![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?logo=firebase&logoColor=black&style=for-the-badge)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Tasks_Vision-007AFF?logo=google&logoColor=white&style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white&style=for-the-badge)

> **"Anti-Gravity Pro:** Detect the accident instantly, alert immediately, save the life before it's too late."

---

## 📋 Table of Contents

1. [Problem Statement](#-problem-statement)
2. [Core Idea & Concept](#-core-idea--concept)
3. [Proposed Solution](#-proposed-solution)
4. [System Architecture](#-system-architecture)
5. [Hardware Part](#-hardware-part)
   - [Components List](#components-list)
   - [Pin Connection Table](#pin-connection-table)
6. [Software Part](#-software-part)
   - [Project Structure](#project-structure)
   - [Tech Stack & Packages](#tech-stack--packages)
7. [Firebase Database Structure](#-firebase-database-structure)
8. [Data Flow — Step by Step](#-data-flow--step-by-step)
9. [Online / Offline Detection](#-online--offline-detection)
10. [Dashboard Features](#-dashboard-features)
11. [Getting Started](#-getting-started)
12. [Available Scripts](#-available-scripts)
13. [Deployment](#-deployment)

---

## ❗ Problem Statement

Road accidents are one of the major causes of death today — **not because an accident cannot be survived, but because help arrives too late.**

### The Real Problems

#### 🔴 No one knows when an accident happens
Many accidents occur on empty roads, during late nights, on highways, and in remote areas. When no one sees the crash, **no one calls for help.**

#### 🔴 Victims cannot call for help
After a crash, the victim may become unconscious, drop their phone, get stuck, or be unable to speak or move. Because of this, **no alert is sent** to family or emergency services.

#### 🔴 The "Golden Hour" is wasted
Doctors say a victim's survival chance is highest in the **first 60 minutes**. But when no one knows about the accident:
- Ambulance arrives late
- Internal bleeding worsens
- Brain injuries become permanent

#### 🔴 Families don't know where the person is
When someone doesn't return home — their phone is off, no location is available, and hours are wasted searching. **This delay becomes deadly.**

#### 🔴 Early warning signs are ignored
Before major accidents, the vehicle skids, shakes abnormally, or tilts — but these signs are not monitored, so many **preventable accidents become serious.**

#### 🔴 No automatic emergency alert system
Even in severe accidents — no automatic message goes out, no real-time data is sent, no location is shared. **Lives depend on luck, not a system that protects them.**

---

## 💡 Core Idea & Concept

LifeGuardX is designed with one goal:

> **Detect the accident instantly → Alert immediately → Save the life before it's too late.**

### What LifeGuardX Does

| Capability | How |
|-----------|-----|
| **Automatically detect when something goes wrong** | Monitors crash, fall, dangerous tilt, gas leak, fire, and water hazard 24/7 |
| **Capture the exact GPS location instantly** | GPS coordinates are transmitted the moment a crash is detected |
| **Alert even when the victim cannot** | System sends the alert automatically — no human action needed |
| **Make accident response fast** | Reduces detection time from 20–40 minutes to **under 2 seconds** |

### LifeGuardX Ensures That:
- 🚫 Accidents **NEVER** go unnoticed
- 🚫 Safety hazards **NEVER** stay hidden
- 🚫 Families **NEVER** stay clueless
- 🚫 Victims **NEVER** stay without help

---

## ✅ Proposed Solution

LifeGuardX combines all of the following into a **single intelligent safety system**:

```
Accident Detection  +  Hazard Monitoring  +  Live GPS Tracking  +  Smart Alerts  +  Real-Time Cloud Sync
```

| Component | Description |
|-----------|-------------|
| ✔ **Hardware Unit** | Monitors temperature, gas, tilt, G-force, fire, water, and GPS |
| ✔ **Cloud System** | Firebase Realtime Database — stores and syncs vehicle data instantly |
| ✔ **Web Dashboard** | Displays live telemetry, maps, accident alerts, and sensor analysis |
| ✔ **Online/Offline Detection** | Heartbeat logic — knows exactly when ESP32 goes offline within 30 seconds |
| ✔ **Real-Time Emergency Trigger** | Dashboard receives accident alerts the instant they are detected |

---

## 🏗️ System Architecture

```
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
```

---

## 🧠 AI Consciousness & Vision Engine (v4.2)

LifeGuardX Pro features a state-of-the-art **Neural Vision Pipeline** powered by **Google MediaPipe**. This engine operates entirely at the edge (in-browser), ensuring sub-50ms inference for critical victim analysis.

### 👁️ Core Vision Engine (MediaPipe Face Landmarker)
The system has been migrated from legacy `face-api.js` to the high-performance **MediaPipe Tasks Vision** framework:
- **478-Point 3D Facial Mesh**: Superior tracking precision compared to the old 68-point model.
- **Biometric Blendshape Analysis**: Real-time extraction of 52 specific facial expressions (v-sync synchronized).
- **Face-Relative Eye Tracking (EAR)**: 
    - Calculated using high-definition landmarks: Left `[33, 160, 158, 133, 153, 144]`, Right `[362, 385, 387, 263, 373, 380]`.
    - **Adaptive Sensitivity**: Thresholds dynamically shift based on lighting and distance.
- **Consciousness Guard**: Auto-flags **UNCONSCIOUS** if EAR < 0.2 or Blink Score > 0.6 for a sustained period.

### ⚖️ AI Risk Analyzer (Sensor Fusion v2.0)
The **AIRiskAnalyzer** component implements a 12-rule fuzzy logic matrix to fuse physical sensor telemetry with AI biometric results:
- **Physical Baseline**: Prioritizes Fire > Gas > Water > G-Force > Tilt.
- **Biometric Multiplier**: A detected "Distressed" or "Unconscious" state acts as a risk multiplier, escalating `MODERATE` hazards to `CRITICAL`.
- **Compound Emergency Logic**: Specifically identifies life-threatening combinations, such as `Fire + Unconscious`.

### ⚡ Biometric Intel Dashboard
A specialized UI component that visualizes the AI's internal state:
- **Landmark Overlay**: Real-time projection of the 478-point mesh on the evidence image.
- **7-Emotion Spectrum**: Distribution chart of Neutral, Happy, Sad, Angry, Fearful, Disgusted, and Surprised states.
- **Confidence Rating**: Real-time tracking of AI model certainty levels.

## 📂 Exhaustive Project Structure

```text
Accident-Detection-System/
├── 📂 .vscode/                       # IDE configuration
│   └── extensions.json               # Recommended VS Code extensions
├── 📂 espcam/                        # 📷 Evidence Capture Firmware
│   └── espcam.ino                    # ESP32-CAM trigger & ImgBB upload logic
├── 📂 esps3/                         # 🛡️ Main Detection Firmware
│   └── esps3.ino                     # ESP32-S3 sensor fusion, GPS, & Firebase sync
├── 📂 public/                        # 🌐 Static Assets
│   ├── heartbeat.png                 # System status iconography
│   └── manifest.json                 # Web App Manifest
├── 📂 src/                           # 💻 Anti-Gravity Dashboard (React + TS)
│   ├── 📂 components/                # Modular UI components
│   │   ├── 📂 AIAccidentShield/      # Specialized accident monitoring
│   │   │   ├── AIAccidentShield.tsx  # Flagship detector component
│   │   │   └── BiometricIntel.tsx    # MediaPipe visualizer
│   │   ├── 📂 VictimSeverity/        # Biometric analysis UI
│   │   │   ├── VictimSeverity.tsx    # Severity controller
│   │   │   ├── VictimSeverityCard.tsx# Result visualization
│   │   │   └── types.ts              # Local types
│   │   ├── AIRiskAnalyzer.tsx        # High-order inference engine
│   │   ├── EmergencyBanner.tsx       # Full-screen ambient alerts
│   │   ├── EvidenceSection.tsx       # Post-accident media triage
│   │   ├── Footer.tsx                # Branding & legal links
│   │   ├── Header.tsx                # Glassmorphic nav & status
│   │   ├── MapDisplay.tsx            # GIS mapping (Leaflet)
│   │   ├── SensorCard.tsx            # Reusable glassmorphic cards
│   │   ├── SensorGrid.tsx            # Adaptive layout engine
│   │   └── StatusCards.tsx           # Fleet health indicators
│   ├── 📂 constants/                 # System themes & tokens
│   │   └── theme.ts                  # Anti-Gravity design tokens
│   ├── 📂 hooks/                     # Custom React hooks
│   │   └── useFaceAnalysis.ts        # MediaPipe logic hook
│   ├── 📂 utils/                     # Shared utilities
│   │   ├── mediaPipeLoader.ts        # AI engine singleton
│   │   └── openCVLoader.ts           # Vision processing loader
│   ├── App.tsx                       # Root orchestrator
│   ├── index.css                     # Global design foundation (Tailwind 4)
│   ├── types.ts                      # Universal telemetry interfaces
│   └── main.tsx                      # DOM entry point
├── 📂 dist/                          # Production build output
├── .env.example                      # Template for Firebase/API keys
├── .gitignore                        # Git exclusion rules
├── firebasewriter.cjs                # DB provisioning script
├── watchdog.cjs                      # System health monitor
├── package.json                      # Dependency registry
├── tailwind.config.js                # Tailwind CSS v4 config
├── tsconfig.json                     # TypeScript configuration
├── vercel.json                       # Vercel deployment rules
└── README.md                         # This documentation
```

### 🧠 Core Component Mapping

#### 🏗️ Root Orchestration
- [App.tsx](file:///c:/Users/rabbu/Projects/Hardware_projects/Accident-Detection-System/src/App.tsx) — **The Brain**: Orchestrates Firebase listeners, 30s heartbeat logic, global theme mapping, and notification dispatching.
- [index.css](file:///c:/Users/rabbu/Projects/Hardware_projects/Accident-Detection-System/src/index.css) — **Anti-Gravity Foundation**: Global CSS variables and glassmorphic visual tokens.

#### 🍱 Dashboard Ecosystem (`src/components/`)
- [AIRiskAnalyzer.tsx](file:///c:/Users/rabbu/Projects/Hardware_projects/Accident-Detection-System/src/components/AIRiskAnalyzer.tsx) — **Inference Engine**: Fuses sensor data with AI results to determine overall severity.
- [MapDisplay.tsx](file:///c:/Users/rabbu/Projects/Hardware_projects/Accident-Detection-System/src/components/MapDisplay.tsx) — GPS integration with NMEA/Decimal coordinate auto-flipping.
- [SensorGrid.tsx](file:///c:/Users/rabbu/Projects/Hardware_projects/Accident-Detection-System/src/components/SensorGrid.tsx) — Smart layout engine for the Telemetry array.

#### 🔧 Hardware Firmware
- **[ESPS3 Main Controller](file:///c:/Users/rabbu/Projects/Hardware_projects/Accident-Detection-System/esps3/esps3.ino)**:
    - Manages MPU6050, DHT11, MQ2, Flame, and Water sensors.
    - Handles **GPS 16-bit overflow correction** logic.
    - Uploads and patches telemetry to Firebase RTDB every 1000ms.
- **[ESPCAM Evidence Unit](file:///c:/Users/rabbu/Projects/Hardware_projects/Accident-Detection-System/espcam/espcam.ino)**:
    - Listens for hardware triggers on GPIO13.
    - Captures and uploads road/driver imagery to the dashboard.

#### 🐕 Infrastructure & Automation
- [watchdog.cjs](file:///c:/Users/rabbu/Projects/Hardware_projects/Accident-Detection-System/watchdog.cjs) — Real-time Node.js monitor for database integrity and connectivity.
- [vercel.json](file:///c:/Users/rabbu/Projects/Hardware_projects/Accident-Detection-System/vercel.json) — Production-ready routing for SPA deployment.

---

### 🛰️ Advanced Location Intelligence (GPS)

The system features a robust GPS processing pipeline designed for high-precision tracking in the Indian subcontinent:
- **NMEA & Decimal Auto-Detection**: The dashboard automatically detects and converts incoming GPS strings (Decimal Degrees or NMEA GPRMC).
- **16-Bit Integer Overflow Fix**: A critical firmware/frontend patch that compensates for 16-bit hardware overflows, ensuring accurate positioning for coordinates in the `14°N - 18°N` and `78°E - 82°E` range (specifically calibrated for the Andhra Pradesh region).
- **Direct Navigation**: Deep-linking to Google Maps for high-speed emergency response.

---

## 💻 Software Part

### Project Structure

```
Accident-Detection-System/
│
├── 📂 src/                           # React + TypeScript frontend
│   ├── App.tsx                       # Root: Firebase listener, heartbeat, theme logic
│   ├── types.ts                      # TypeScript interface for FirebaseData
│   ├── index.css                     # Design system — CSS variables, dark/light themes
│   ├── main.tsx                      # React DOM entry point
│   │
│   └── 📂 components/
│       ├── Header.tsx                # Sticky header — online/offline badge, theme toggle
│       ├── SensorGrid.tsx            # 7-card responsive sensor display grid
│       ├── SensorCard.tsx            # Reusable animated card — progress bar, alert glow
│       ├── MapDisplay.tsx            # Leaflet GPS map with real-time vehicle marker
│       └── Footer.tsx                # Page footer
│
├── firebasewriter.cjs                # 🔧 One-time DB restore/reset script
│
├── watchdog.cjs                      # 🐕 System watchdog & monitoring script
├── index.html                        # Vite HTML entry
├── package.json                      # NPM config (includes concurrently setup)
├── vite.config.ts                    # Vite bundler config
├── tailwind.config.js                # Tailwind CSS v4 config
├── tsconfig.json                     # TypeScript config
└── vercel.json                       # Vercel deployment (SPA routing)
```

---

### Tech Stack & Packages

#### 🖥️ Frontend & AI Engine

| Package | Version | Purpose |
|---------|---------|---------| 
| `react` | 18.3 | Core UI library |
| `@mediapipe/tasks-vision` | 0.10.x | Industrial-grade 478-landmark face tracking |
| `typescript` | 5.6 | Strict type-safe telemetry handling |
| `vite` | 6.0 | Next-gen lightning-fast HMR & build engine |

#### 🎨 Anti-Gravity Design System

| Package | Version | Purpose |
|---------|---------|---------| 
| `tailwindcss` | 4.0 | Utility-first CSS framework (v4 Oxide Engine) |
| `framer-motion` | 11.x | 60FPS fluid micro-animations & state transitions |
| `lucide-react` | 0.460 | Premium vector iconography |
| `Glassmorphism` | Native | Backdrop-blur & border-glow design system |

#### 🗺️ Connectivity & Visualization

| Package | Version | Purpose |
|---------|---------|---------| 
| `firebase` | 12.9 | Realtime Database for sub-second telemetry sync |
| `leaflet` | 1.9 | High-performance interactive mapping |
| `react-hot-toast` | 2.6 | Low-latency emergency signaling system |
| `recharts` | 2.13 | High-fidelity biometric data visualization |

---

## 🗃️ Firebase Database Structure

The ESP32 uploads data in this **exact JSON format** to Firebase:

```json
{
  "accidentState": {
    "accident": {
      "detected": false,
      "severity": "SAFE"
    },
    "button_pressed": false,
    "button_raw": false,
    "evidence": {
      "cam1_url": "",
      "cam1_label": "Road Scene",
      "cam1_ready": false,
      "cam2_url": "",
      "cam2_label": "Driver Condition",
      "cam2_ready": false,
      "captured_at": 0,
      "accident_id": ""
    },
    "location": {
      "gps_fix": false,
      "latitude": 0,
      "longitude": 0
    },
    "online": true,
    "sensors": {
      "fire": false,
      "gas_leak": false,
      "gforce": 0.9,
      "temperature": 25.4,
      "tilt_angle": -1,
      "water_detected": false
    },
    "system": {
      "device_status": "ACTIVE",
      "gps_fix": false
    },
    "timestamp": 142,
    "vehicle_id": "VEHICLE_01"
  }
}
```

### Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `accident.detected` | `boolean` | `true` when a collision is confirmed |
| `accident.severity` | `string` | `"SAFE"` / `"MODERATE"` / `"CRITICAL"` |
| `button_pressed` | `boolean` | `true` when the 12-second reset latch is active (debounced, ESP32 timer) |
| `button_raw` | `boolean` | `true` when the physical button pin is held **right now** (raw GPIO state) |
| `evidence.cam1_url` | `string` | URL of the first camera evidence image |
| `evidence.cam1_label` | `string` | Label for the first camera (e.g., "Road Scene") |
| `evidence.cam1_ready` | `boolean` | `true` when camera 1 image is captured and uploaded |
| `evidence.cam2_url` | `string` | URL of the second camera evidence image |
| `evidence.cam2_label` | `string` | Label for the second camera (e.g., "Driver Condition") |
| `evidence.cam2_ready` | `boolean` | `true` when camera 2 image is captured and uploaded |
| `evidence.captured_at` | `number` | Unix timestamp of when the evidence was captured |
| `evidence.accident_id` | `string` | Unique identifier linking the evidence to an accident event |
| `location.latitude` | `number` | GPS latitude in decimal degrees |
| `location.longitude` | `number` | GPS longitude in decimal degrees |
| `location.gps_fix` | `boolean` | `true` when satellite lock is achieved |
| `online` | `boolean` | ESP32 live connectivity status |
| `sensors.fire` | `boolean` | Flame sensor triggered |
| `sensors.gas_leak` | `boolean` | MQ2 above toxic threshold |
| `sensors.gforce` | `number` | Impact force in G (MPU6050) |
| `sensors.temperature` | `number` | Temperature in °C (DHT11) |
| `sensors.tilt_angle` | `number` | Vehicle roll in degrees (MPU6050) |
| `sensors.water_detected` | `boolean` | Water submersion sensor |
| `timestamp` | `number` | Increments every ESP32 loop — heartbeat source |
| `vehicle_id` | `string` | Vehicle identifier |

> [!IMPORTANT]
> **PATCH vs PUT:** The ESP32 uses `PATCH` for sensor updates to prevent overwriting the `evidence` node created by the cameras. `PUT` is used only during an accident reset to clear old evidence and generate a new `accident_id`.

---

## 🔄 Data Flow — Step by Step

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPLETE DATA FLOW                        │
└─────────────────────────────────────────────────────────────┘

STEP 1 — ESP32 reads all sensors (every 100ms)
├── MPU6050    → G-force + tilt angle
├── DHT11      → Temperature
├── MQ2        → Gas level
├── Flame Snsr → Fire detection
├── Water Snsr → Submersion
└── NEO-M8N   → GPS coordinates

STEP 2 — ESP32 applies accident logic
├── gforce > 2.5G       → severity = MODERATE, detected = true
├── tilt > 45°          → severity = MODERATE, detected = true
└── gforce > 5.0G       → severity = CRITICAL, detected = true

STEP 3 — ESP32 generates JSON & uploads to Firebase (every ~1s)
└── HTTP PUT → /accidentState.json (ArduinoJson library)
    └── also increments timestamp counter

STEP 4 — Firebase RTDB updates instantly
└── Pushes the change to ALL connected clients in real-time

STEP 5 — Dashboard receives data (React onValue() listener)
├── Sensor cards update instantly (responsive grid)
├── GPS map repositions marker (Default: 14.2262, 79.1384)
├── Accident alerts trigger if detected = true
└── AI Pipeline triggers immediately:
    ├── Pre-processing (Upscale/Contrast/Sharpen)
    ├── Multi-pass detection (Face-API.js)
    ├── EAR + Landmark Analysis (Consciousness Check)
    ├── Custom Model Inference (Trained via Eye AI Trainer)
    └── Risk Fusion Engine (Rules 1-12) calculation
└── Evidence panel appears with real-time biometric metrics
└── Online/offline heartbeat badge updates
```

---

## 📶 Online / Offline Detection

The dashboard uses a **Firebase-push heartbeat strategy** — every time a new data snapshot arrives from Firebase, the `lastAdvance` timestamp is refreshed. If no update is received for **30 seconds**, the system declares the ESP32 offline.

> This is more reliable than comparing `timestamp` increments alone — it correctly handles cases where the ESP32 sends data without the timestamp value changing.

```
ESP32 ON  → Firebase push received → lastAdvance refreshed → ✅ ONLINE
ESP32 OFF → No push for 30s        → heartbeat timeout     → ❌ OFFLINE
ESP32 ON  → Firebase push received → lastAdvance refreshed → ✅ ONLINE
```

### In the UI (`App.tsx`) — Client-Side Detection

```ts
// On every Firebase snapshot — refresh lastAdvance regardless of timestamp value
const now = Date.now();
lastSeenRef.current = { ts: state.timestamp, lastAdvance: now };

// Every 1 second — check how long since a Firebase update was received
const timeSinceLastAdvance = (Date.now() - lastSeenRef.current.lastAdvance) / 1000;
const HEARTBEAT_TIMEOUT = 30;
setStatus(timeSinceLastAdvance < HEARTBEAT_TIMEOUT ? "ONLINE" : "OFFLINE");
```

**When offline:** All sensor cards immediately display zeros (not stale data), status badge turns red and pulses.

---

## ✨ Dashboard Features

### 🎛️ Live Sensor Cards (7 Cards)

| Card | Sensor | Alert Threshold |
|------|--------|-----------------|
| **Accident Shield** | `gforce`, `tilt`, `accident` | Any collision detected — shows `RESETTED` when button held |
| **Biometric Intel** | `AI Vision` | Consciousness Tracking (Rule 11) using EAR & Landmark Tracking |
| **Exposure HUB** | `Evidence Analysis` | Multi-source scrutinization (Firebase, Custom URL, Local Upload) |
| **Impact Force** | `gforce` (G) | > 2.5 G (Live IMU Streaming) |
| **Chassis Tilt** | `tilt_angle` (°) | > ±35° (Rollover Protection) |
| **Fire Sentinel** | `fire` | Optical flame-frequency detection |
| **Toxic Shield** | `gas_leak` | MQ2 calibration at toxic threshold |
| **LiquiGuard** | `water_detected` | Submersion detection |
| **Thermal Core** | `temperature` (°C) | > 50°C (Battery & Engine Health) |

Each card features: **Animated Micro-interactions** · **Dynamic Gradient Badges** · **Condition-based Glow** · **Responsive Layout**.

### 🔧 Hardware Debug Panel

A collapsible debug panel at the bottom of the sensor grid exposes raw hardware state:

| Debug Field | Description |
|-------------|-------------|
| **Button Latch** | Shows `TRUE` when the 12-second ESP32 timer latch is active |
| **Button Raw** | Shows `PRESSED` when the physical button is **currently held** (live GPIO pin) |

### 🚨 Emergency Alerts
- Full-screen ambient red glow on accident detection
- **3-Segment Severity Matrix**:
    | Level | Status | Description |
    |-------|--------|-------------|
    | 🛡️ **SECURE** | Emerald | All systems normal, driver conscious, environment safe |
    | ⚠️ **CAUTION** | Blue | Minor sensor deviation (e.g., slight tilt or temp rise) |
    | 🔸 **WARNING** | Amber | Potential risk (e.g., moderate G-force, low-confidence distress) |
    | 🔴 **CRITICAL** | Orange | Collision detected, high distress, or vehicle hazard |
    | 🔥 **EXTREME** | Rose | **EMERGENCY**: Unconscious victim or multi-hazard catastrophe |
- Browser Notification API — Native OS notifications
- Toast notifications for: accident, fire, gas leak, submersion, reset acknowledged, system cleared, online/offline

### 🗺️ GPS Map
- Interactive **Leaflet.js** map with live vehicle position
- Google Maps deep-link for navigation
- GPS lock status indicator

### 🌑 Anti-Gravity Pro Design (v2.0)
- **Dark-Mode Exclusive**: The dashboard is strictly designed for high-contrast nighttime visibility in vehicle cabins.
- **Glassmorphic Tokens**: UI components utilize `backdrop-blur-xl` and `bg-white/5` with neon borders.
- **Standardized Tokens**: Colors, spacing, and glows are driven by [theme.ts](file:///c:/Users/rabbu/Projects/Hardware_projects/Accident-Detection-System/src/constants/theme.ts).
- **Responsive Micro-interactions**: Hover-triggered glows and spring-physics transitions powered by Framer Motion.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- An active **ESP32-S3** with firmware targeting the correct Firebase URL
- A **Firebase project** with Realtime Database enabled

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/Accident-Detection-System.git
cd Accident-Detection-System

# 2. Install dependencies
npm install

# 3. Copy the env example and set your Firebase URL
cp .env.example .env
# Edit .env and set VITE_FIREBASE_DATABASE_URL and FIREBASE_DATABASE_URL

# 4. Start the dev server
npm run dev
```

The dashboard opens at **http://localhost:5173**

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite UI dev server |
| `npm start` | Start UI + Watchdog concurrently |
| `npm run build` | Build production bundle to `/dist` |
| `npm run preview` | Preview the production build locally |
| `node watchdog.cjs` | Run only the system watchdog |
| `node firebasewriter.cjs` | Reset Firebase DB to safe initial state |

---

## 🌐 Deployment

### Frontend → Vercel

```bash
npm run build
# Push to GitHub → Vercel auto-deploys
```

`vercel.json` is already configured for SPA routing.

> The UI's online/offline detection runs **client-side** in every browser — works perfectly on Vercel with no extra setup.

### ESP32 Firebase Endpoint

The ESP32 firmware must target your Firebase Realtime Database URL in this format:

```
https://<your-project-id>-default-rtdb.firebaseio.com/accidentState.json
```

Replace `<your-project-id>` with your own Firebase project ID. Method: `HTTP PUT` or `PATCH` with the JSON structure shown in [Firebase Database Structure](#-firebase-database-structure).

---

Built with ❤️ for the community · **LifeGuardX Pro Telemetry Dashboard**

Open source road safety — because every second counts.

*"Accidents NEVER go unnoticed. Victims NEVER stay without help."*
