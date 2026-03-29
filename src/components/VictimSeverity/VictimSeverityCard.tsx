import { VictimSeverityData } from './types';
import { motion } from 'framer-motion';

interface Props {
  data: VictimSeverityData;
  imageUrl?: string;
}

const severityConfig = {
  SAFE: {
    color: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-500/50',
    icon: '✅',
    label: 'VICTIM SAFE',
    desc: 'Conscious and showing positive/neutral expressions.'
  },
  LOW: {
    color: 'from-blue-500 to-indigo-600',
    shadow: 'shadow-blue-500/50',
    icon: '🔹',
    label: 'STABLE / LOW RISK',
    desc: 'Conscious with minimal signs of distress.'
  },
  MEDIUM: {
    color: 'from-amber-500 to-orange-600',
    shadow: 'shadow-amber-500/50',
    icon: '⚠️',
    label: 'MODERATE DISTRESS',
    desc: 'Signs of pain or shock detected. Priority check.'
  },
  HIGH: {
    color: 'from-rose-600 to-red-700',
    shadow: 'shadow-red-600/50',
    icon: '🚨',
    label: 'CRITICAL ALERT',
    desc: 'High distress, extreme pain, or unconsciousness suspected.'
  }
};

const VictimSeverityCard: React.FC<Props> = ({ data, imageUrl }) => {
  const config = severityConfig[data.severity];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${config.color} p-1 ${config.shadow} shadow-2xl`}
    >
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] pointer-events-none" />

      <div className="relative bg-black/40 backdrop-blur-xl rounded-[22px] p-6 h-full border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{config.icon}</span>
            <div>
              <h3 className="text-xl font-black text-white tracking-wider uppercase">
                {config.label}
              </h3>
              <p className="text-white/60 text-xs font-medium">
                {data.analyzing ? 'Analysis in progress...' : `Ref: ${new Date(data.timestamp).toLocaleTimeString()}`}
              </p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-2xl bg-white/10 border border-white/20 font-mono text-sm font-bold text-white ${data.analyzing ? 'animate-pulse' : ''}`}>
            {data.analyzing ? 'SYNCING...' : `${Math.round(data.confidence * 100)}% CONF`}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* Analysis Details */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-white/80 text-sm italic">
                "{config.desc}"
              </p>
              {data.error && (
                <p className="mt-2 text-rose-400 text-xs font-bold uppercase animate-pulse">
                  ⚠ {data.error}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-white/40 text-[10px] uppercase font-bold tracking-widest px-1">Biometric Expression Breakdown</h4>
              <div className="grid grid-cols-2 gap-2">
                {data.expressions ? (
                  Object.entries(data.expressions).map(([emotion, score]) => (
                    <div key={emotion} className="flex flex-col p-2 bg-white/5 rounded-xl border border-white/5 transition-all hover:bg-white/10">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-white/50 capitalize font-medium">{emotion}</span>
                        <span className="text-[10px] text-white/90 font-bold">{Math.round(score * 100)}%</span>
                      </div>
                      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${score * 100}%` }}
                          className={`h-full bg-gradient-to-r ${config.color}`}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-8 text-center text-white/20 text-xs border border-dashed border-white/10 rounded-xl uppercase">
                    No face data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Evidence Preview */}
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/20 shadow-inner bg-black">
            {imageUrl ? (
              <>
                <img 
                  src={imageUrl} 
                  alt="Biometric Evidence" 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 border-[2px] border-white/20 rounded-2xl pointer-events-none" />
                {/* HUD Elements */}
                <div className="absolute top-2 left-2 flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-[8px] text-white/80 font-mono bg-black/40 px-1 rounded">LIVE FEED</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/20">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[10px] tracking-widest uppercase">Waiting for feed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VictimSeverityCard;
