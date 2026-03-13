export interface Evidence {
    cam1_url: string;
    cam1_label: string;
    cam1_ready: boolean;
    cam2_url: string;
    cam2_label: string;
    cam2_ready: boolean;
    captured_at: number;
    accident_id: string;
}

export interface FirebaseData {
    accidentState: {
        accident: {
            detected: boolean;
            severity: "SAFE" | "MODERATE" | "CRITICAL";
        };
        button_pressed: boolean;
        button_raw: boolean;
        evidence: Evidence;
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
