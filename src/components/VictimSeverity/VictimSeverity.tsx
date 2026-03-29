import React, { useState, useEffect, useRef } from 'react';
import { useFaceAnalysis } from '../../hooks/useFaceAnalysis';
import VictimSeverityCard from './VictimSeverityCard';
import { VictimSeverityData } from './types';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  evidenceUrl?: string;
  accidentDetected: boolean;
  vehicleId: string;
  onAnalysisComplete?: (data: VictimSeverityData) => void;
}

const VictimSeverity: React.FC<Props> = ({
  evidenceUrl,
  accidentDetected,
  vehicleId,
  onAnalysisComplete,
}) => {
  const [manualImage, setManualImage] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-trigger on ESP32-CAM evidence + accident OR manual upload
  const analysisResult = useFaceAnalysis(
    manualImage || evidenceUrl || null,
    accidentDetected || !!manualImage
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (manualImage) URL.revokeObjectURL(manualImage); // Cleanup
      const url = URL.createObjectURL(file);
      setManualImage(url);
      toast.success('Analyzing biometric data...', {
        icon: '🔍',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    }
  };

  useEffect(() => {
    if (!analysisResult.analyzing && analysisResult.severity !== 'SAFE') {
      onAnalysisComplete?.(analysisResult);
      
      // Notify only if severity is not safe
      if (analysisResult.severity === 'HIGH' || analysisResult.severity === 'MEDIUM') {
        toast(() => (
          <span className="flex flex-col">
            <b className="text-red-500">VICTIM ALERT: {analysisResult.severity}</b>
            <span className="text-xs opacity-70">Immediate attention recommended for Vehicle {vehicleId}</span>
          </span>
        ), {
          duration: 6000,
          position: 'top-right',
        });
      }
    }
  }, [analysisResult.analyzing, analysisResult.severity, vehicleId, onAnalysisComplete]);

  return (
    <div className="w-full space-y-4">
      <VictimSeverityCard 
        data={analysisResult}
        imageUrl={manualImage || evidenceUrl}
      />

      <div className="relative group">
        <button
          onClick={() => setShowControls(!showControls)}
          className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/50 text-xs font-black tracking-[0.2em] transition-all flex items-center justify-center gap-2 group-hover:text-white/80"
        >
          {showControls ? '− CLOSE BIOMETRIC CONTROLS' : '+ ADVANCED BIOMETRIC OVERRIDE'}
        </button>

        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-6 rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="space-y-2">
                <h4 className="text-white text-sm font-bold">Manual Biometric Scan</h4>
                <p className="text-white/40 text-xs leading-relaxed">
                  Upload a high-resolution image to manually verify victim condition if the camera feed is obstructed.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20"
                >
                  SELECT IMAGE
                </button>
                <button
                  onClick={() => setManualImage(null)}
                  className="py-3 px-6 bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 rounded-xl text-xs font-bold transition-all border border-white/10 hover:border-rose-500/30"
                >
                  RESET
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VictimSeverity;
