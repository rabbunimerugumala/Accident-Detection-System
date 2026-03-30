import { 
    Shield, 
    RefreshCw,
    Camera,
    Globe,
    Upload,
    Link,
    AlertTriangle
} from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFaceAnalysis } from '../../hooks/useFaceAnalysis';
import { VictimSeverityData } from '../../types';
import BiometricIntel from './BiometricIntel';

interface AIAccidentShieldProps {
    sensors: {
        fire: boolean;
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

    const [countdown, setCountdown] = useState<number>(35);
    const [source, setSource] = useState<EvidenceSource>('firebase');
    const [throttledEvidence, setThrottledEvidence] = useState(evidence);
    const [selectedCam, setSelectedCam] = useState<1 | 2>(2);
    const evidenceRef = useRef(evidence);

    // Keep ref updated with latest props for the 35s sync
    useEffect(() => {
        evidenceRef.current = evidence;
    }, [evidence]);
    const [customUrl, setCustomUrl] = useState('');
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [triggerScan, setTriggerScan] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Determine target URL for AI Analysis
    const activeUrl = useMemo(() => {
        if (source === 'upload' && uploadedUrl) return uploadedUrl;
        if (source === 'custom' && customUrl) return customUrl;
        return selectedCam === 1 ? throttledEvidence.cam1_url : throttledEvidence.cam2_url;
    }, [source, uploadedUrl, customUrl, selectedCam, throttledEvidence]);

    // Polling Logic: Refreshes AI Evidence every 35 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    setThrottledEvidence(evidenceRef.current);
                    setTriggerScan(true);
                    return 35;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Auto-select camera on readiness
    useEffect(() => {
        if (source !== 'firebase') return;
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
    const lastSeenRef = useRef(0);

    // Draw Landmarks on Feed Overlay
    useEffect(() => {
        if (!biometricData.landmarks || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const landmarks = biometricData.landmarks;

        // Draw helper functions
        const drawConnectors = (indices: number[], color: string, width: number) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.beginPath();
            indices.forEach((idx, i) => {
                const pt = landmarks[idx];
                if (!pt) return;
                if (i === 0) ctx.moveTo(pt.x * canvas.width, pt.y * canvas.height);
                else ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
            });
            ctx.closePath();
            ctx.stroke();
        };

        const drawPoints = (indices: number[], color: string, size: number) => {
            ctx.fillStyle = color;
            indices.forEach(i => {
                const pt = landmarks[i];
                if (!pt) return;
                ctx.beginPath();
                ctx.arc(pt.x * canvas.width, pt.y * canvas.height, size, 0, 2 * Math.PI);
                ctx.fill();
            });
        };

        // Indices for eyes & irises
        const leftEye = [33, 160, 158, 133, 153, 144];
        const rightEye = [362, 385, 387, 263, 373, 380];
        const leftIris = [468, 469, 470, 471, 472];
        const rightIris = [473, 474, 475, 476, 477];

        // Drawing with neon glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#06b6d4';
        drawConnectors(leftEye, '#22d3ee', 2);
        drawConnectors(rightEye, '#22d3ee', 2);
        ctx.shadowBlur = 5;
        drawPoints(leftIris, '#22d3ee', 2.5);
        drawPoints(rightIris, '#22d3ee', 2.5);
        ctx.shadowBlur = 0;

    }, [biometricData.landmarks]);

    // Emit biometric updates to parent
    useEffect(() => {
        if (biometricData && biometricData.timestamp !== lastSeenRef.current) {
            lastSeenRef.current = biometricData.timestamp;
            onBiometricUpdate?.({
                severity: biometricData.severity as any,
                consciousness: biometricData.consciousness,
                eyeStatus: biometricData.eyeStatus,
                expressions: biometricData.expressions,
                confidence: biometricData.confidence,
                accuracy: biometricData.accuracy,
                analyzing: biometricData.analyzing,
                timestamp: biometricData.timestamp,
                error: biometricData.error
            });
        }
    }, [biometricData, onBiometricUpdate]);

    // Unified AI Aggregator Logic
    const unifiedAnalysis = useMemo(() => {
        let level = 1;
        
        if (sensors?.gforce > 4.0 || sensors?.fire) level = 4;
        else if (sensors?.gforce > 1.5 || sensors?.water_detected) level = 3;
        else if (sensors?.gforce > 0.5 || sensors?.temperature > 45 || Math.abs(sensors?.tilt_angle || 0) > 25) level = 2;
        else level = 1;

        if (biometricData.consciousness === 'UNCONSCIOUS') level = 5;
        else if (biometricData.severity === 'HIGH') level += 2;
        else if (biometricData.severity === 'MEDIUM') level += 1;
        else if (biometricData.severity === 'SAFE' && level > 1) level -= 1;

        level = Math.max(1, Math.min(5, level));

        const isPhysicallyDangerous = sensors?.gforce > 2.0 || sensors?.fire || sensors?.water_detected;
        const isSystemAlert = accident?.detected || isPhysicallyDangerous || biometricData.severity === 'HIGH';

        const levels = [
            { s: "SECURE", c: "emerald", l: "SYSTEM SAFE" },
            { s: "CAUTION", c: "blue", l: "MONITORING" },
            { s: "WARNING", c: "amber", l: "POTENTIAL RISK" },
            { s: "CRITICAL", c: "orange", l: "DANGER DETECTED" },
            { s: "EXTREME", c: "rose", l: "MAX EMERGENCY" }
        ];

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
                                <p className="text-white/40 text-[10px] font-black tracking-[0.3em] uppercase italic">LifeGuardX AI Engine Active</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Accident Risk</span>
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
                        
                        {/* Minimalist Sync Indicator */}
                        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.02] border border-white/5 w-fit">
                            <div className="relative">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                                <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-blue-500" />
                            </div>
                            <span className="text-[9px] font-black text-white/40 tracking-[0.2em] uppercase">Sync: {countdown.toString().padStart(2, '0')}s</span>
                        </div>
                    </div>

                    {/* CENTER: BIOMETRIC INTELLIGENCE */}
                    <div className="xl:col-span-4">
                        <BiometricIntel 
                            data={biometricData} 
                            accentColor={unifiedAnalysis.color}
                        />
                    </div>

                    {/* RIGHT: EVIDENCE HUB */}
                    <div className="xl:col-span-4 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Camera className="w-4 h-4 text-white/60" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Evidence HUB</h3>
                            </div>
                            
                            {/* Refined Source Switcher */}
                            <div className="flex items-center gap-2">
                            <div className="flex bg-white/5 rounded-full p-0.5 border border-white/10 backdrop-blur-md">
                                <button 
                                    onClick={() => setSource('firebase')}
                                    className={`p-1.5 rounded-full transition-all ${source === 'firebase' ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'text-white/30 hover:text-white'}`}
                                >
                                    <Globe className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                    onClick={() => setSource('custom')}
                                    className={`p-1.5 rounded-full transition-all ${source === 'custom' ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'text-white/30 hover:text-white'}`}
                                >
                                    <Link className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                    onClick={() => setSource('upload')}
                                    className={`p-1.5 rounded-full transition-all ${source === 'upload' ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'text-white/30 hover:text-white'}`}
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            </div>
                        </div>

                        {source === 'firebase' && (
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setSelectedCam(1)}
                                    className={`flex-1 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${selectedCam === 1 ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-white/5 bg-white/5 text-white/40 hover:bg-white/10'}`}
                                >
                                    Road
                                </button>
                                <button
                                    onClick={() => setSelectedCam(2)}
                                    className={`flex-1 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${selectedCam === 2 ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-white/5 bg-white/5 text-white/40 hover:bg-white/10'}`}
                                >
                                    Driver
                                </button>
                            </div>
                        )}

                        <div 
                            className={`relative aspect-square rounded-[28px] overflow-hidden border-2 border-white/10 bg-slate-900 group ${source === 'upload' ? 'cursor-pointer' : ''}`}
                            onClick={() => {
                                if (source === 'upload') fileInputRef.current?.click();
                            }}
                        >
                            {activeUrl ? (
                                <>
                                    <img 
                                        src={activeUrl} 
                                        alt="AI Evidence" 
                                        className="w-full h-full object-contain transition-all duration-700 shadow-2xl"
                                    />
                                    {/* Holographic Landmark Overlay */}
                                    <canvas 
                                        ref={canvasRef}
                                        className="absolute inset-0 w-full h-full pointer-events-none z-10"
                                        width={512}
                                        height={512}
                                    />
                                    <div className="absolute top-4 left-4 z-20">
                                        <div className="bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-[9px] font-black text-white tracking-widest uppercase italic">
                                                LIVE: {source.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    {biometricData.analyzing && (
                                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-pulse" />
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-white/10 space-y-4">
                                    <AlertTriangle className="w-12 h-12 opacity-10" />
                                    <p className="text-[10px] uppercase font-bold tracking-widest">Feed Offline</p>
                                </div>
                            )}

                            {/* Overlays */}
                            <AnimatePresence>
                                {source === 'custom' && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="absolute inset-4 flex items-end"
                                    >
                                        <div className="w-full bg-black/95 border border-white/20 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
                                            <p className="text-[8px] font-black text-white/40 uppercase mb-2 tracking-widest">Inject Camera Stream</p>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={customUrl}
                                                    onChange={(e) => setCustomUrl(e.target.value)}
                                                    placeholder="Stream URL..."
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white focus:outline-none focus:border-blue-500/50"
                                                />
                                                <button className="bg-blue-600 p-2 rounded-lg text-white" onClick={() => setTriggerScan(true)}>
                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {source === 'upload' && !uploadedUrl && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 flex items-center justify-center backdrop-blur-md bg-black/60"
                                    >
                                        <div className="group flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30 group-hover:bg-blue-600/40 transition-all">
                                                <Upload className="w-6 h-6 text-blue-400" />
                                            </div>
                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                                Select Record
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <input 
                                ref={fileInputRef}
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                id="evidence-upload"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const url = URL.createObjectURL(file);
                                        setUploadedUrl(url);
                                        setTriggerScan(true);
                                        // Reset input so same file can be uploaded again if needed
                                        e.target.value = '';
                                    }
                                }}
                            />
                        </div>

                        {source === 'upload' && uploadedUrl && (
                            <button 
                                onClick={() => {
                                    console.log("Triggering file input click");
                                    fileInputRef.current?.click();
                                }}
                                className="w-full py-4 mt-2 rounded-[22px] bg-white/[0.03] border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group flex flex-col items-center justify-center gap-1"
                            >
                                <div className="flex items-center gap-2">
                                    <Upload className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Upload Another Record</span>
                                </div>
                                <p className="text-[8px] text-white/20 font-black uppercase">Click to browse local files</p>
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AIAccidentShield;
