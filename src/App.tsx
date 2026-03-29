import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import toast, { Toaster } from 'react-hot-toast';
import { FirebaseData, VictimSeverityData } from './types';

// Modular Components
import Header from './components/Header';
import SensorGrid from './components/SensorGrid';
import MapDisplay from './components/MapDisplay';
import AIRiskAnalyzer from './components/AIRiskAnalyzer';
import Footer from './components/Footer';
// EmergencyBanner disabled for now
// import EmergencyBanner from './components/EmergencyBanner';

// Firebase Config — loaded from .env (never hardcoded)
const firebaseConfig = {
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const INITIAL_STATE: FirebaseData['accidentState'] = {
    accident: { detected: false, severity: "SAFE" },
    button_pressed: false,
    button_raw: false,
    evidence: {
        cam1_url: "",
        cam1_label: "Road Scene",
        cam1_ready: false,
        cam2_url: "",
        cam2_label: "Driver Condition",
        cam2_ready: false,
        captured_at: 0,
        accident_id: ""
    },
    location: { gps_fix: false, latitude: 0, longitude: 0 },
    online: false,
    sensors: {
        fire: false,
        gas_leak: false,
        gforce: 0,
        temperature: 0,
        tilt_angle: 0,
        water_detected: false
    },
    system: { device_status: "INITIALIZING", gps_fix: false },
    timestamp: 0,
    vehicle_id: "VEHICLE_01"
};

// Custom Hook to track previous values
function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T>(undefined);
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
}

