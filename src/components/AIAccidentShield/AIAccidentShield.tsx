import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Shield, Activity, AlertTriangle, User, 
    Camera, Globe, Upload, Link, RefreshCw, Brain
} from 'lucide-react';
import { useFaceAnalysis } from '../../hooks/useFaceAnalysis';
import { VictimSeverityData } from '../../types';
import EyeClassifierTrainer from './EyeClassifierTrainer';

interface AIAccidentShieldProps {
    sensors: {
        fire: boolean;
        gas_leak: boolean;
        gforce: number;
        temperature: number;
        tilt_angle: number;
        water_detected: boolean;
    };
    accident: {
        detected: boolean;
        severity: string;
    };
    evidence: {
        cam1_url: string;
        cam1_label: string;
        cam1_ready: boolean;
        cam2_url: string;
        cam2_label: string;
        cam2_ready: boolean;
    };
    vehicleId: string;
    onSystemUpdate?: (level: string) => void;
    onBiometricUpdate?: (result: VictimSeverityData) => void;
}

type EvidenceSource = 'firebase' | 'custom' | 'upload';

const AIAccidentShield: React.FC<AIAccidentShieldProps> = ({
    sensors: rawSensors,
    accident: rawAccident,
    evidence,
    onSystemUpdate,
    onBiometricUpdate
}) => {
    // Data Access
    const sensors = rawSensors;
    const accident = rawAccident;

    const [countdown, setCountdown] = useState<number>(20);
    const [source, setSource] = useState<EvidenceSource>('firebase');
    const [selectedCam, setSelectedCam] = useState<1 | 2>(2); // Default to Driver Condition
    const [customUrl, setCustomUrl] = useState('');
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [triggerScan, setTriggerScan] = useState(false);
    const [showTrainer, setShowTrainer] = useState(false);

    // Determine target URL for AI Analysis
    const activeUrl = useMemo(() => {
        if (source === 'upload' && uploadedUrl) return uploadedUrl;
        if (source === 'custom' && customUrl) return customUrl;
        return selectedCam === 1 ? evidence.cam1_url : evidence.cam2_url;
    }, [source, uploadedUrl, customUrl, selectedCam, evidence]);

    // 20-Second Polling Logic (Only active for Firebase source)
    useEffect(() => {
        if (source !== 'firebase') return;
        
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    setTriggerScan(true);
                    return 20;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [source]);

    // Auto-select camera on readiness (Prioritizes Cam 2 for AI analysis)
    useEffect(() => {
        if (source !== 'firebase') return;
        // Only auto-switch if the current selected cam isn't already the best "ready" one
        if (evidence.cam2_ready && selectedCam !== 2) {
            setSelectedCam(2);
        } else if (evidence.cam1_ready && !evidence.cam2_ready && selectedCam !== 1) {
            setSelectedCam(1);
        }
    }, [evidence.cam1_ready, evidence.cam2_ready, source, selectedCam]);

    // Reset trigger scan after analysis starts
    useEffect(() => {
        if (triggerScan) {
            const timeout = setTimeout(() => setTriggerScan(false), 500);
            return () => clearTimeout(timeout);
        }
    }, [triggerScan]);

    // AI Biometric Analysis
    const biometricData = useFaceAnalysis(activeUrl, accident?.detected || triggerScan);

    // Emit biometric updates to parent
    useEffect(() => {
        if (biometricData) {
            onBiometricUpdate?.({
                severity: biometricData.severity as any,
                consciousness: biometricData.consciousness,
                eyeStatus: biometricData.eyeStatus,
                expressions: biometricData.expressions,
                confidence: biometricData.confidence,
                analyzing: biometricData.analyzing,
                timestamp: Date.now(),
                error: biometricData.error
            });
        }
    }, [biometricData, onBiometricUpdate]);

    // Unified AI Aggregator Logic (Continuous Real-Time Assessment)
    const unifiedAnalysis = useMemo(() => {
        let level = 1;
        
        // Phase 1: Physics Baseline
        if (sensors?.gforce > 4.0 || sensors?.fire) level = 4;
        else if (sensors?.gforce > 1.5 || sensors?.gas_leak || sensors?.water_detected) level = 3;
        else if (sensors?.gforce > 0.5 || sensors?.temperature > 45 || Math.abs(sensors?.tilt_angle || 0) > 25) level = 2;
        else level = 1;

        // Phase 2: Biometric Influence
        if (biometricData.consciousness === 'UNCONSCIOUS') level = 5; // CATASTROPHIC
        else if (biometricData.severity === 'HIGH') level += 2;
        else if (biometricData.severity === 'MEDIUM') level += 1;
        else if (biometricData.severity === 'SAFE' && level > 1) level -= 1;

        // Final Constraints
        level = Math.max(1, Math.min(5, level));

        // If no accident is physically detected, we cap the status unless biometrics are extreme
        const isPhysicallyDangerous = sensors?.gforce > 2.0 || sensors?.fire || sensors?.gas_leak || sensors?.water_detected;
        const isSystemAlert = accident?.detected || isPhysicallyDangerous || biometricData.severity === 'HIGH';

        const levels = [
            { s: "SECURE", c: "emerald", l: "SYSTEM SAFE" },
            { s: "CAUTION", c: "blue", l: "MONITORING" },
            { s: "WARNING", c: "amber", l: "POTENTIAL RISK" },
            { s: "CRITICAL", c: "orange", l: "DANGER DETECTED" },
            { s: "EXTREME", c: "rose", l: "MAX EMERGENCY" }
        ];

        // Override: If truly safe, keep it emerald
        if (!isSystemAlert && level <= 2) {
            return { level: level, status: "SECURE", color: "emerald", label: "SYSTEM SECURE" };
        }

        const config = levels[level - 1] || levels[0];
        return { level, status: config.s, color: config.c, label: config.l };
    }, [accident?.detected, sensors, biometricData.severity, biometricData.consciousness]);

    useEffect(() => {
        if (accident?.detected) {
            onSystemUpdate?.(unifiedAnalysis.status);
        }
    }, [unifiedAnalysis.status, accident?.detected, onSystemUpdate]);

    return (
        <div className="relative w-full">
            {/* Eye AI Trainer Modal */}
            <AnimatePresence>
                {showTrainer && (
                    <EyeClassifierTrainer onClose={() => setShowTrainer(false)} />
                )}
            </AnimatePresence>

            <motion.div 
                layout
                className={`relative overflow-hidden rounded-[32px] bg-black border border-${unifiedAnalysis.color}-500/30 p-8 shadow-2xl backdrop-blur-3xl`}
            >
                <div className={`absolute -top-24 -right-24 w-64 h-64 bg-${unifiedAnalysis.color}-500/10 rounded-full blur-[100px] pointer-events-none`} />

                <div className="relative grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* LEFT: STATUS & PHYSICS */}
                    <div className="xl:col-span-4 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-2xl bg-${unifiedAnalysis.color}-500 shadow-lg shadow-${unifiedAnalysis.color}-500/40 text-white`}>
                                <Shield className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">{unifiedAnalysis.label}</h2>
                                <p className="text-white/40 text-[10px] font-black tracking-[0.3em] uppercase">LifeGuardX AI Engine v3.6</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Accident Risk level</span>
                                <motion.span 
                                    key={unifiedAnalysis.level}
                                    initial={{ scale: 1.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`text-6xl font-black text-${unifiedAnalysis.color}-400 drop-shadow-[0_0_15px_rgba(var(--accent-${unifiedAnalysis.color}-rgb),0.5)]`}
                                >
                                    0{unifiedAnalysis.level}
                                </motion.span>
                            </div>
                            <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-1">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(unifiedAnalysis.level / 5) * 100}%` }}
                                    className={`h-full bg-gradient-to-r from-${unifiedAnalysis.color}-600 to-${unifiedAnalysis.color}-400 rounded-full`}
                                />
                            </div>
                        </div>

                        <ul className="grid grid-cols-2 gap-3 p-0 list-none m-0">
                            <li className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
                                <p className="text-white/20 text-[9px] uppercase font-bold mb-1 tracking-widest">Impact Force</p>
                                <p className="text-2xl font-black text-white">{sensors?.gforce?.toFixed(2) || '0.00'}<span className="text-xs text-white/30 ml-1">g</span></p></li>
                            <li className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
                                <p className="text-white/20 text-[9px] uppercase font-bold mb-1 tracking-widest">Inference</p>
                                <p className={`text-xl font-black text-${unifiedAnalysis.color}-400 uppercase`}>{unifiedAnalysis.status}</p></li>
                        </ul>

                        <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className={`w-2 h-2 rounded-full ${source === 'firebase' ? 'bg-blue-500 animate-ping' : 'bg-white/20'}`} />
                                    <div className={`absolute inset-0 w-2 h-2 rounded-full ${source === 'firebase' ? 'bg-blue-500' : 'bg-white/20'}`} />
                                </div>
                                <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Sync Status</span>
                            </div>
                            <span className="text-xs font-mono text-blue-400 font-bold uppercase">
                                {source === 'firebase' ? `NEXT: ${countdown}s` : 'Manual Mode'}
                            </span>
                        </div>
                    </div>

                    {/* CENTER: BIOMETRIC INTELLIGENCE */}
                    <div className="xl:col-span-4 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-blue-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Biometric Intel</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowTrainer(true)}
                                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-500/20 transition-all"
                                    title="Train AI with your own images"
                                >
                                    <Brain className="w-3 h-3" />
                                    Train AI
                                </button>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                                biometricData.consciousness === 'UNCONSCIOUS' 
                                    ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse' 
                                    : biometricData.consciousness === 'UNCERTAIN'
                                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-500'
                                    : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                            }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                    biometricData.consciousness === 'UNCONSCIOUS' ? 'bg-rose-500' : 
                                    biometricData.consciousness === 'UNCERTAIN' ? 'bg-amber-500' : 'bg-emerald-500'
                                }`} />
                                <span className="text-[9px] font-black uppercase tracking-tighter">
                                    {biometricData.consciousness}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                         <div className={`flex-1 p-2 rounded-xl bg-white/5 border border-white/10 text-center transition-all duration-500 ${biometricData.eyeStatus === 'CLOSED' ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : ''}`}>
                            <p className="text-[8px] text-white/20 uppercase font-black mb-1">Eye Status</p>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${biometricData.eyeStatus === 'CLOSED' ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
                                {biometricData.eyeStatus}
                            </p>
                         </div>
                              <div className="flex-1 p-2 rounded-xl bg-white/5 border border-white/10 text-center">
                                <p className="text-[8px] text-white/20 uppercase font-black mb-1">Gaze</p>
                                <p className="text-[10px] font-black text-white uppercase">TRACKING</p>
                              </div>
                        </div>
                        
                        <div className="p-6 rounded-[28px] bg-white/[0.03] border border-white/10 min-h-[250px] flex flex-col justify-center space-y-3">
                            {biometricData.analyzing ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                                    <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
                                    <p className="text-[10px] text-white uppercase font-bold tracking-[0.3em] animate-pulse">Running AI Engine...</p>
                                </div>
                            ) : biometricData.expressions ? (
                                Object.entries(biometricData.expressions).map(([emotion, score]) => (
                                    <div key={emotion} className="space-y-1">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className={`uppercase font-black tracking-widest ${Math.round((score as number) * 100) > 10 ? 'text-white' : 'text-white/20'}`}>
                                                {emotion}
                                            </span>
                                            <span className={`font-black ${Math.round((score as number) * 100) > 10 ? `text-${unifiedAnalysis.color}-400` : 'text-white/20'}`}>
                                                {Math.round((score as number) * 100)}%
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(score as number) * 100}%` }}
                                                className={`h-full bg-gradient-to-r from-${unifiedAnalysis.color}-500 to-${unifiedAnalysis.color}-400 shadow-[0_0_10px_rgba(var(--accent-${unifiedAnalysis.color}-rgb),0.5)]`}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : biometricData.error ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 px-4">
                                    <AlertTriangle className="w-12 h-12 text-rose-500" />
                                    <p className="text-[10px] text-rose-400 uppercase font-black tracking-[0.2em]">{biometricData.error}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 opacity-20">
                                    <User className="w-12 h-12 text-white" />
                                    <p className="text-[10px] text-white uppercase font-bold tracking-widest">Waiting for subject...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: UNIFIED EVIDENCE HUB */}
                    <div className="xl:col-span-4 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Camera className="w-4 h-4 text-rose-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Evidence HUB</h3>
                            </div>
                            <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
                                <button 
                                    onClick={() => setSource('firebase')}
                                    className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${source === 'firebase' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                >
                                    <Globe className="w-3 h-3" />
                                </button>
                                <button 
                                    onClick={() => setSource('custom')}
                                    className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${source === 'custom' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                >
                                    <Link className="w-3 h-3" />
                                </button>
                                <button 
                                    onClick={() => setSource('upload')}
                                    className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${source === 'upload' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                >
                                    <Upload className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        {/* Camera Selector (Only for Firebase Source) */}
                        {source === 'firebase' && (
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setSelectedCam(1)}
                                    className={`flex-1 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${selectedCam === 1 ? 'border-rose-500/50 bg-rose-500/10 text-rose-400' : 'border-white/5 bg-white/5 text-white/40 hover:bg-white/10'}`}
                                >
                                    Cam 1: Road
                                </button>
                                <button
                                    onClick={() => setSelectedCam(2)}
                                    className={`flex-1 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${selectedCam === 2 ? 'border-rose-500/50 bg-rose-500/10 text-rose-400' : 'border-white/5 bg-white/5 text-white/40 hover:bg-white/10'}`}
                                >
                                    Cam 2: Driver
                                </button>
                            </div>
                        )}

                        <div className="relative aspect-square rounded-[28px] overflow-hidden border-2 border-white/10 bg-slate-900 group">
                            {activeUrl ? (
                                <>
                                    <img 
                                        src={activeUrl} 
                                        alt="AI Evidence" 
                                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                                        onError={() => setSource('upload')}
                                    />
                                    {biometricData.analyzing && (
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent h-1/4 animate-scan pointer-events-none" />
                                    )}
                                    <div className="absolute top-4 left-4 right-4 flex justify-between">
                                        <div className="bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${source === 'firebase' ? 'bg-red-500 animate-pulse' : 'bg-blue-400'}`} />
                                            <span className="text-[9px] font-black text-white tracking-widest uppercase italic">
                                                {source.toUpperCase()}: {activeUrl.substring(0, 8)}...
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-white/10 space-y-4">
                                    <AlertTriangle className="w-12 h-12 opacity-10" />
                                    <p className="text-[10px] uppercase font-bold tracking-widest">No Evidence Selected</p>
                                    <button 
                                        onClick={() => setSource('upload')}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-white/40 hover:text-white transition-all border border-white/10"
                                    >
                                        Click to Upload
                                    </button>
                                </div>
                            )}

                            {/* HUD INTERACTION OVERLAY */}
                            <AnimatePresence>
                                {source === 'custom' && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute inset-x-4 bottom-4"
                                    >
                                        <div className="bg-black/90 backdrop-blur-2xl p-4 rounded-2xl border border-white/20 shadow-2xl">
                                            <p className="text-[9px] font-bold text-white/40 uppercase mb-2 tracking-widest">Inject Camera URL</p>
                                            <div className="flex gap-2">
                                                <input 
                                                    autoFocus
                                                    type="text" 
                                                    value={customUrl}
                                                    onChange={(e) => setCustomUrl(e.target.value)}
                                                    placeholder="https://..."
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                                                />
                                                <button className="bg-blue-600 p-2 rounded-lg text-white" onClick={() => setTriggerScan(true)}>
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {source === 'upload' && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute inset-x-4 bottom-4"
                                    >
                                        <label className="block w-full bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl text-center cursor-pointer transition-all shadow-xl shadow-blue-600/30">
                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Select Local Capture</span>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const url = URL.createObjectURL(file);
                                                        setUploadedUrl(url);
                                                    }
                                                }}
                                            />
                                        </label>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar: System Trust */}
                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">End-to-End Integrity Verified</span>
                        </div>
                        <div className="hidden md:flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Biometric Sync Active</span>
                        </div>
                    </div>
                    <p className="text-[9px] font-bold text-white/10 italic">LifeGuardX Pro / Telemetry Build 2.4.0</p>
                </div>
            </motion.div>
        </div>
    );
};

export default AIAccidentShield;
