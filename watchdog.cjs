/**
 * LifeGuardX - Firebase Timestamp Watchdog
 * 
 * This script watches the `timestamp` field in Firebase.
 * If the timestamp stops advancing for 10 seconds (ESP32 is offline),
 * it writes zeros/safe-defaults back to the database — same as the UI shows.
 * 
 * Run with: node watchdog.cjs
 */

const https = require('https');
require('dotenv').config();  // loads .env if present (optional, graceful if not installed)

// Load Firebase host from environment — set FIREBASE_DATABASE_URL in your .env
const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL;
if (!FIREBASE_DB_URL) {
    console.error('[Watchdog] ❌ FIREBASE_DATABASE_URL is not set. Add it to your .env file.');
    process.exit(1);
}
const FIREBASE_HOST = new URL(FIREBASE_DB_URL).hostname;

const HEARTBEAT_TIMEOUT_MS = 10000; // 10 seconds

let lastTimestamp = null;
let lastAdvanceTime = Date.now();
let isCurrentlyOffline = false;

// ─── Helpers ───────────────────────────────────────────────────────────────

function firebaseGet(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: FIREBASE_HOST,
            path: `${path}.json`,
            method: 'GET',
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function firebasePatch(path, payload) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(payload);
        const options = {
            hostname: FIREBASE_HOST,
            path: `${path}.json`,
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// ─── Zero-out payload (mirrors INITIAL_STATE in App.tsx) ──────────────────

const OFFLINE_STATE = {
    accident: { detected: false, severity: "SAFE" },
    location: { gps_fix: false, latitude: 0, longitude: 0 },
    online: false,
    sensors: {
        fire: false,
        gas_leak: false,
        gforce: 0,
        sound_level: 0,
        temperature: 0,
        tilt_angle: 0,
        water_detected: false,
    },
    system: { device_status: "OFFLINE", gps_fix: false },
    timestamp: 0,
};

// ─── Main watchdog loop ────────────────────────────────────────────────────

async function checkTimestamp() {
    try {
        // Read current data from DB
        const raw = await firebaseGet('/accidentState');
        // Handle double-nesting: { accidentState: { ... } } or flat { ... }
        const state = (raw && raw.accidentState) ? raw.accidentState : raw;

        if (!state || typeof state !== 'object') {
            console.warn('[Watchdog] No valid state found in DB.');
            return;
        }

        const currentTimestamp = state.timestamp;
        const now = Date.now();

        // Only treat a timestamp > 0 as a real 'alive' signal from the ESP32.
        // timestamp=0 is what WE write when zeroing — ignore it to avoid a loop.
        const isRealTimestamp = typeof currentTimestamp === 'number' && currentTimestamp > 0;

        if (isRealTimestamp && currentTimestamp !== lastTimestamp) {
            lastTimestamp = currentTimestamp;
            lastAdvanceTime = now;

            if (isCurrentlyOffline) {
                console.log(`\n[Watchdog] ✅ ESP32 is BACK ONLINE. Timestamp: ${currentTimestamp}. Writing online: true to DB...`);
                isCurrentlyOffline = false;

                // Write online: true back to DB so the database reflects the live status
                const writePath = (raw && raw.accidentState)
                    ? '/accidentState/accidentState'
                    : '/accidentState';

                await firebasePatch(writePath, { online: true });
                console.log('[Watchdog] ✅ DB updated: online = true');
            }
        }

        // Check how long since the timestamp last moved
        const staleDuration = (now - lastAdvanceTime) / 1000;

        if (!isCurrentlyOffline && staleDuration >= HEARTBEAT_TIMEOUT_MS / 1000) {
            console.log(`[Watchdog] ⚠️  Timestamp frozen for ${staleDuration.toFixed(1)}s — ESP32 OFFLINE. Writing zeros to DB...`);
            isCurrentlyOffline = true;

            // Determine the correct path (handle double-nesting)
            const writePath = (raw && raw.accidentState)
                ? '/accidentState/accidentState'
                : '/accidentState';

            await firebasePatch(writePath, OFFLINE_STATE);
            console.log('[Watchdog] ✅ DB zeroed successfully.');
        } else {
            const statusIcon = isCurrentlyOffline ? '❌' : '✅';
            const statusText = isCurrentlyOffline ? 'OFFLINE' : 'ONLINE';
            process.stdout.write(`\r[Watchdog] ${statusIcon} ${statusText} | Last TS: ${currentTimestamp} | Stale for: ${staleDuration.toFixed(1)}s   `);
        }

    } catch (err) {
        console.error('[Watchdog] ❌ Error reading Firebase:', err.message);
    }
}

// ─── Start ─────────────────────────────────────────────────────────────────

console.log('🛡️  LifeGuardX Watchdog Started');
console.log(`⏱️  Timeout: ${HEARTBEAT_TIMEOUT_MS / 1000}s — DB will be zeroed when ESP32 goes offline\n`);

// Run immediately, then every 1 second
checkTimestamp();
setInterval(checkTimestamp, 1000);
