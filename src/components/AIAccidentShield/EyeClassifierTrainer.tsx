import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Upload, Trash2, CheckCircle, AlertCircle, Play, X } from 'lucide-react';
import { trainClassifier, hasSavedModel, deleteSavedModel } from '../../utils/eyeClassifier';

interface EyeTrainerProps {
  onClose: () => void;
}

type TrainImage = { url: string; el: HTMLImageElement; id: string };

const EyeClassifierTrainer: React.FC<EyeTrainerProps> = ({ onClose }) => {
  const [openImages, setOpenImages]     = useState<TrainImage[]>([]);
  const [closedImages, setClosedImages] = useState<TrainImage[]>([]);
  const [status, setStatus]     = useState<'idle' | 'training' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState({ epoch: 0, acc: 0, loss: 0 });
  const [hasModel, setHasModel] = useState<boolean | null>(null);
  const openRef   = useRef<HTMLInputElement>(null);
  const closedRef = useRef<HTMLInputElement>(null);

  // Check if model exists on mount
  React.useEffect(() => {
    hasSavedModel().then(setHasModel);
  }, []);

  const loadFiles = useCallback((files: FileList, label: 'open' | 'closed') => {
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      const el = new Image();
      el.src = url;
      el.onload = () => {
        const item: TrainImage = { url, el, id: `${Date.now()}-${Math.random()}` };
        if (label === 'open')   setOpenImages(p => [...p, item]);
        else                    setClosedImages(p => [...p, item]);
      };
    });
  }, []);

  const handleTrain = async () => {
    if (openImages.length < 2 || closedImages.length < 2) {
      alert('Please add at least 2 OPEN and 2 CLOSED eye images.');
      return;
    }
    setStatus('training');
    try {
      await trainClassifier(
        openImages.map(i => i.el),
        closedImages.map(i => i.el),
        (epoch, acc, loss) => setProgress({ epoch, acc, loss })
      );
      setStatus('done');
      setHasModel(true);
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleDelete = async () => {
    await deleteSavedModel();
    setHasModel(false);
  };

  const removeImage = (id: string, label: 'open' | 'closed') => {
    if (label === 'open')   setOpenImages(p => p.filter(i => i.id !== id));
    else                    setClosedImages(p => p.filter(i => i.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#0a0a0f] border border-white/10 rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-500/30">
              <Brain className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Eye AI Trainer</h2>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">MobileNet Transfer Learning · Saves to Browser</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Existing model status */}
        {hasModel !== null && (
          <div className={`flex items-center justify-between p-4 rounded-2xl mb-6 border ${hasModel ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
            <div className="flex items-center gap-3">
              {hasModel ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-white/30" />}
              <span className="text-sm font-bold text-white/70 uppercase tracking-widest">
                {hasModel ? 'Trained model active — eye detection enhanced' : 'No saved model yet — using EAR fallback only'}
              </span>
            </div>
            {hasModel && (
              <button onClick={handleDelete} className="flex items-center gap-2 text-[10px] font-bold text-rose-400 hover:text-rose-300 uppercase tracking-widest transition-all">
                <Trash2 className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>
        )}

        {/* Upload panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {([
            { label: 'OPEN Eyes', tag: 'open' as const, color: 'emerald', images: openImages, ref: openRef },
            { label: 'CLOSED Eyes', tag: 'closed' as const, color: 'rose', images: closedImages, ref: closedRef },
          ] as const).map(({ label, tag, color, images, ref }) => (
            <div key={tag} className={`p-5 rounded-[24px] border border-${color}-500/20 bg-${color}-500/5`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-black text-${color}-400 uppercase tracking-widest`}>{label}</h3>
                <span className="text-[10px] font-bold text-white/30">{images.length} images</span>
              </div>

              {/* Thumbnails */}
              <div className="flex flex-wrap gap-2 mb-4 min-h-[64px]">
                <AnimatePresence>
                  {images.map(img => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 group"
                    >
                      <img src={img.url} className="w-full h-full object-cover" alt="" />
                      <button
                        onClick={() => removeImage(img.id, tag)}
                        className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <label className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl cursor-pointer border border-${color}-500/30 bg-${color}-500/10 hover:bg-${color}-500/20 transition-all`}>
                <Upload className={`w-4 h-4 text-${color}-400`} />
                <span className={`text-[10px] font-black text-${color}-400 uppercase tracking-widest`}>Upload {label}</span>
                <input
                  ref={ref}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files && loadFiles(e.target.files, tag)}
                />
              </label>
              <p className="text-[9px] text-white/20 mt-2 text-center">Upload 5–20 images per category for best results</p>
            </div>
          ))}
        </div>

        {/* Training progress */}
        <AnimatePresence>
          {status === 'training' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Training — Epoch {progress.epoch} / 30</span>
                <span className="text-[10px] font-mono text-white/50">Acc: {(progress.acc * 100).toFixed(1)}% · Loss: {progress.loss.toFixed(4)}</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${(progress.epoch / 30) * 100}%` }}
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full"
                />
              </div>
            </motion.div>
          )}
          {status === 'done' && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Training complete! Model saved to browser. Eye detection is now enhanced.</span>
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-6 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span className="text-sm font-bold text-rose-400 uppercase tracking-widest">Training failed. Check console for details.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Train button */}
        <button
          onClick={handleTrain}
          disabled={status === 'training'}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 hover:shadow-blue-600/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          <Play className="w-5 h-5" />
          {status === 'training' ? 'Training...' : 'Start Training'}
        </button>

        <p className="text-center text-[9px] text-white/20 mt-4 uppercase tracking-widest">
          Training runs entirely in your browser · Model saved to IndexedDB · No data leaves your device
        </p>
      </motion.div>
    </motion.div>
  );
};

export default EyeClassifierTrainer;
