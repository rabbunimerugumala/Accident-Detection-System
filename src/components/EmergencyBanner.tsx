import React from 'react';
import { Shield, Zap, Satellite, Activity, MousePointerClick } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmergencyBannerProps {
    isCritical: boolean;
    isFresh: boolean;
    gpsFix: boolean;
    accidentDetected: boolean;
    stability: number;
    lastHandshake: string;
    buttonPressed: boolean;
}

const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
    isCritical: _isCritical,
    isFresh,
    gpsFix,
    accidentDetected,
    stability,
    lastHandshake,
    buttonPressed
}) => {
    return (
        <div className="w-full mb-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel overflow-hidden relative"
            >
                {/* Background Accent */}
                <div className={`absolute inset-0 opacity-10 transition-colors duration-1000 ${accidentDetected ? 'bg-red-500' : isFresh ? 'bg-blue-500' : 'bg-slate-500'
                    }`} />

                <div className="relative z-10 p-5 md:p-6 flex flex-col xl:flex-row items-center justify-between gap-6">

                    {/* Left: Brand / Title */}
                    <div className="flex items-center gap-5 w-full xl:w-auto">
                        <div className={`p-4 rounded-2xl transition-colors duration-500 ${accidentDetected ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                            }`}>
                            <Shield className={`w-8 h-8 ${accidentDetected ? 'animate-pulse' : ''}`} />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-lg font-black tracking-tighter text-white leading-tight">
                                LIVE TELEMETRY COMMAND CENTER
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <div className={`w-2 h-2 rounded-full ${isFresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isFresh ? 'text-emerald-500' : 'text-slate-500'}`}>
                                    {isFresh ? 'Synchronized System Operations' : 'Awaiting Heartbeat Signal'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Center: Dynamic Status Pills */}
                    <div className="flex flex-wrap items-center justify-center gap-3 w-full xl:w-auto">
                        {/* Accident Status */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-500 ${accidentDetected
                            ? 'bg-red-500/20 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                            }`}>
                            <Zap className={`w-3.5 h-3.5 ${accidentDetected ? 'animate-bounce' : ''}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                Accident Det.: {accidentDetected ? 'CRITICAL ALERT' : 'NOMINAL'}
                            </span>
                        </div>

                        {/* GPS Lock */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-500 ${gpsFix
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            : 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                            }`}>
                            <Satellite className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                GPS Lock: {gpsFix ? 'LOCKED' : 'WAITING FOR GPS'}
                            </span>
                        </div>

                        {/* Reset Button Status */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-500 ${buttonPressed
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.15)]'
                            : 'bg-white/5 border-white/5 text-slate-500'
                            }`}>
                            <MousePointerClick className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                BTN: {buttonPressed ? 'PRESSED' : 'IDLE'}
                            </span>
                        </div>

                        {/* Link Stability */}
                        <div className="flex flex-col gap-1.5 min-w-[160px] bg-white/5 border border-white/5 px-4 py-2 rounded-xl">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Link Stability</span>
                                <span className="text-[10px] font-black text-blue-400">{stability.toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stability}%` }}
                                    className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                />
                            </div>
                        </div>

                        {/* System Handshake */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-xl">
                            <Activity className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                                Handshake: {lastHandshake}
                            </span>
                        </div>
                    </div>

                    {/* Right: Heartbeat / Connectivity */}
                    <div className="flex items-center gap-4 w-full xl:w-auto justify-end">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Signal Status</span>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-black tracking-widest ${isFresh ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {isFresh ? 'ACTIVE' : 'STANDBY'}
                                </span>
                                <div className="relative flex items-center justify-center w-5 h-5">
                                    <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-500 ${isFresh ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    {isFresh && (
                                        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-40" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="hidden sm:flex h-12 w-[1px] bg-white/10 mx-2" />

                        <div className={`px-4 py-2.5 rounded-xl font-black text-[13px] tracking-tighter ${isFresh ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                            }`}>
                            {isFresh ? 'PRO TELEMETRY' : 'OFFLINE'}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default EmergencyBanner;
