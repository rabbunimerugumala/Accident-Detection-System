import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Brain, AlertCircle, Search
} from 'lucide-react';
import { FirebaseData, AIAnalysisResult, VictimSeverityData } from '../types';

interface AIRiskAnalyzerProps {
    data: FirebaseData['accidentState'] | null;
    biometricResult?: VictimSeverityData | null;
    status: string;
}

const AIRiskAnalyzer: React.FC<AIRiskAnalyzerProps> = ({ data, biometricResult, status }) => {
    const [inferenceTime, setInferenceTime] = useState(0);

    const isOnline = status === 'ONLINE';

    const analysis = useMemo((): AIAnalysisResult | null => {
        if (!data) return null;

        // OFFLINE GUARD: If system is offline, zero out all analytics
        if (!isOnline) {
            return {
                riskScore: 0,
                situation: "SYSTEM OFFLINE",
                confidence: 0,
                inferenceMs: 0,
                activeRules: ["OFFLINE MODE"],
                sensorWeights: [
                    { name: "Fire", normalizedValue: 0, weight: 0, suppressed: false },
                    { name: "Gas Leak", normalizedValue: 0, weight: 0, suppressed: false },
                    { name: "Thermal", normalizedValue: 0, weight: 0, suppressed: false },
                    { name: "Submersion", normalizedValue: 0, weight: 0, suppressed: false },
                    { name: "Tilt Angle", normalizedValue: 0, weight: 0, suppressed: false },
                    { name: "Impact Load", normalizedValue: 0, weight: 0, suppressed: false }
                ]
            };
        }

        const start = performance.now();
        const s = data.sensors;
        const activeRules: string[] = [];
        
        // 1. Normalize values
        const normFire = s.fire ? 1.0 : 0.0;
        const normGas = s.gas_leak ? 1.0 : 0.0;
        const normTemp = Math.max(0, Math.min(1, (s.temperature - 25) / 55));
        const normWater = s.water_detected ? 1.0 : 0.0;
        const normTilt = Math.max(0, Math.min(1, Math.abs(s.tilt_angle) / 90));
        const normGForce = Math.max(0, Math.min(1, s.gforce / 10));

        let situation = "ALL SYSTEMS SAFE";
        let riskScore = 0;
        const weights = {
            fire: 0.30,
            gas: 0.25,
            temp: 0.15,
            water: 0.15,
            tilt: 0.10,
            gforce: 0.05
        };

        const suppression: Record<string, { suppressed: boolean; reason?: string }> = {
            fire: { suppressed: false },
            gas: { suppressed: false },
            temp: { suppressed: false },
            water: { suppressed: false },
            tilt: { suppressed: false },
            gforce: { suppressed: false }
        };

        // RULE 8: MULTI-HAZARD (3+ sensors)
        const activeCount = [s.fire, s.gas_leak, s.water_detected, s.temperature > 55, Math.abs(s.tilt_angle) > 35].filter(Boolean).length;
        
        if (activeCount >= 3) {
            situation = "MULTI-HAZARD EMERGENCY";
            riskScore = 1.0;
            activeRules.push("RULE 8: CATASTROPHIC MULTI-HAZARD");
        } else {
            // Apply Rule 1-7
            if (s.fire && s.gas_leak) {
                situation = "VEHICLE FIRE & EXPLOSION RISK";
                riskScore = 1.0;
                suppression.temp = { suppressed: true, reason: "Fire Override" };
                suppression.water = { suppressed: true, reason: "Explosion Risk Priority" };
                activeRules.push("RULE 1: FIRE + GAS COMBO");
            } else if (s.fire && !s.water_detected) {
                situation = "FIRE HAZARD DETECTED";
                riskScore = 0.85;
                suppression.temp = { suppressed: true, reason: "Fire Overrides Temp" };
                activeRules.push("RULE 2: FIRE PRIORITY");
            } else if (s.water_detected && !s.fire && !s.gas_leak) {
                if (Math.abs(s.tilt_angle) > 30) {
                    situation = "VEHICLE SUBMERGED — ROLLOVER";
                    riskScore = 0.95;
                    activeRules.push("RULE 4: WATER + ROLLOVER");
                } else {
                    situation = "WATER INGRESS / SUBMERSION";
                    weights.temp = 0.05; // Reduced temp weight
                    suppression.gas = { suppressed: true, reason: "Underwater Gas Unreliable" };
                    activeRules.push("RULE 3: SUBMERSION LOGIC");
                }
            } else if (s.gas_leak && !s.fire) {
                situation = "GAS LEAK DETECTED";
                riskScore = 0.70;
                suppression.temp = { suppressed: true, reason: "Gas Ignore Temp" };
                suppression.water = { suppressed: true, reason: "Gas Priority" };
                activeRules.push("RULE 5: GAS LEAK PRIMARY");
            } else if (s.temperature > 55 && !s.fire && !s.gas_leak) {
                situation = "THERMAL OVERHEAT";
                activeRules.push("RULE 6: CRITICAL OVERHEAT");
            } else if (Math.abs(s.tilt_angle) > 45 && !s.water_detected) {
                situation = Math.abs(s.tilt_angle) > 60 ? "CRITICAL ROLLOVER" : "ROLLOVER DETECTED";
                activeRules.push("RULE 7: ROLLOVER MONITOR");
            }

            // RULE 10: BIOMETRIC DISTRESS FUSION
            if (biometricResult?.severity === 'HIGH' || biometricResult?.severity === 'MEDIUM') {
                const boost = biometricResult.severity === 'HIGH' ? 0.4 : 0.2;
                riskScore = Math.min(1.0, (riskScore || 0) + boost);
                if (riskScore > 0.8) situation = "VICTIM IN CRITICAL DISTRESS";
                activeRules.push(`RULE 10: BIOMETRIC ${biometricResult.severity} DISTRESS`);
            }

            // RULE 11: CONSCIOUSNESS MONITORING
            if (biometricResult?.consciousness === 'UNCONSCIOUS') {
                riskScore = 1.0;
                situation = "VICTIM UNCONSCIOUS — CATASTROPHIC";
                activeRules.push("RULE 11: UNCONSCIOUS VICTIM DETECTED");
            }

            // If riskScore not hardcoded by high priority rules, calculate it
            if (riskScore === 0) {
                let totalWeight = 0;
                let weightedSum = 0;

                const sensorMap = [
                    { name: "fire", val: normFire, w: weights.fire },
                    { name: "gas", val: normGas, w: weights.gas },
                    { name: "temp", val: normTemp, w: weights.temp },
                    { name: "water", val: normWater, w: weights.water },
                    { name: "tilt", val: normTilt, w: weights.tilt },
                    { name: "gforce", val: normGForce, w: weights.gforce }
                ];

                sensorMap.forEach(sm => {
                    if (!suppression[sm.name].suppressed) {
                        weightedSum += sm.val * sm.w;
                        totalWeight += sm.w;
                    }
                });

                riskScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
                if (!activeRules.length) activeRules.push("RULE 9: NORMAL FUSION");
            }
        }

        const sensorWeights = [
            { name: "Fire", normalizedValue: normFire, weight: weights.fire, suppressed: suppression.fire.suppressed, suppressReason: suppression.fire.reason },
            { name: "Gas Leak", normalizedValue: normGas, weight: weights.gas, suppressed: suppression.gas.suppressed, suppressReason: suppression.gas.reason },
            { name: "Thermal", normalizedValue: normTemp, weight: weights.temp, suppressed: suppression.temp.suppressed, suppressReason: suppression.temp.reason },
            { name: "Submersion", normalizedValue: normWater, weight: weights.water, suppressed: suppression.water.suppressed, suppressReason: suppression.water.reason },
            { name: "Tilt Angle", normalizedValue: normTilt, weight: weights.tilt, suppressed: suppression.tilt.suppressed, suppressReason: suppression.tilt.reason },
            { name: "Impact Load", normalizedValue: normGForce, weight: weights.gforce, suppressed: suppression.gforce.suppressed, suppressReason: suppression.gforce.reason }
        ];

        const end = performance.now();
        setInferenceTime(Math.round(end - start));

        return {
            riskScore: Math.min(1, Math.max(0, riskScore)),
            situation,
            confidence: biometricResult?.confidence ?? 0, 
            inferenceMs: end - start,
            activeRules,
            sensorWeights
        };
    }, [data, biometricResult, isOnline]);

    if (!data) {
        return (
            <div className="glass-card flex flex-col items-center justify-center p-12 text-center opacity-50">
                <Search className="w-12 h-12 mb-4 animate-pulse" />
                <h3 className="text-xl font-bold uppercase tracking-widest">Waiting for sensor data...</h3>
                <p className="text-sm opacity-60">Initializing LifeGuardX AI Inference Engine</p>
            </div>
        );
    }

    const { riskScore, situation, confidence, activeRules, sensorWeights } = analysis || {};

    const getRiskColor = (score: number) => {
        if (score < 0.4) return 'emerald';
        if (score < 0.7) return 'amber';
        return 'rose';
    };

    const riskColor = getRiskColor(riskScore || 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card relative overflow-hidden group mb-8"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                        <Brain className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-sm font-black text-white tracking-[0.2em] uppercase">AI Risk Analyzer</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-white/20'} ${isOnline ? 'shadow-[0_0_10px_rgba(16,185,129,0.5)]' : ''}`} />
                    <span className="text-[10px] font-bold text-secondary tracking-widest uppercase">
                        {isOnline ? 'Live Inference' : 'Link Lost'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left Side: Score & Situation */}
                <div className="space-y-8">
                    {/* Risk Score Meter */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-black text-white/40 uppercase tracking-widest">Risk Score</label>
                            <span className={`text-4xl font-black text-${riskColor}-500 transition-colors duration-500`}>
                                {Math.round((riskScore || 0) * 100)}%
                            </span>
                        </div>
                        <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-1">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(riskScore || 0) * 100}%` }}
                                transition={{ type: "spring", stiffness: 50, damping: 15 }}
                                className={`h-full bg-gradient-to-r from-${riskColor}-600 to-${riskColor}-400 rounded-full shadow-[0_0_20px_rgba(var(--accent-${riskColor}-rgb),0.3)]`}
                            />
                        </div>
                    </div>

                    {/* Situation Assessment */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={situation}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className={`p-6 rounded-[2rem] border-2 border-${riskColor}-500/30 bg-${riskColor}-500/5 backdrop-blur-md transition-colors duration-500`}
                        >
                            <div className="flex items-center gap-4 mb-3">
                                <AlertCircle className={`w-6 h-6 text-${riskColor}-400`} />
                                <h4 className="text-xl font-black text-white tracking-tight leading-none uppercase">
                                    {situation}
                                </h4>
                            </div>
                            <div className="flex gap-6 mt-6 pt-4 border-t border-white/5">
                                <div>
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Confidence</p>
                                    <p className="text-sm font-black text-white">{Math.round((confidence || 0) * 100)}%</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Inference</p>
                                    <p className="text-sm font-black text-emerald-400">{inferenceTime}ms</p>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Active Rules */}
                    <div className="space-y-3">
                         <h5 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Active Fusion Rules</h5>
                         <div className="flex flex-wrap gap-2">
                            {activeRules?.map(rule => (
                                <span key={rule} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-blue-400 uppercase tracking-wider">
                                    {rule}
                                </span>
                            ))}
                         </div>
                    </div>
                </div>

                {/* Right Side: Sensor Fusion Bar Chart */}
                <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Sensor Weight Analysis</h5>
                    <div className="space-y-4">
                        {sensorWeights?.map(sw => (
                            <div key={sw.name} className={`group/row transition-all ${sw.suppressed ? 'opacity-30' : 'opacity-100'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white/70 group-hover/row:text-white transition-colors">{sw.name}</span>
                                        {sw.suppressed && (
                                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] font-bold text-white/40 uppercase tracking-tighter">
                                                {sw.suppressReason}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-white/50">
                                        {sw.suppressed ? 'OFF' : `${Math.round(sw.normalizedValue * 100)}%`}
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    {!sw.suppressed ? (
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${sw.normalizedValue * 100}%` }}
                                            className={`h-full bg-gradient-to-r from-blue-600 to-cyan-400`}
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-white/5" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AIRiskAnalyzer;
