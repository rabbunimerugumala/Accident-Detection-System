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
            // gas_leak: boolean;
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

export interface FaceExpressions {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

export interface VictimSeverityData {
  severity: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH';
  consciousness: 'CONSCIOUS' | 'UNCONSCIOUS' | 'UNCERTAIN';
  eyeStatus: 'OPEN' | 'CLOSED' | 'BLINKING' | 'UNKNOWN';
  expressions: FaceExpressions | null;
  confidence: number;
  accuracy: number;
  analyzing: boolean;
  timestamp: number;
  error?: string;
  landmarks?: any;
}

export interface AIAnalysisResult {
  riskScore: number;           // 0.0 to 1.0
  situation: string;           // human readable situation
  confidence: number;          // 0.85 to 0.97
  inferenceMs: number;         // actual inference time
  activeRules: string[];       // which fusion rules fired
  sensorWeights: {
    name: string;
    normalizedValue: number;   // 0-1
    weight: number;            // effective weight after rule exclusions
    suppressed: boolean;       // true if rule excluded this sensor
    suppressReason?: string;   // why it was suppressed
  }[];
}
