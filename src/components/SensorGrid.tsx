import React, { useState } from 'react';
import {
    Flame, Wind, Droplets, Zap, RotateCw,
    Thermometer, Bug
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FirebaseData, VictimSeverityData } from '../types';
import SensorCard from './SensorCard';
import AIAccidentShield from './AIAccidentShield/AIAccidentShield';

interface SensorGridProps {
    data: FirebaseData['accidentState'];
    status: string;
    buttonRaw: boolean;
    showOnlyHero?: boolean;
    showOnlySensors?: boolean;
    onBiometricUpdate?: (result: VictimSeverityData) => void;
}


const SensorGrid: React.FC<SensorGridProps> = ({ data, status, buttonRaw, showOnlyHero, showOnlySensors, onBiometricUpdate }) => {
    const isOnline = status === "ONLINE";
    const [debugOpen, setDebugOpen] = useState(false);

    // Override values if system is NOT online (Safety Reset)
    const rawSensors = data.sensors;
    const sensors = isOnline ? rawSensors : {
        fire: false,
        gas_leak: false,
        gforce: 0,
        temperature: 0,
        tilt_angle: 0,
        water_detected: false
    };

    const accident = isOnline ? data.accident : { detected: false, severity: "SAFE" as const };
    const buttonPressed = isOnline ? data.button_pressed : false;
    const buttonRawState = isOnline ? buttonRaw : false;

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "circOut" } }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 px-2 ${!showOnlyHero ? 'pb-20' : ''}`}
        >
            {/* HERO: ACCIDENT STATUS (Full width) */}
            {!showOnlySensors && (
            <motion.div variants={item} className="col-span-1 md:col-span-2 xl:col-span-3">
                <AIAccidentShield
                    sensors={sensors}
                    accident={accident}
                    evidence={data.evidence}
                    vehicleId={data.vehicle_id}
                    onBiometricUpdate={onBiometricUpdate}
                />
            </motion.div>
            )}

            {!showOnlyHero && (
                <>
            {/* IMPACT FORCE */}
            <motion.div variants={item}>
                <SensorCard
                    title="Impact Force"
                    value={sensors.gforce.toFixed(2)}
                    unit="g"
                    icon={Zap}
                    iconType="zap"
                    status={sensors.gforce > 2.5 ? "HIGH G-LOAD" : "NORMAL"}
                    statusColor={sensors.gforce > 2.5 ? "var(--accent-rose)" : "var(--accent-emerald)"}
                    iconColor="var(--accent-amber)"
                    alert={sensors.gforce > 2.5}
                    percentage={(sensors.gforce / 8) * 100}
                />
            </motion.div>

            {/* CHASSIS TILT (MPU Priority) */}
            <motion.div variants={item}>
                <SensorCard
                    title="Chassis Tilt"
                    value={sensors.tilt_angle.toFixed(1)}
                    unit="°"
                    icon={RotateCw}
                    iconType="cyan"
                    status={Math.abs(sensors.tilt_angle) > 35 ? "STABILITY RISK" : "LEVEL"}
                    statusColor={Math.abs(sensors.tilt_angle) > 35 ? "var(--accent-rose)" : "var(--accent-emerald)"}
                    iconColor="var(--accent-cyan)"
                    alert={Math.abs(sensors.tilt_angle) > 35}
                    percentage={(sensors.tilt_angle / 90) * 100}
                    isCenteredBar
                />
            </motion.div>

            {/* FIRE DETECTOR */}
            <motion.div variants={item}>
                <SensorCard
                    title="Fire Sentinel"
                    value={sensors.fire ? "FIRE!" : "CLEAR"}
                    icon={Flame}
                    iconType="flame"
                    status={sensors.fire ? "HAZARD DETECTED" : "NOMINAL"}
                    statusColor={sensors.fire ? "var(--accent-rose)" : "var(--accent-emerald)"}
                    iconColor="var(--accent-rose)"
                    alert={sensors.fire}
                    percentage={sensors.fire ? 100 : 0}
                />
            </motion.div>

            {/* GAS LEAK */}
            <motion.div variants={item}>
                <SensorCard
                    title="Atmosphere"
                    value={sensors.gas_leak ? "LEAK" : "STABLE"}
                    icon={Wind}
                    iconType="emerald"
                    status={sensors.gas_leak ? "TOXIC HAZARD" : "SAFE"}
                    statusColor={sensors.gas_leak ? "var(--accent-rose)" : "var(--accent-emerald)"}
                    iconColor="var(--accent-emerald)"
                    alert={sensors.gas_leak}
                    percentage={sensors.gas_leak ? 100 : 0}
                />
            </motion.div>

            {/* SUBMERSION */}
            <motion.div variants={item}>
                <SensorCard
                    title="Submersion"
                    value={sensors.water_detected ? "WET" : "DRY"}
                    icon={Droplets}
                    iconType="blue"
                    status={sensors.water_detected ? "WATER ENTRY" : "UNFILTERED"}
                    statusColor={sensors.water_detected ? "var(--accent-rose)" : "var(--accent-emerald)"}
                    iconColor="var(--accent-blue)"
                    alert={sensors.water_detected}
                    percentage={sensors.water_detected ? 100 : 0}
                />
            </motion.div>

            {/* TEMPERATURE */}
            <motion.div variants={item}>
                <SensorCard
                    title="Thermal Core"
                    value={sensors.temperature.toFixed(1)}
                    unit="°C"
                    icon={Thermometer}
                    iconType="amber"
                    status={sensors.temperature > 50 ? "OVERHEAT" : "OPTIMAL"}
                    statusColor={sensors.temperature > 50 ? "var(--accent-rose)" : "var(--accent-emerald)"}
                    iconColor="var(--accent-amber)"
                    alert={sensors.temperature > 50}
                    percentage={(sensors.temperature / 100) * 100}
                />
            </motion.div>

            {/* ── DEBUG PANEL ── */}
            <motion.div variants={item} className="col-span-1 md:col-span-2 xl:col-span-3">
                <div
                    className="rounded-2xl overflow-hidden transition-all duration-300"
                    style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}
                >
                    <button
                        onClick={() => setDebugOpen(o => !o)}
                        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white/5 transition-colors group"
                    >
                        <span className="flex items-center gap-2 text-[11px] font-black text-secondary uppercase tracking-[0.3em] group-hover:text-main transition-colors">
                            <Bug className="w-3.5 h-3.5" />
                            Hardware Debug Panel
                        </span>
                        <span className="text-[10px] font-bold text-secondary/60 tracking-widest uppercase">
                            {debugOpen ? "▲ hide" : "▼ show"}
                        </span>
                    </button>

                    <AnimatePresence>
                        {debugOpen && (
                            <motion.div
                                key="debug-panel"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <div className="px-5 pb-5 pt-1 grid grid-cols-2 gap-4">
                                    {/* Button Latch */}
                                    <div className={`flex flex-col gap-1.5 p-4 rounded-xl border transition-all duration-500 ${buttonPressed
                                        ? 'border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                                        : 'border-white/10 bg-white/5'
                                        }`}>
                                        <span className="text-[10px] font-black text-secondary uppercase tracking-[0.25em]">
                                            Button Latch&nbsp;
                                            <span className="text-secondary/50 font-semibold normal-case tracking-normal">(12 s hold)</span>
                                        </span>
                                        <span className={`text-2xl font-black leading-none tracking-tight ${buttonPressed ? 'text-emerald-400' : 'text-secondary/40'
                                            }`}>
                                            {buttonPressed ? "TRUE" : "false"}
                                        </span>
                                        <span className="text-[10px] font-semibold text-secondary/50">
                                            {buttonPressed ? "▶ Latched (ESP32 timer running)" : "○ Idle"}
                                        </span>
                                    </div>

                                    {/* Button Raw */}
                                    <div className={`flex flex-col gap-1.5 p-4 rounded-xl border transition-all duration-500 ${buttonRawState
                                        ? 'border-amber-500/40 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                                        : 'border-white/10 bg-white/5'
                                        }`}>
                                        <span className="text-[10px] font-black text-secondary uppercase tracking-[0.25em]">
                                            Button Raw&nbsp;
                                            <span className="text-secondary/50 font-semibold normal-case tracking-normal">(live pin)</span>
                                        </span>
                                        <span className={`text-2xl font-black leading-none tracking-tight ${buttonRawState ? 'text-amber-400' : 'text-secondary/40'
                                            }`}>
                                            {buttonRawState ? "PRESSED" : "idle"}
                                        </span>
                                        <span className="text-[10px] font-semibold text-secondary/50">
                                            {buttonRawState ? "▶ Physically held right now" : "○ Not held"}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
            </>
            )}
        </motion.div>
    );
};

export default SensorGrid;
