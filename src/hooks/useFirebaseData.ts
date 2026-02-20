import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';

export interface FirebaseData {
    vehicle_id: string;
    timestamp: string;
    crash: boolean;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    location: {
        latitude: number;
        longitude: number;
        map_url: string;
    };
    sensors: {
        gforce: number;
        temperature: number;
        humidity: number;
        fire: boolean;
        gas_leak: boolean;
        water_detected: boolean;
    };
    hazards: {
        fire: string;
        gas: string;
        water: string;
        temperature: string;
    };
    system: {
        device_status: string;
        gps_fix: boolean;
    };
}

export function useFirebaseData() {
    const [data, setData] = useState<FirebaseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const accidentsRef = ref(db, 'accidents');
        console.log('Firebase: Listening to "accidents" at', db.app.options.databaseURL);

        // Using onValue for real-time updates
        const unsubscribe = onValue(accidentsRef, (snapshot) => {
            try {
                const val = snapshot.val();
                console.log('Firebase: Received data:', val);
                if (val) {
                    setData(val);
                } else {
                    console.warn('Firebase: Received null or empty data from "accidents"');
                }
                setLoading(false);
            } catch (err) {
                console.error('Firebase: Error parsing data:', err);
                setError(err as Error);
                setLoading(false);
            }
        }, (err) => {
            console.error('Firebase: Subscription error:', err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { data, loading, error };
}
