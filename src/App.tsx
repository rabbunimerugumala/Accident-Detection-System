import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FirebaseData } from './types';

// Modular Components
import Header from './components/Header';
import EmergencyBanner from './components/EmergencyBanner';
import StatusCards from './components/StatusCards';
import SensorGrid from './components/SensorGrid';
import MapDisplay from './components/MapDisplay';
import Footer from './components/Footer';

const FIREBASE_URL = "https://accident-detection-syste-f7f23-default-rtdb.firebaseio.com/accidentState.json";

const INITIAL_STATE: FirebaseData['accidentState'] = {
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
        water_detected: false
    },
    system: { device_status: "INITIALIZING", gps_fix: false },
    timestamp: 0,
    vehicle_id: "VEHICLE_01"
};

const App: React.FC = () => {
    const [data, setData] = useState<FirebaseData['accidentState']>(INITIAL_STATE);
    const [status, setStatus] = useState("🔴 CONNECTING...");
    const [age, setAge] = useState(0);

    // Heartbeat logic: if timestamp hasn't changed for 10s, it's offline
    const lastSeenRef = useRef<{ ts: number, lastAdvance: number }>({ ts: -1, lastAdvance: Date.now() });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(FIREBASE_URL);
                const firebaseData: any = await response.json();

                if (firebaseData) {
                    // Handle double nesting check: root -> accidentState -> accidentState
                    const state = firebaseData.accidentState?.accidentState || firebaseData.accidentState || firebaseData;

                    if (state && typeof state === 'object' && 'timestamp' in state) {
                        const now = Date.now();
                        const rawTimestamp = state.timestamp;

                        // Heartbeat Tracking
                        if (rawTimestamp !== lastSeenRef.current.ts) {
                            lastSeenRef.current = { ts: rawTimestamp, lastAdvance: now };
                            console.log(`📡 [SYNC] Received NEW packet | TS: ${rawTimestamp} | Lat: ${state.location.latitude}`);
                        }

                        const timeSinceLastAdvance = (now - lastSeenRef.current.lastAdvance) / 1000;
                        const isUnix = rawTimestamp > 1000000000;
                        const espTimestamp = rawTimestamp * 1000;

                        let ageSeconds = 0;
                        // OFFLINE if stagnant for 10s (User requested 10s)
                        const HEARTBEAT_TIMEOUT = 10;
                        // User wants purely timestamp-based detection: ignore state.online
                        let isFresh = timeSinceLastAdvance < HEARTBEAT_TIMEOUT;

                        if (isUnix) {
                            ageSeconds = Math.round((now - espTimestamp) / 1000);
                            isFresh = isFresh && ageSeconds < HEARTBEAT_TIMEOUT;
                        } else {
                            ageSeconds = Math.round(timeSinceLastAdvance);
                        }

                        setAge(ageSeconds);
                        setData(state);

                        // Detailed debug info stays in console
                        if (isFresh) {
                            if (timeSinceLastAdvance > 2) {
                                console.warn(`⏳ [HEARTBEAT] Idle for ${Math.round(timeSinceLastAdvance)}s... (Timeout at 10s)`);
                            } else {
                                console.log(`🟢 [ACTIVE] Connection healthy | Age: ${ageSeconds}s`);
                            }
                        } else {
                            console.error(`🔴 [OFFLINE] 10s threshold reached | Idle for ${Math.round(timeSinceLastAdvance)}s`);
                        }

                        console.log(`📊 [STATE] Status: ${isFresh ? 'ONLINE' : 'OFFLINE'} | Packet Age: ${ageSeconds}s | Stale: ${Math.round(timeSinceLastAdvance)}s`);
                    }
                }
            } catch (error) {
                console.error("❌ Firebase fetch error:", error);
                setStatus("🔴 ERROR (DISCONNECTED)");
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, []);

    const isCritical = data.accident.severity === "CRITICAL" || data.sensors.gforce > 5;
    const isModerate = data.accident.severity === "MODERATE" || data.sensors.gforce > 2.5;
    const googleMapsUrl = `https://www.google.com/maps?q=${data.location.latitude},${data.location.longitude}`;

    return (
        <div className={`min-h-screen bg-background font-sans transition-colors duration-500 ${isCritical ? 'bg-red-50' : ''}`}>
            {/* CRITICAL OVERLAY */}
            <AnimatePresence>
                {isCritical && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-danger/10 pointer-events-none z-[100] border-[16px] border-danger/20 animate-pulse"
                    />
                )}
            </AnimatePresence>

            <Header vehicleId={data.vehicle_id} status={status} isCritical={isCritical} />

            <main className="max-w-7xl mx-auto p-4 space-y-4">
                <EmergencyBanner isCritical={isCritical} />
                <StatusCards data={data} isCritical={isCritical} isModerate={isModerate} />
                <SensorGrid data={data} age={age} googleMapsUrl={googleMapsUrl} />
                <MapDisplay latitude={data.location.latitude} longitude={data.location.longitude} />
                <Footer vehicleId={data.vehicle_id} systemStatus={data.system.device_status} />
            </main>
        </div>
    );
};

export default App;
