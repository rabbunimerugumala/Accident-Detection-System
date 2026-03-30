import { useState, useEffect, useCallback, useMemo } from 'react';
import { loadMediaPipeModels } from '../utils/mediaPipeLoader';
import { VictimSeverityData, FaceExpressions } from '../components/VictimSeverity/types';

export const useFaceAnalysis = (imageUrl: string | null, trigger: boolean) => {
  const [result, setResult] = useState<VictimSeverityData>({
    severity: 'SAFE',
    consciousness: 'CONSCIOUS',
    eyeStatus: 'OPEN',
    expressions: null,
    confidence: 0,
    analyzing: false,
    timestamp: Date.now(),
    accuracy: 0,
    landmarks: null,
  });

  const analyzeImage = useCallback(async (url: string) => {
    if (!url) return;
    
    setResult(prev => ({ ...prev, analyzing: true }));
    
    try {
      const landmarker = await loadMediaPipeModels();

      const loadImg = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const el = new Image();
          el.crossOrigin = 'anonymous';
          el.onload = () => resolve(el);
          el.onerror = () => reject(new Error('Image load failed'));
          el.src = src;
        });

      const rawImg = await loadImg(url);
      
      const detectionResult = landmarker.detect(rawImg);

      if (detectionResult.faceLandmarks && detectionResult.faceLandmarks.length > 0) {
        const landmarks = detectionResult.faceLandmarks[0];
        const blendshapes = detectionResult.faceBlendshapes?.[0]?.categories || [];

        // EAR calculation logic
        const getEAR = (eyeIndices: number[]) => {
          const p = eyeIndices.map(i => landmarks[i]);
          // Verticals
          const v1 = Math.sqrt(Math.pow(p[1].x - p[5].x, 2) + Math.pow(p[1].y - p[5].y, 2));
          const v2 = Math.sqrt(Math.pow(p[2].x - p[4].x, 2) + Math.pow(p[2].y - p[4].y, 2));
          // Horizontal
          const h = Math.sqrt(Math.pow(p[0].x - p[3].x, 2) + Math.pow(p[0].y - p[3].y, 2));
          return (v1 + v2) / (2.0 * h);
        };

        const leftEyeIndices = [33, 160, 158, 133, 153, 144];
        const rightEyeIndices = [362, 385, 387, 263, 373, 380];

        const leftEAR = getEAR(leftEyeIndices);
        const rightEAR = getEAR(rightEyeIndices);
        const avgEAR = (leftEAR + rightEAR) / 2;

        const blinkLeft = blendshapes.find(c => c.categoryName === 'eyeBlinkLeft')?.score || 0;
        const blinkRight = blendshapes.find(c => c.categoryName === 'eyeBlinkRight')?.score || 0;
        const avgBlink = (blinkLeft + blinkRight) / 2;

        // Eye status and consciousness
        const eyeStatus: VictimSeverityData['eyeStatus'] = (avgEAR < 0.2 || avgBlink > 0.6) ? 'CLOSED' : 'OPEN';
        const consciousness: VictimSeverityData['consciousness'] = eyeStatus === 'CLOSED' ? 'UNCONSCIOUS' : 'CONSCIOUS';

        // 7-Expression Mapping
        const getScore = (name: string) => blendshapes.find(c => c.categoryName === name)?.score || 0;
        
        const expressions: FaceExpressions = {
          neutral: getScore('neutral'),
          happy: (getScore('mouthSmileLeft') + getScore('mouthSmileRight')) / 2,
          sad: (getScore('browDownLeft') + getScore('browDownRight')) / 2,
          angry: Math.max(getScore('browDownLeft'), getScore('browDownRight')) * 0.7 + getScore('mouthPucker') * 0.3,
          fearful: (getScore('eyeWideLeft') + getScore('eyeWideRight')) / 2,
          disgusted: (getScore('noseSneerLeft') + getScore('noseSneerRight')) / 2,
          surprised: (getScore('browInnerUp') + getScore('eyeWideLeft')) / 2,
        };

        let severity: VictimSeverityData['severity'] = 'LOW';
        if (consciousness === 'UNCONSCIOUS') severity = 'HIGH';
        else if (expressions.angry > 0.4 || expressions.fearful > 0.4) severity = 'HIGH';
        else if (expressions.sad > 0.4 || expressions.surprised > 0.6) severity = 'MEDIUM';
        else if (expressions.happy > 0.4) severity = 'SAFE';

        setResult({
          severity,
          consciousness,
          eyeStatus,
          expressions,
          confidence: 1.0,
          analyzing: false,
          timestamp: Date.now(),
          accuracy: Math.round(avgEAR * 1000) / 1000, // Show 3 decimals
          landmarks,
        });
      } else {
        setResult(prev => ({
          ...prev,
          severity: 'HIGH',
          consciousness: 'UNCERTAIN',
          eyeStatus: 'UNKNOWN',
          expressions: null,
          analyzing: false,
          timestamp: Date.now(),
          error: 'Face mesh sync lost - ESP32 Signal Weak',
        }));
      }
    } catch (error) {
      console.error('MediaPipe analysis failed:', error);
      setResult(prev => ({ 
        ...prev, 
        severity: 'HIGH', 
        analyzing: false, 
        error: 'AI Edge Engine Error',
        timestamp: Date.now() 
      }));
    }
  }, []);

  useEffect(() => {
    if (imageUrl) {
      analyzeImage(imageUrl);
    }
  }, [imageUrl, analyzeImage]);

  useEffect(() => {
    if (trigger && imageUrl) {
      analyzeImage(imageUrl);
    }
  }, [trigger, imageUrl, analyzeImage]);

  return useMemo(() => ({
    ...result,
    analyzeImage,
  }), [result, analyzeImage]);
};
