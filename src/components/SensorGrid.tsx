import React from 'react';
import {
    Flame, Wind, Droplets, Zap, RotateCcw, Volume2,
    Thermometer, Clock, ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';
import { FirebaseData } from '../types';
import SensorCard from './SensorCard';

interface SensorGridProps {
    data: FirebaseData['accidentState'];
    age: number;
}


const SensorGrid: React.FC<SensorGridProps> = ({ data, age }) => {
    const sensors = data.sensors;

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
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 px-2 pb-20"
        >
            {/* HERO: ACCIDENT STATUS (Col-span-2) */}
            <motion.div variants={item} className="md:col-span-2">
                <SensorCard
                    isHero
                    title="Accident Shield & Severity"
                    value={data.accident.detected ? data.accident.severity : "SECURE"}
                    icon={ShieldAlert}
                    status={data.accident.detected ? "CRITICAL ALERT" : "MONITORING"}
                    statusColor={data.accident.detected ? "var(--accent-rose)" : "var(--accent-emerald)"}
                    iconColor={data.accident.detected ? "var(--accent-rose)" : "var(--accent-blue)"}
                    alert={data.accident.detected}
                    percentage={data.accident.detected ? 100 : 0}
                >
                    <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Severity Matrix</span>
                            <span className={`text-[10px] font-black uppercase ${data.accident.detected ? 'text-red-500' : 'text-emerald-500'}`}>
                                {data.accident.detected ? 'Logic: Critical G-Force/Tilt' : 'Safe Operation'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <div className={`h-1 flex-1 rounded-full ${data.accident.detected ? 'bg-red-500' : 'bg-slate-700'}`} />
                            <div className={`h-1 flex-1 rounded-full ${data.accident.detected ? 'bg-red-500' : 'bg-slate-700'}`} />
                            <div className={`h-1 flex-1 rounded-full ${data.accident.detected ? 'bg-red-500' : 'bg-slate-700'}`} />
                        </div>
                    </div>
                </SensorCard>
            </motion.div>

            {/* IMPACT FORCE (MPU Priority) */}
            <motion.div variants={item}>
                <SensorCard
                    title="Impact Force"
                    value={sensors.gforce.toFixed(2)}
                    unit="g"
                    icon={Zap}
                    status={sensors.gforce > 2.5 ? "HIGH G-LOAD" : "NORMAL"}
                    statusColor={sensors.gforce > 2.5 ? "var(--accent-rose)" : "var(--accent-emerald)"}
                    iconColor="var(--accent-amber)"
                    alert={sensors.gforce > 2.5}
                    percentage={(sensors.gforce / 8) * 100} // Capped at 8g for scale
                />
            </motion.div>

            {/* CHASSIS TILT (MPU Priority) */}
            <motion.div variants={item}>
                <SensorCard
                    title="Chassis Tilt"
                    value={sensors.tilt_angle.toFixed(1)}
                    unit="°"
                    icon={RotateCcw}
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
                    status={sensors.water_detected ? "WATER ENTRY" : "UNFILTERED"}
                    statusColor={sensors.water_detected ? "var(--accent-rose)" : "var(--accent-emerald)"}
                    iconColor="var(--accent-blue)"
                    alert={sensors.water_detected}
                    percentage={sensors.water_detected ? 100 : 0}
                />
            </motion.div>

            {/* SOUND */}
            <motion.div variants={item}>
                <SensorCard
                    title="Acoustics"
                    value={sensors.sound_level}
                    unit="%"
                    icon={Volume2}
                    status={sensors.sound_level > 80 ? "PEAK NOISE" : "AMBIENT"}
                    statusColor={sensors.sound_level > 80 ? "var(--accent-rose)" : "var(--accent-emerald)"}
                    iconColor="var(--accent-indigo)"
                    alert={sensors.sound_level > 80}
                    percentage={sensors.sound_level}
                />
            </motion.div>

            {/* TEMPERATURE */}
            <motion.div variants={item}>
                <SensorCard
                    title="Thermal Core"
                    value={sensors.temperature.toFixed(1)}
                    unit="°C"
                    icon={Thermometer}
                    status={sensors.temperature > 50 ? "OVERHEAT" : "OPTIMAL"}
                    statusColor={sensors.temperature > 50 ? "var(--accent-rose)" : "var(--accent-emerald)"}
                    iconColor="var(--accent-amber)"
                    alert={sensors.temperature > 50}
                    percentage={(sensors.temperature / 100) * 100}
                />
            </motion.div>

            {/* SYSTEM STATUS */}
            <motion.div variants={item}>
                <SensorCard
                    title="Telemetry Link"
                    value={age < 10 ? "LINKED" : "LOST"}
                    icon={Clock}
                    status={age < 10 ? "SYNCHRONIZED" : "OFFLINE"}
                    statusColor={age < 10 ? "var(--accent-emerald)" : "var(--accent-rose)"}
                    iconColor={age < 10 ? "var(--accent-blue)" : "var(--accent-rose)"}
                    alert={age >= 10}
                    percentage={Math.max(0, 100 - (age * 10))}
                />
            </motion.div>
        </motion.div>
    );
};

export default SensorGrid;
