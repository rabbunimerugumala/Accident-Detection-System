import { ref, get, set, onValue, off } from "firebase/database";
import { db } from "./firebase";

export interface AccidentState {
    vehicle_id: string;
    timestamp: number;
    online: boolean;
    sensors: {
        temperature: number;
        gforce: number;
        tilt_angle: number;
        fire: boolean;
        gas_leak: boolean;
        water_detected: boolean;
    };
    location: {
        latitude: number;
        longitude: number;
        gps_fix: boolean;
    };
    accident: {
        detected: boolean;
        severity: 'SAFE' | 'WARNING' | 'DANGER' | 'CRITICAL';
    };
    system: {
        device_status: string;
        gps_fix: boolean;
    };
}

export const DEFAULT_STATE: AccidentState = {
    vehicle_id: "VEHICLE_01",
    timestamp: 0,
    online: false,
    sensors: {
        temperature: 0,
        gforce: 0,
        tilt_angle: 0,
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
        device_status: "INITIALIZING",
        gps_fix: false
    }
};

const DB_PATH = "accidentState";

/**
 * Fetches the current accident state once.
 * If data is null, initializes it with default values.
 */
export async function fetchAccidentState(): Promise<AccidentState> {
    const stateRef = ref(db, DB_PATH);
    const snapshot = await get(stateRef);
    if (!snapshot.exists()) {
        await createDefaultStateIfNull();
        return DEFAULT_STATE;
    }
    return validateAndNormalize(snapshot.val());
}

/**
 * Subscribes to real-time updates from Firebase.
 * Automatically handles null state by initializing default values.
 */
export function listenToFirebaseChanges(
    callback: (data: AccidentState) => void,
    onError: (error: Error) => void
) {
    const stateRef = ref(db, DB_PATH);
    const listener = onValue(stateRef, (snapshot) => {
        if (!snapshot.exists()) {
            createDefaultStateIfNull();
            callback(DEFAULT_STATE);
        } else {
            callback(validateAndNormalize(snapshot.val()));
        }
    }, (error) => {
        onError(error);
    });

    return () => off(stateRef, "value", listener);
}

/**
 * Ensures the database is not empty by creating a default object if null.
 */
export async function createDefaultStateIfNull() {
    const stateRef = ref(db, DB_PATH);
    const snapshot = await get(stateRef);
    if (!snapshot.exists()) {
        try {
            await set(stateRef, DEFAULT_STATE);
        } catch (err) {
            console.error("Failed to initialize database:", err);
        }
    }
}

/**
 * Validates and normalizes raw Firebase data into the AccidentState model.
 * Handles missing fields and ensures correct types to prevent crashes.
 */
export function validateAndNormalize(raw: any): AccidentState {
    if (!raw) return DEFAULT_STATE;

    const safeNum = (v: any) => {
        const n = Number(v);
        return !isNaN(n) ? n : 0;
    };

    const safeBool = (v: any) => (typeof v === 'boolean' ? v : !!v);

    return {
        vehicle_id: raw.vehicle_id || DEFAULT_STATE.vehicle_id,
        timestamp: safeNum(raw.timestamp),
        online: safeBool(raw.online),
        sensors: {
            temperature: safeNum(raw.sensors?.temperature),
            gforce: safeNum(raw.sensors?.gforce),
            tilt_angle: safeNum(raw.sensors?.tilt_angle),
            fire: safeBool(raw.sensors?.fire),
            gas_leak: safeBool(raw.sensors?.gas_leak),
            water_detected: safeBool(raw.sensors?.water_detected)
        },
        location: {
            latitude: safeNum(raw.location?.latitude),
            longitude: safeNum(raw.location?.longitude),
            gps_fix: safeBool(raw.location?.gps_fix)
        },
        accident: {
            detected: safeBool(raw.accident?.detected),
            severity: ["SAFE", "WARNING", "DANGER", "CRITICAL"].includes(raw.accident?.severity)
                ? raw.accident.severity
                : "SAFE"
        },
        system: {
            device_status: raw.system?.device_status || "UNKNOWN",
            gps_fix: safeBool(raw.system?.gps_fix)
        }
    };
}
