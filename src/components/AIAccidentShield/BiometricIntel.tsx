import React from 'react';
import { motion } from 'framer-motion';
import { 
    Activity, AlertTriangle, User, RefreshCw
} from 'lucide-react';
import { VictimSeverityData } from '../VictimSeverity/types';

interface BiometricIntelProps {
    data: VictimSeverityData;
    accentColor: string;
}

const BiometricIntel: React.FC<BiometricIntelProps> = ({ 
    data, 
    accentColor 
}) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Biometric Intel</h3>
                </div>
                <div className="flex items-center gap-2">
                    {/* Elements removed for clean UI */}
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-500 ${
                    data.consciousness === 'UNCONSCIOUS' 
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse' 
                        : data.consciousness === 'UNCERTAIN'
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-500'
                        : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                        data.consciousness === 'UNCONSCIOUS' ? 'bg-rose-500 animate-ping' : 
                        data.consciousness === 'UNCERTAIN' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <span className="text-[9px] font-black uppercase tracking-tighter">
                        {data.consciousness}
                    </span>
                </div>
            </div>

            <div className="flex gap-2">
                 <div className={`flex-1 p-2 rounded-xl bg-white/5 border border-white/10 text-center transition-all duration-500 ${data.eyeStatus === 'CLOSED' ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : ''}`}>
                    <p className="text-[8px] text-white/20 uppercase font-black mb-1">Eye Status</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${data.eyeStatus === 'CLOSED' ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
                        {data.eyeStatus}
                    </p>
                 </div>
                 <div className="flex-1 p-2 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-[8px] text-white/20 uppercase font-black mb-1">EAR Value</p>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                        {data.accuracy.toFixed(3)}
                    </p>
                 </div>
                 <div className="flex-1 p-2 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-[8px] text-white/20 uppercase font-black mb-1">Confidence</p>
                    <p className="text-[10px] font-black text-white uppercase italic">100% REAL-TIME</p>
                 </div>
            </div>
            
            <div className="relative p-6 rounded-[28px] bg-white/[0.03] border border-white/10 min-h-[300px] flex flex-col justify-center space-y-3 overflow-hidden backdrop-blur-md">
                {/* Biometric Analysis Visualizer */}

                {data.analyzing ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                        <RefreshCw className="w-12 h-12 text-cyan-500 animate-spin" />
                        <p className="text-[10px] text-cyan-400 uppercase font-bold tracking-[0.3em] animate-pulse">Synchronizing Neural Engine...</p>
                    </div>
                ) : data.expressions ? (
                    <div className="relative z-0 space-y-2.5">
                        {Object.entries(data.expressions).map(([emotion, score]) => (
                            <div key={emotion} className="space-y-1">
                                <div className="flex justify-between items-center text-[9px]">
                                    <span className={`uppercase font-black tracking-widest ${Math.round((score as number) * 100) > 10 ? 'text-white' : 'text-white/20'}`}>
                                        {emotion}
                                    </span>
                                    <span className={`font-black ${Math.round((score as number) * 100) > 10 ? `text-${accentColor}-400` : 'text-white/20'}`}>
                                        {Math.round((score as number) * 100)}%
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(score as number) * 100}%` }}
                                        className={`h-full bg-gradient-to-r from-${accentColor}-500 to-${accentColor}-400 transition-all duration-500 shadow-[0_0_10px_rgba(var(--accent-${accentColor}-rgb),0.5)]`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : data.error ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 px-4">
                        <AlertTriangle className="w-12 h-12 text-rose-500" />
                        <p className="text-[10px] text-rose-400 uppercase font-black tracking-[0.2em] leading-relaxed">{data.error}</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 opacity-20">
                        <User className="w-12 h-12 text-white" />
                        <p className="text-[10px] text-white uppercase font-bold tracking-widest">Awaiting Biometric Data...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BiometricIntel;
