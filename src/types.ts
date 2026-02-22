export interface FirebaseData {
    accidentState: {
        accident: {
            detected: boolean;
            severity: "SAFE" | "MODERATE" | "CRITICAL";
        };
        location: {
            gps_fix: boolean;
            latitude: number;
            longitude: number;
        };
        online: boolean;
        sensors: {
            fire: boolean;
            gas_leak: boolean;
            gforce: number;
            sound_level: number;
            temperature: number;
            tilt_angle: number;
            water_detected: boolean;
        };
        system: {
            device_status: string;
            gps_fix: boolean;
        };
        timestamp: number;
        vehicle_id: string;
    };
}
