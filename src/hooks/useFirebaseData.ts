import { useEffect, useState, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';

export interface FirebaseDataState {
    vehicle_id: string;
    timestamp: number;
    online: boolean;
    accident: {
        detected: boolean;
        severity: "SAFE" | "DANGER" | "CRITICAL";
    };
    location: {
        latitude: number;
        longitude: number;
        gps_fix: boolean;
    };
    sensors: {
        temperature: number;
        gforce: number;
        tilt_angle: number;
        sound_level: number;
        fire: boolean;
        gas_leak: boolean;
        water_detected: boolean;
    };
    hazards: {
        temperature: string;
        impact: string;
        tilt: string;
        sound: string;
        fire: string;
        gas: string;
        water: string;
    };
    system: {
        device_status: string;
        gps_fix: boolean;
    };
}

export interface AlertNotification {
    id: string;
    message: string;
    timestamp: string;
    severity: 'SAFE' | 'WARNING' | 'DANGER' | 'CRITICAL';
}

const safeValue = (v: any) => (v === undefined || v === null || Number.isNaN(Number(v)) ? 0 : Number(v));
const safeBool = (v: any) => (v === undefined || v === null ? false : !!v);

function getHazardLevels(s: FirebaseDataState['sensors']) {
    return {
        temperature: s.temperature > 70 ? "CRITICAL" :
            s.temperature > 50 ? "DANGER" :
                s.temperature > 35 ? "WARNING" : "SAFE",

        impact: s.gforce > 4.5 ? "CRITICAL" :
            s.gforce > 3.0 ? "DANGER" :
                s.gforce > 1.8 ? "WARNING" : "SAFE",

        tilt: Math.abs(s.tilt_angle) > 65 ? "CRITICAL" :
            Math.abs(s.tilt_angle) > 45 ? "DANGER" :
                Math.abs(s.tilt_angle) > 25 ? "WARNING" : "SAFE",

        sound: s.sound_level > 2000 ? "CRITICAL" :
            s.sound_level > 1200 ? "DANGER" :
                s.sound_level > 700 ? "WARNING" : "SAFE",

        fire: s.fire ? "CRITICAL" : "SAFE",
        gas: s.gas_leak ? "CRITICAL" : "SAFE",
        water: s.water_detected ? "CRITICAL" : "SAFE"
    };
}

function getAccidentSeverity(h: any): "SAFE" | "DANGER" | "CRITICAL" {
    if (h.impact === "CRITICAL" || h.tilt === "CRITICAL") return "CRITICAL";
    if (h.impact === "DANGER" || h.tilt === "DANGER") return "DANGER";
    if (h.fire === "CRITICAL" || h.water === "CRITICAL" || h.gas === "CRITICAL") return "CRITICAL";
    return "SAFE";
}

const zeroState = (): FirebaseDataState => ({
    vehicle_id: "VEHICLE_01",
    timestamp: 0,
    online: false,
    accident: {
        detected: false,
        severity: "SAFE"
    },
    location: {
        latitude: 0,
        longitude: 0,
        gps_fix: false
    },
    sensors: {
        temperature: 0,
        gforce: 0,
        tilt_angle: 0,
        sound_level: 0,
        fire: false,
        gas_leak: false,
        water_detected: false
    },
    hazards: {
        temperature: "SAFE",
        impact: "SAFE",
        tilt: "SAFE",
        sound: "SAFE",
        fire: "SAFE",
        gas: "SAFE",
        water: "SAFE"
    },
    system: {
        device_status: "OFFLINE",
        gps_fix: false
    }
});

function normalize(raw: any): FirebaseDataState {
    if (!raw) return zeroState();

    const sensors = {
        temperature: safeValue(raw.sensors?.temperature),
        gforce: safeValue(raw.sensors?.gforce),
        tilt_angle: safeValue(raw.sensors?.tilt_angle),
        sound_level: safeValue(raw.sensors?.sound_level),
        fire: safeBool(raw.sensors?.fire),
        gas_leak: safeBool(raw.sensors?.gas_leak),
        water_detected: safeBool(raw.sensors?.water_detected)
    };

    const recalculatedHazards = getHazardLevels(sensors);
    const calculatedSeverity = getAccidentSeverity(recalculatedHazards);

    return {
        vehicle_id: raw.vehicle_id || "VEHICLE_01",
        timestamp: safeValue(raw.timestamp),
        online: safeBool(raw.online),
        accident: {
            detected: safeBool(raw.accident?.detected) || calculatedSeverity !== "SAFE",
            severity: calculatedSeverity
        },
        location: {
            latitude: safeValue(raw.location?.latitude),
            longitude: safeValue(raw.location?.longitude),
            gps_fix: safeBool(raw.location?.gps_fix)
        },
        sensors,
        hazards: recalculatedHazards,
        system: {
            device_status: raw.system?.device_status || (raw.timestamp ? "MONITORING" : "OFFLINE"),
            gps_fix: safeBool(raw.system?.gps_fix)
        }
    };
}

export function useFirebaseData() {
    const [rawState, setRawState] = useState<any>(null);
    const [alerts, setAlerts] = useState<AlertNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const accidentsRef = ref(db, 'accidents');
        const unsubscribe = onValue(accidentsRef, (snapshot) => {
            try {
                const data = snapshot.val();

                if (!data) {
                    setRawState(null);
                } else {
                    setRawState(data);

                    if (data.accident?.detected) {
                        const nowStr = new Date().toLocaleTimeString();
                        setAlerts(prev => {
                            if (prev.length > 0 && prev[0].message.includes('ACCIDENT')) return prev;
                            return [{
                                id: `accident-${Date.now()}`,
                                message: 'ACCIDENT DETECTED: Immediate Attention Required!',
                                timestamp: nowStr,
                                severity: 'CRITICAL' as const
                            }, ...prev].slice(0, 5);
                        });
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error('Firebase Hook Error:', err);
                setError(err as Error);
                setLoading(false);
            }
        }, (err) => {
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const state = useMemo(() => {
        const normalized = normalize(rawState);
        const now = Date.now();
        const isOnline = (now - normalized.timestamp < 5000) && normalized.timestamp !== 0;

        // If offline, revert to zeroState (as requested: "offline -> frozen" but code also says "normalize missing values")
        // The user says "ESP OFF -> dashboard shows offline, values frozen". 
        // My previous logic was snapping to zeroState on offline. 
        // I'll keep the snapshot but set isOnline false.

        return {
            ...normalized,
            isOnline,
            alerts: isOnline ? alerts : []
        };
    }, [rawState, alerts]);

    const acknowledgeAll = () => {
        setAlerts([]);
    };

    return { ...state, loading, error, acknowledgeAll };
}
