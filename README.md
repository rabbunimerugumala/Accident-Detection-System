# 🛡️ LifeGuardX
### Intelligent Accident Detection & Real-Time Telemetry System

![ESP32-S3](https://img.shields.io/badge/ESP32--S3-Firmware-E7352C?logo=espressif&logoColor=white&style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white&style=for-the-badge)
![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?logo=firebase&logoColor=black&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white&style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white&style=for-the-badge)

> *"Detect the accident instantly, alert immediately, save the life before it's too late."*

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
| **Automatically detect when something goes wrong** | Monitors crash, fall, dangerous tilt, gas leak, fire, water hazard, and abnormal vibration 24/7 |
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
| ✔ **Hardware Unit** | Monitors temperature, gas, tilt, G-force, fire, water, sound, and GPS |
| ✔ **Cloud System** | Firebase Realtime Database — stores and syncs vehicle data instantly |
| ✔ **Web Dashboard** | Displays live telemetry, maps, accident alerts, and sensor analysis |
| ✔ **Online/Offline Detection** | Timestamp heartbeat logic — knows exactly when ESP32 goes offline |
| ✔ **Real-Time Emergency Trigger** | Dashboard receives accident alerts the instant they are detected |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                             LIFEGUARDX SYSTEM                                │
│                                                                              │
│  ┌─────────────────────────────┐                                             │
│  │       HARDWARE LAYER        │                                             │
│  │                             │                                             │
│  │  Sensors → ESP32-S3 →WiFi──┼──────────────────────────────────────────┐  │
│  │  (reads every 100ms)        │                                          │  │
│  │  (uploads every ~1s)        │                                          ▼  │
│  └─────────────────────────────┘                                             │
│                                                                              │
│  ┌─────────────────────────────┐      ┌──────────────────────────────────┐  │
│  │       CLOUD LAYER           │      │       SOFTWARE LAYER              │  │
│  │                             │      │                                   │  │
│  │  Firebase Realtime DB       │─Push─▶  React Dashboard (Browser)       │  │
│  │  /accidentState             │      │  - Live sensor cards              │  │
│  │                             │      │  - GPS Map (Leaflet)              │  │
│  │  Instant push updates       │      │  - Accident alerts (Toast)        │  │
│  │  to all connected clients   │      │  - Online/Offline detection       │  │
│  │                             │      │  - Dark / Light mode              │  │
│  └─────────────────────────────┘      └──────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔩 Hardware Part

### Components List

| # | Component | Model | Purpose |
|---|-----------|-------|---------|
| 1 | **Microcontroller** | ESP32-S3 N16R8 | Main controller — WiFi, processing, sensor I/O |
| 2 | **Temperature Sensor** | DHT11 | Monitor vehicle/ambient temperature |
| 3 | **Gas Sensor** | MQ2 | Detect fuel/LPG/smoke gas leaks |
| 4 | **Flame Sensor** | Digital Flame Sensor | Detect fire or high heat |
| 5 | **Water Sensor** | Analog Water Level | Detect vehicle submersion / flooding |
| 6 | **Sound Sensor** | Analog Microphone Module | Detect abnormal collision noise |
| 7 | **IMU (Crash Detector)** | MPU6050 | Detect G-force impact, tilt, and rollover |
| 8 | **GPS Module** | NEO-M8N | Track real-time vehicle location |
| 9 | **Display** | 16×2 I2C LCD | Show system status locally |
| 10 | **Buzzer** | Active Buzzer | Emergency audio alarm |
| 11 | **LED** | Standard LED | Visual status indicator |
| 12 | **Reset Button** | Tactile Push Button | Manual accident reset |

---

### Pin Connection Table

| Module | Signal | ESP32 Pin |
|--------|--------|-----------|
| **DHT11** | DATA | GPIO 40 |
| **MQ2 Gas Sensor** | AO (Analog Out) | GPIO 5 |
| **Flame Sensor** | DO (Digital Out) | GPIO 6 *(LOW = fire detected)* |
| **Water Sensor** | AO (Analog Out) | GPIO 10 *(> 1000 = wet)* |
| **Sound Sensor** | AO (Analog Out) | GPIO 3 |
| **MPU6050** | SDA | GPIO 8 |
| **MPU6050** | SCL | GPIO 9 |
| **LCD I2C (16×2)** | SDA | GPIO 4 |
| **LCD I2C (16×2)** | SCL | GPIO 7 |
| **NEO-M8N GPS** | TX → ESP32 RX | GPIO 18 |
| **NEO-M8N GPS** | RX → ESP32 TX | GPIO 17 |
| **Buzzer** | Signal | GPIO 11 |
| **Reset Button** | Signal | GPIO 12 |
| **LED** | Anode | GPIO 2 |

---

### Accident Detection Logic (Firmware)

The ESP32 firmware uses these thresholds to classify accidents:

| Condition | Threshold | Severity |
|-----------|-----------|----------|
| G-Force impact | > 2.5 G | `MODERATE` |
| Vehicle tilt | > 45° | `MODERATE` (Rollover risk) |
| G-Force impact | > 5.0 G | `CRITICAL` |
| Fire detected | Sensor LOW | Hazard alert |
| Gas leak | Analog > threshold | Hazard alert |
| Water entry | Analog > 1000 | Hazard alert |

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
│       ├── Header.tsx                # Sticky header — branding, online/offline badge, theme toggle
│       ├── SensorGrid.tsx            # 8-card responsive sensor display grid
│       ├── SensorCard.tsx            # Reusable animated card — progress bar, alert glow
│       ├── EmergencyBanner.tsx       # Live command center bar (GPS, stability, handshake)
│       ├── MapDisplay.tsx            # Leaflet GPS map with real-time vehicle marker
│       ├── StatusCards.tsx           # Vehicle/system status summary
│       └── Footer.tsx                # Page footer
│
├── firebasewriter.cjs                # 🔧 One-time DB restore/reset script
│
├── index.html                        # Vite HTML entry
├── package.json                      # NPM config, scripts, dependencies
├── vite.config.ts                    # Vite bundler config
├── tailwind.config.js                # Tailwind CSS config
├── tsconfig.json                     # TypeScript config
└── vercel.json                       # Vercel deployment (SPA routing)
```

---

### Tech Stack & Packages

#### 🖥️ Frontend Framework

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 18.3 | Core UI library |
| `react-dom` | 18.3 | DOM rendering |
| `typescript` | 5.6 | Type safety — zero runtime type errors |
| `vite` | 6.0 | Fast dev server & optimized production builds |

#### 🎨 Design System

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | 4.0 | Utility-first CSS framework |
| `lucide-react` | 0.460 | Clean, consistent sensor icons |
| Custom CSS Variables | — | Glassmorphism UI, dark/light semantic tokens |

#### ✨ Animations & Notifications

| Package | Version | Purpose |
|---------|---------|---------|
| `framer-motion` | 11.x | Smooth entrance animations, card transitions, alert glows |
| `react-hot-toast` | 2.6 | In-app alert toasts (accident, fire, gas, offline) |

#### 🗺️ Visualization

| Package | Version | Purpose |
|---------|---------|---------|
| `leaflet` | 1.9 | Interactive GPS map with live vehicle marker |
| `@react-google-maps/api` | 2.20 | Google Maps integration |
| `recharts` | 2.13 | Sensor data charts/graphs |

#### ☁️ Backend / Cloud

| Package | Version | Purpose |
|---------|---------|---------|
| `firebase` | 12.9 | Realtime Database SDK — instant push updates |

#### 🛠️ Utilities & Build

| Package | Version | Purpose |
|---------|---------|---------|
| `clsx` | 2.1 | Conditional CSS class names |
| `tailwind-merge` | 2.5 | Merge conflicting Tailwind classes |
| `autoprefixer` | 10.4 | CSS vendor prefix compatibility |
| `postcss` | 8.4 | CSS processing pipeline |

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
    "sound_level": 4095,
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
| `location.latitude` | `number` | GPS latitude in decimal degrees |
| `location.longitude` | `number` | GPS longitude in decimal degrees |
| `location.gps_fix` | `boolean` | `true` when satellite lock is achieved |
| `online` | `boolean` | ESP32 live connectivity status |
| `sensors.fire` | `boolean` | Flame sensor triggered |
| `sensors.gas_leak` | `boolean` | MQ2 above toxic threshold |
| `sensors.gforce` | `number` | Impact force in G (MPU6050) |
| `sensors.sound_level` | `number` | Ambient sound (0–4095 ADC range) |
| `sensors.temperature` | `number` | Temperature in °C |
| `sensors.tilt_angle` | `number` | Vehicle roll in degrees |
| `sensors.water_detected` | `boolean` | Water submersion sensor |
| `timestamp` | `number` | Increments every ESP32 loop — heartbeat counter |
| `vehicle_id` | `string` | Vehicle identifier |

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
├── Sound Snsr → Ambient noise
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
├── Sensor cards update instantly
├── GPS map repositions marker
├── Accident alerts trigger if detected = true
└── Online/offline badge updates

```

---

## 📶 Online / Offline Detection

The system uses a **timestamp heartbeat strategy** — not just a simple `online: true` flag — because if the ESP32 loses power abruptly, it cannot set `online: false`. The `timestamp` naturally stops incrementing when the ESP is off.

```
ESP32 ON  → timestamp: 142 → 143 → 144 → isFresh = true  → ✅ ONLINE
ESP32 OFF → timestamp: frozen at 144           → after 10s → ❌ OFFLINE
ESP32 ON  → timestamp: 145 → 146 → 147 → isFresh = true  → ✅ ONLINE
```

### In the UI (`App.tsx`) — Client-Side Detection

```ts
// Track when timestamp last moved
if (state.timestamp !== lastSeenRef.current.ts) {
lastSeenRef.current = { ts: state.timestamp, lastAdvance: Date.now() };
}

// Every 1 second — check how long since timestamp moved
const timeSinceLastAdvance = (Date.now() - lastSeenRef.current.lastAdvance) / 1000;
setStatus(timeSinceLastAdvance < 10 ? "ONLINE" : "OFFLINE");
```

**When offline:** All sensor cards immediately display zeros (not stale data), status badge turns red and pulses.

---

## ✨ Dashboard Features

### 🎛️ Live Sensor Cards (8 Cards)

| Card | Sensor | Alert Threshold |
|------|--------|-----------------|
| **Accident Shield** | `gforce`, `tilt`, `accident` | Any collision detected |
| **Impact Force** | `gforce` (G) | > 2.5 G |
| **Chassis Tilt** | `tilt_angle` (°) | > ±35° |
| **Fire Sentinel** | `fire` | Triggered |
| **Atmosphere** | `gas_leak` | Triggered |
| **Submersion** | `water_detected` | Triggered |
| **Acoustics** | `sound_level` (%) | Display only |
| **Thermal Core** | `temperature` (°C) | > 50°C |

Each card has: animated progress bar · color-coded status badge · neon alert glow · Framer Motion animation

### 🚨 Emergency Alerts
- Full-screen ambient red glow on accident detection
- 3-segment severity matrix: `SAFE → MODERATE → CRITICAL`
- Browser Notification API — native OS notifications
- Toast notifications for: accident, fire, gas leak, submersion, online/offline

### 🗺️ GPS Map
- Interactive **Leaflet.js** map with live vehicle position
- Google Maps deep-link for navigation
- GPS lock status indicator

### 🌓 Dark / Light Mode
- Full dark & light theme via CSS variables
- Preference saved to `localStorage` — persists sessions
- Defaults to dark mode

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

# 3. Start the dev server
npm run dev
```

The dashboard opens at **http://localhost:5173**

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite UI dev server |
| `npm run build` | Build production bundle to `/dist` |
| `npm run preview` | Preview the production build locally |
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
