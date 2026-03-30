export type SeverityLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH';

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
  severity: SeverityLevel;
  consciousness: 'CONSCIOUS' | 'UNCONSCIOUS' | 'UNCERTAIN';
  eyeStatus: 'OPEN' | 'CLOSED' | 'BLINKING' | 'UNKNOWN';
  expressions: FaceExpressions | null;
  confidence: number;
  accuracy: number;
  analyzing: boolean;
  timestamp: number;
  error?: string;
  landmarks?: any; // MediaPipe NormalizedLandmarks
}

export interface ExtendedEvidence {
  cam1_url?: string;
  cam2_url?: string;
  victim_analysis?: VictimSeverityData;
}
