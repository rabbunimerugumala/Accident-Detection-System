import { useState, useEffect, useMemo } from 'react';
import { AccidentState, listenToFirebaseChanges, DEFAULT_STATE } from '../lib/accidentService';

export interface AlertNotification {
    id: string;
    message: string;
    timestamp: string;
    type: string;
    severity: 'SAFE' | 'WARNING' | 'DANGER' | 'CRITICAL';
}

/**
 * useAccidentState Hook
 * 
 * Provides a unified, production-ready interface for the dashboard to consume 
 * real-time accident telemetry.
 */
export function useAccidentState() {
    const [data, setData] = useState<AccidentState>(DEFAULT_STATE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [alerts, setAlerts] = useState<AlertNotification[]>([]);
    const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);

    // Subscribe to Firebase changes
    useEffect(() => {
        const unsubscribe = listenToFirebaseChanges(
            (newState) => {
                setData(newState);
                setLastUpdateTime(Date.now());
                setLoading(false);
                setError(null);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // Derived properties: Online Status & Severity
    const { processedData, isOnline, severity } = useMemo(() => {
        const now = Date.now();

        // ONLINE STATUS RULES:
        // 1. If accidentState.online === true -> Show ONLINE (green)
        // 2. If no data for >5 seconds -> Show OFFLINE (red)
        const isTimeFresh = lastUpdateTime > 0 && (now - lastUpdateTime < 5000);

        const onlineState = data.online && isTimeFresh;

        // Aggregate Severity from Sensors
        const s = data.sensors || {};
        const a = data.accident || {};

        let localSeverity: 'SAFE' | 'WARNING' | 'DANGER' | 'CRITICAL' = 'SAFE';

        // Severity Logic Aggregation
        if (s.temperature > 70 || s.gforce > 3 || a.detected || data.accident.severity === 'CRITICAL') {
            localSeverity = 'CRITICAL';
        } else if (s.fire || s.gas_leak || data.accident.severity === 'DANGER') {
            localSeverity = 'DANGER';
        } else if (Math.abs(s.tilt_angle) > 65 || s.water_detected || data.accident.severity === 'WARNING') {
            localSeverity = 'WARNING';
        }

        const finalSeverity = onlineState ? localSeverity : 'SAFE';

        // If offline, override fields for UI (as per requirements)
        const finalData: AccidentState = onlineState ? data : {
            ...data,
            online: false,
            system: {
                ...data.system,
                device_status: "OFFLINE"
            },
            location: {
                ...data.location,
                gps_fix: false // Trigger "Waiting for GPS" logic
            }
        };

        return {
            processedData: finalData,
            isOnline: onlineState,
            severity: finalSeverity
        };
    }, [data, lastUpdateTime]);

    // Emergency Alert Logic
    useEffect(() => {
        if (!isOnline) return;

        const newAlerts: AlertNotification[] = [];
        const timeStr = new Date().toLocaleTimeString();

        // 6️⃣ ACCIDENT SEVERITY LOGIC
        if (data.accident.detected || severity === "CRITICAL") {
            newAlerts.push({
                id: `accident-${Date.now()}`,
                message: "CRITICAL ALERT: Emergency protocol initiated.",
                timestamp: timeStr,
                type: "ACCIDENT",
                severity: "CRITICAL"
            });
        } else if (severity === "DANGER") {
            newAlerts.push({
                id: `hazard-danger-${Date.now()}`,
                message: "DANGER detected in system sensors.",
                timestamp: timeStr,
                type: "HAZARD",
                severity: "DANGER"
            });
        } else if (severity === "WARNING") {
            newAlerts.push({
                id: `hazard-warning-${Date.now()}`,
                message: "System warning: Checking sensor integrity...",
                timestamp: timeStr,
                type: "HAZARD",
                severity: "WARNING"
            });
        }

        if (newAlerts.length > 0) {
            setAlerts(prev => {
                // Prevent duplicate consecutive alerts
                if (prev.length > 0 && prev[0].message === newAlerts[0].message) return prev;
                return [...newAlerts, ...prev].slice(0, 10);
            });
        }
    }, [data.accident.detected, severity, isOnline]);

    const acknowledgeAll = () => setAlerts([]);

    return {
        data: processedData,
        isOnline,
        severity,
        loading,
        error,
        alerts,
        acknowledgeAll
    };
}