const App: React.FC = () => {
    const [data, setData] = useState<FirebaseData['accidentState']>(INITIAL_STATE);
    const [status, setStatus] = useState("CONNECTING...");
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return true; // Default to dark for Pro version
    });

    const [biometricResult, setBiometricResult] = useState<VictimSeverityData | null>(null);

    const prevData = usePrevious(data);
    const lastSeenRef = useRef<{ ts: number, lastAdvance: number }>({ ts: -1, lastAdvance: Date.now() });

    // Theme Management
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);


    // Browser Notification Permission
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // Firebase Realtime Listener
    useEffect(() => {
        const accidentRef = ref(db, 'accidentState');

        const unsubscribe = onValue(accidentRef, (snapshot) => {
            const rawData = snapshot.val();
            if (rawData) {
                // Double nesting check
                const state = rawData.accidentState || rawData;

                if (state && typeof state === 'object' && 'timestamp' in state) {
                    // Critical Fix: Firebase data has `evidence` at the root of `rawData`, 
                    // not inside the nested `accidentState` node. We must merge it back in.
                    const mergedData = {
                        ...state,
                        evidence: rawData.evidence || INITIAL_STATE.evidence
                    };

                    setData(mergedData);
                    setStatus("ONLINE");

                    // Always refresh lastAdvance on ANY Firebase update.
                    // Previously only updated when timestamp changed — this caused
                    // false OFFLINE when ESP32 sent data without changing the timestamp.
                    const now = Date.now();
                    lastSeenRef.current = { ts: mergedData.timestamp, lastAdvance: now };
                }
            }
        }, (error) => {
            console.error("Firebase Error:", error);
            setStatus("ERROR");
            toast.error("Telemetry Connection Failed");
        });

        return () => unsubscribe();
    }, []);

    // Heartbeat & Age Logic
    useEffect(() => {
        const timer = setInterval(() => {
            const now = Date.now();
            const timeSinceLastAdvance = (now - lastSeenRef.current.lastAdvance) / 1000;
            // If the ESP32 sets online:true but timestamp hasn't advanced,
            // treat a fresh Firebase snapshot (within 30s) as alive.
            const HEARTBEAT_TIMEOUT = 30;

            const isFresh = timeSinceLastAdvance < HEARTBEAT_TIMEOUT;
            setStatus(isFresh ? "ONLINE" : "OFFLINE");
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Notifications Logic
    useEffect(() => {
        if (!prevData) return;

        const notify = (title: string, body: string, type: 'error' | 'warning' | 'success' = 'error') => {
            // In-app toast
            toast(title, {
                icon: type === 'error' ? '🚨' : (type === 'warning' ? '⚠️' : '✅'),
                duration: 6000,
                position: 'top-center',
                style: {
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    backdropFilter: 'blur(10px)',
                }
            });

            // Browser notification
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification(`LifeGuardX: ${title}`, { body });
            }
        };

        // Accident Detection
        if (data.accident.detected && !prevData.accident.detected) {
            notify(
                `CRITICAL ACCIDENT DETECTED`,
                `Severity: ${data.accident.severity}. G-Force: ${data.sensors.gforce.toFixed(2)}g at ${data.sensors.tilt_angle.toFixed(1)}° tilt.`
            );
        }

        // Hazard Sensors
        if (data.sensors.fire && !prevData.sensors.fire) notify("FIRE ALERT", "Smoke or Flame detected in vehicle!", 'error');
        if (data.sensors.gas_leak && !prevData.sensors.gas_leak) notify("GAS LEAK", "Dangerous gas levels detected!", 'error');
        if (data.sensors.water_detected && !prevData.sensors.water_detected) notify("SUBMERSION ALERT", "Vehicle water entry detected!", 'error');

        // Button Latch ON — reset acknowledged (only fires on false → true)
        if (data.button_pressed && !prevData.button_pressed) {
            notify("Reset Acknowledged", "Driver pressed reset. Accident data clears in ~12 seconds.", 'success');
        }
        // Button Latch OFF — system fully cleared
        if (!data.button_pressed && prevData.button_pressed && !data.accident.detected) {
            notify("System Cleared", "All clear — returning to normal monitoring.", 'success');
        }

        // Connectivity
        if (status === "OFFLINE" && (prevData as any).status !== "OFFLINE") {
            toast.error("Vehicle Signal Lost", { id: 'offline-toast' });
        } else if (status === "ONLINE" && (prevData as any).status === "OFFLINE") {
            toast.success("Vehicle Reconnected", { id: 'offline-toast' });
        }
    }, [data, status, prevData]);

    const isOnline = status === "ONLINE";
    const isCritical = isOnline && (data.accident.severity === "CRITICAL" || data.sensors.gforce > 5 || data.sensors.fire);

    return (
        <div className="min-h-screen">
            <Toaster position="top-center" />

            {/* AMBIENT ALERT GLOW */}
            <AnimatePresence>
                {isOnline && (data.accident.detected || data.sensors.fire) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 pointer-events-none z-0 bg-red-500/5 shadow-[inset_0_0_150px_rgba(239,68,68,0.3)] transition-colors duration-1000"
                    />
                )}
            </AnimatePresence>

            <div className="relative z-10">
                <Header
                    status={status}
                    isCritical={isCritical}
                    isDark={isDark}
                    onToggleTheme={() => setIsDark(!isDark)}
                    buttonPressed={data.button_pressed}
                    accidentDetected={data.accident.detected}
                />

                <main className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8 space-y-6">
                    {/* 1. TOP CARD (Accident Shield) */}
                    <SensorGrid 
                        data={data} 
                        status={status} 
                        buttonRaw={data.button_raw ?? false} 
                        showOnlyHero={true} 
                        onBiometricUpdate={setBiometricResult}
                    />

                    {/* AI RISK ANALYSIS ENGINE */}
                    <AIRiskAnalyzer data={data} biometricResult={biometricResult} status={status} />

                    {/* 2. MAP DISPLAY */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="px-2"
                    >
                        <MapDisplay
                            latitude={data.location.latitude}
                            longitude={data.location.longitude}
                            accidentDetected={data.accident.detected}
                            gpsFix={data.location.gps_fix}
                            status={status}
                        />
                    </motion.div>

                    {/* 3. BOTTOM SENSORS (Excluding Hero card) */}
                    <SensorGrid data={data} status={status} buttonRaw={data.button_raw ?? false} showOnlySensors={true} />
                </main>

                <Footer />
            </div>
        </div>
    );
};

export default App;

