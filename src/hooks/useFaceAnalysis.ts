import { useState, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { loadFaceApiModels } from '../utils/faceApiLoader';
import { VictimSeverityData, FaceExpressions } from '../components/VictimSeverity/types';
import { predictEyeState } from '../utils/eyeClassifier';

export const useFaceAnalysis = (imageUrl: string | null, trigger: boolean) => {
  const [result, setResult] = useState<VictimSeverityData>({
    severity: 'SAFE',
    consciousness: 'CONSCIOUS',
    eyeStatus: 'OPEN',
    expressions: null,
    confidence: 0,
    analyzing: false,
    timestamp: Date.now(),
  });

  const analyzeImage = useCallback(async (url: string) => {
    if (!url) return;
    
    setResult(prev => ({ ...prev, analyzing: true }));
    
    try {
      await loadFaceApiModels();

      // ─── STEP 1: Load image (bypass CORS from Firebase Storage) ───────────
      const loadImg = (src: string, withCors = true): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const el = new Image();
          if (withCors) el.crossOrigin = 'anonymous';
          el.onload = () => resolve(el);
          el.onerror = () => {
            if (withCors) {
              loadImg(src, false).then(resolve).catch(reject);
            } else {
              reject(new Error('Image load failed'));
            }
          };
          el.src = src;
        });

      const rawImg = await loadImg(url);

      // ─── STEP 2: Canvas Preprocessing ──────────────────────────────────────
      // Upscale tiny images, boost contrast & brightness, apply sharpening
      // so TinyFaceDetector gets the clearest possible signal.
      const preprocessImage = (source: HTMLImageElement): HTMLCanvasElement => {
        const MIN_DIM = 640;
        const scale = Math.max(1, MIN_DIM / Math.max(source.naturalWidth || source.width, source.naturalHeight || source.height));
        const w = Math.round((source.naturalWidth || source.width) * scale);
        const h = Math.round((source.naturalHeight || source.height) * scale);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;

        // Smooth upscale
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source, 0, 0, w, h);

        // Contrast + brightness boost (helps with dark/washed-out ESP32-CAM images)
        ctx.filter = 'contrast(1.4) brightness(1.1) saturate(1.2)';
        ctx.drawImage(canvas, 0, 0);
        ctx.filter = 'none';

        // Unsharp mask sharpening via convolution kernel
        try {
          const imageData = ctx.getImageData(0, 0, w, h);
          const pixels = imageData.data;
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = w;
          tempCanvas.height = h;
          const tempCtx = tempCanvas.getContext('2d')!;
          tempCtx.filter = 'blur(1px)';
          tempCtx.drawImage(canvas, 0, 0);
          const blurred = tempCtx.getImageData(0, 0, w, h).data;

          // Unsharp mask: sharp = original + amount * (original - blurred)
          const amount = 1.2;
          for (let i = 0; i < pixels.length - 3; i += 4) {
            pixels[i]     = Math.min(255, Math.max(0, pixels[i]     + amount * (pixels[i]     - blurred[i])));
            pixels[i + 1] = Math.min(255, Math.max(0, pixels[i + 1] + amount * (pixels[i + 1] - blurred[i + 1])));
            pixels[i + 2] = Math.min(255, Math.max(0, pixels[i + 2] + amount * (pixels[i + 2] - blurred[i + 2])));
          }
          ctx.putImageData(imageData, 0, 0);
        } catch (_) {
          // Tainted canvas (CORS) — skip sharpening, still use contrast-boosted version
        }

        return canvas;
      };

      const processedCanvas = preprocessImage(rawImg);

      // ─── STEP 3: Multi-Pass Detection ──────────────────────────────────────
      // Try progressively different inputSizes & thresholds.
      // Large inputSize = better for big/close faces.
      // Small inputSize = better for small/distant faces.
      // We cascade until a detection is found.
      const passes: Array<{ inputSize: 160 | 224 | 320 | 416 | 608; scoreThreshold: number }> = [
        { inputSize: 416, scoreThreshold: 0.05 },
        { inputSize: 608, scoreThreshold: 0.05 },
        { inputSize: 320, scoreThreshold: 0.04 },
        { inputSize: 224, scoreThreshold: 0.03 },
        { inputSize: 160, scoreThreshold: 0.03 },
      ];

      let detection: faceapi.WithFaceExpressions<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>> | undefined = undefined;

      for (const pass of passes) {
        try {
          detection = await faceapi
            .detectSingleFace(processedCanvas, new faceapi.TinyFaceDetectorOptions(pass))
            .withFaceLandmarks()
            .withFaceExpressions();
        } catch (_) {
          // This pass failed, try next
        }
        if (detection) break;
      }

      if (detection) {
        const expressions = detection.expressions as unknown as FaceExpressions;
        const landmarks = detection.landmarks;
        // Face-Relative High-Precision Analysis
        const getEAR = (eye: faceapi.Point[]) => {
          const v1 = Math.sqrt(Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2));
          const v2 = Math.sqrt(Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2));
          const h = Math.sqrt(Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2));
          return (v1 + v2) / (2.0 * h);
        };

        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        // Calculate Face Scale (Normalization factor using Inter-Ocular Distance)
        const leftCenter = leftEye.reduce((acc: {x:number;y:number}, p: faceapi.Point) => ({ x: acc.x + p.x/6, y: acc.y + p.y/6 }), {x:0, y:0});
        const rightCenter = rightEye.reduce((acc: {x:number;y:number}, p: faceapi.Point) => ({ x: acc.x + p.x/6, y: acc.y + p.y/6 }), {x:0, y:0});
        const faceScale = Math.sqrt(Math.pow(leftCenter.x - rightCenter.x, 2) + Math.pow(leftCenter.y - rightCenter.y, 2));

        const getVerticalAperture = (eye: faceapi.Point[]) => {
            const v1 = Math.abs(eye[1].y - eye[5].y);
            const v2 = Math.abs(eye[2].y - eye[4].y);
            return (v1 + v2) / 2;
        };

        const leftEAR = getEAR(leftEye);
        const rightEAR = getEAR(rightEye);
        const avgEAR = (leftEAR + rightEAR) / 2;
        const avgVA = (getVerticalAperture(leftEye) + getVerticalAperture(rightEye)) / 2;

        // ── EAR Threshold (scientifically calibrated) ─────────────────────────
        // Published research (Soukupová & Čech 2016):
        //   Open eye EAR  ≈ 0.25 – 0.38
        //   Closed eye EAR ≈ 0.15 – 0.20
        //   Blink threshold ≈ 0.20
        // We use 0.21 as a slightly conservative threshold to avoid false positives.
        // For squinting (happy expression), lower to 0.18 to account for narrow aperture.
        const EAR_CLOSED_THRESHOLD = (expressions.happy || 0) > 0.5 ? 0.18 : 0.21;

        // Both eyes must independently agree on closure to avoid false positives
        // from occlusion, side-profile images, or bruising (like in the test image).
        const leftClosed  = leftEAR  < EAR_CLOSED_THRESHOLD;
        const rightClosed = rightEAR < EAR_CLOSED_THRESHOLD;
        const bothClosed  = leftClosed && rightClosed;

        // Vertical aperture guard: only triggers if aperture is near-zero
        // (< 2% of face scale), meaning literally shut — not just squinting.
        const isVerticallyClosed = faceScale > 0 ? (avgVA / faceScale) < 0.020 : false;

        // EAR verdict: OPEN unless BOTH eyes agree on closure
        const earSaysOpen = !(bothClosed && avgEAR < EAR_CLOSED_THRESHOLD) && !isVerticallyClosed;

        // ── Fuse with trained TF.js classifier (if available) ────────────────
        let eyeStatus: VictimSeverityData['eyeStatus'] = earSaysOpen ? 'OPEN' : 'CLOSED';
        try {
          const mlResult = await predictEyeState(processedCanvas);
          if (mlResult) {
            const mlConfidence = Math.max(mlResult.open, mlResult.closed);
            if (mlConfidence > 0.70) {
              // High confidence → trust ML completely
              eyeStatus = mlResult.closed > mlResult.open ? 'CLOSED' : 'OPEN';
            } else if (mlConfidence > 0.50) {
              // Moderate confidence → weighted fusion (ML 60%, EAR 40%)
              const mlClosedScore  = mlResult.closed * 0.6;
              const earClosedScore = (earSaysOpen ? 0 : 1) * 0.4;
              eyeStatus = (mlClosedScore + earClosedScore) > 0.5 ? 'CLOSED' : 'OPEN';
            }
            // else: low ML confidence → stick with EAR result
          }
        } catch (_) {
          // No model or prediction error → EAR result stands
        }
        
        // Final Consciousness: CLOSED eyes + NO conscious indicators (Happy/Surprised)
        const hasConsciousTriggers = (expressions.happy || 0) > 0.4 || (expressions.surprised || 0) > 0.4;
        const consciousness: VictimSeverityData['consciousness'] = (eyeStatus === 'CLOSED' && !hasConsciousTriggers) ? 'UNCONSCIOUS' : 'CONSCIOUS';
        
        // Calculate scores
        const distressScore = Math.max(
          expressions.sad || 0,
          expressions.angry || 0,
          expressions.fearful || 0,
          expressions.disgusted || 0
        );
        
        const calmScore = (expressions.neutral || 0) + (expressions.happy || 0);
        const shockScore = expressions.surprised || 0;
        const confidence = detection.detection.score;

        let severity: VictimSeverityData['severity'] = 'LOW';

        // Advanced Logic for Severity (Now with Consciousness!)
        if (consciousness === 'UNCONSCIOUS' || distressScore > 0.7 || (distressScore > 0.4 && shockScore > 0.4)) {
          severity = 'HIGH'; 
        } else if (distressScore > 0.3 || shockScore > 0.6 || (calmScore < 0.3 && distressScore > 0.1)) {
          severity = 'MEDIUM';
        } else if (calmScore > 0.6) {
          severity = 'SAFE';
        } else {
          severity = 'LOW';
        }

        setResult({
          severity,
          consciousness,
          eyeStatus,
          expressions,
          confidence,
          analyzing: false,
          timestamp: Date.now(),
        });
      } else {
        setResult({
          severity: 'HIGH',
          consciousness: 'UNCERTAIN',
          eyeStatus: 'UNKNOWN',
          expressions: null,
          confidence: 0,
          analyzing: false,
          timestamp: Date.now(),
          error: 'No face detected - IMMEDIATE CHECK REQUIRED',
        });
      }
    } catch (error) {
      console.error('Face analysis pipeline failed:', error);
      setResult(prev => ({ 
        ...prev, 
        severity: 'HIGH', 
        analyzing: false, 
        error: 'Analysis Engine Error',
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

  return result;
};
