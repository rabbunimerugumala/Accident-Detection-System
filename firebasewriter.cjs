const https = require('https');
require('dotenv').config();  // loads .env if present

// Load Firebase URL from environment — set FIREBASE_DATABASE_URL in your .env
const dbUrl = process.env.FIREBASE_DATABASE_URL;
if (!dbUrl) {
    console.error('❌ FIREBASE_DATABASE_URL is not set. Add it to your .env file.');
    process.exit(1);
}
const FIREBASE_URL = dbUrl.replace(/\/?$/, '/.json');

// User requested this format: { "accidentState": { ... } }
const DATA_TO_WRITE = {
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
        "online": false,
        "sensors": {
            "fire": false,
            "gas_leak": false,
            "gforce": 0,
            "sound_level": 0,
            "temperature": 0,
            "tilt_angle": 0,
            "water_detected": false
        },
        "system": {
            "device_status": "OFFLINE",
            "gps_fix": false
        },
        "timestamp": 0,
        "vehicle_id": "VEHICLE_01"
    }
};

const url = new URL(FIREBASE_URL);
const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
};

console.log("🚀 Restoring LifeGuardX Firebase Database...");
console.log(`📡 Targeting: ${FIREBASE_URL}`);

const req = https.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => { responseData += chunk; });
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log("✅ Database restored successfully!");
            console.log("📄 Response:", responseData);
        } else {
            console.error(`❌ Failed with status: ${res.statusCode}`);
            console.error("📄 Response:", responseData);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Connection Error: ${e.message}`);
});

req.write(JSON.stringify(DATA_TO_WRITE));
req.end();
