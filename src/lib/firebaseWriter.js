import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, update, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "https://accident-detection-syste-f7f23-default-rtdb.firebaseio.com",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

/**
 * Updates the accident state in Firebase.
 * Only update fields present in the final JSON model.
 * @param {Object} data 
 */
export async function updateAccidentState(data) {
  const accidentsRef = ref(db, "accidents");
  await update(accidentsRef, data);
}

/**
 * Resets the database to the canonical LifeGuardX structure.
 * This completely removes any fields not in the template.
 */
export async function resetDatabase() {
  const accidentsRef = ref(db, "accidents");

  await set(accidentsRef, {
    vehicle_id: "VEHICLE_01",
    timestamp: 0,
    online: false,

    sensors: {
      temperature: 0,
      gforce: 0,
      tilt_angle: 0,
      sound_level: 0,
      fire: false,
      gas_leak: false,
      water_detected: false
    },

    location: {
      latitude: 0,
      longitude: 0,
      gps_fix: false
    },

    accident: {
      detected: false,
      severity: "SAFE"
    },

    system: {
      device_status: "OFFLINE",
      gps_fix: false
    }
  });
}

// Automatically run the reset function once
resetDatabase()
  .then(() => console.log("Firebase reset to LifeGuardX final JSON format"))
  .catch(err => console.error("Error resetting DB:", err));
