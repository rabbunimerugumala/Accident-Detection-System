import {
    Flame, Wind, Droplets, Zap, RotateCw, Volume2,
    Thermometer, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import { FirebaseData } from '../types';
import SensorCard from './SensorCard';

interface SensorGridProps {
    data: FirebaseData['accidentState'];
    status: string;
}


const SensorGrid: React.FC<SensorGridProps> = ({ data, status }) => {
    const isOnline = status === "ONLINE";

    // Override values if system is NOT online (Safety Reset)
    const rawSensors = data.sensors;
    const sensors = isOnline ? rawSensors : {
        fire: false,
        gas_leak: false,
        gforce: 0,
        sound_level: 0,
        temperature: 0,
        tilt_angle: 0,
        water_detected: false
    };

    const accident = isOnline ? data.accident : { detected: false, severity: "SAFE" as const };

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
                    value={accident.detected ? accident.severity : "SECURE"}
                    icon={Shield}
                    iconType={accident.detected ? "rose" : "shield"}
                    status={accident.detected ? "CRITICAL ALERT" : "MONITORING"}
                    statusColor={accident.detected ? "var(--accent-rose)" : "var(--accent-emerald)"}
                    iconColor={accident.detected ? "var(--accent-rose)" : "var(--accent-blue)"}
                    alert={accident.detected}
                >
                    <div className="mt-4 p-4 rounded-2xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/5 backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[11px] font-[1000] text-secondary uppercase tracking-[0.2em]">Severity Matrix</span>
                            <span className={`text-[11px] font-[1000] uppercase tracking-wider ${accident.detected ? 'text-red-500' : 'text-emerald-700 dark:text-emerald-500'}`}>
                                {accident.detected ? `Logic: ${accident.severity} Impact` : 'Safe Operation'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            {/* Segmented Progress: 1 for LOW, 2 for MODERATE, 3 for CRITICAL */}
                            <div className={`severity-matrix-segment transition-all duration-700 ${accident.detected ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] neon-pulse border-red-500/50' : ''}`} />
                            <div className={`severity-matrix-segment transition-all duration-700 ${accident.detected && (accident.severity === 'MODERATE' || accident.severity === 'CRITICAL') ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] neon-pulse border-red-500/50' : ''}`} />
                            <div className={`severity-matrix-segment transition-all duration-700 ${accident.detected && accident.severity === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] neon-pulse border-red-500/50' : ''}`} />
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
                    iconType="zap"
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

            {/* SOUND/ACOUSTICS */}
            <motion.div variants={item}>
                <SensorCard
                    title="Acoustics"
                    value={sensors.sound_level}
                    unit="%"
                    icon={Volume2}
                    iconType="indigo"
                    status="AMBIENT"
                    statusColor="var(--accent-emerald)"
                    iconColor="var(--accent-indigo)"
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
                    iconType="amber"
                    status={sensors.temperature > 50 ? "OVERHEAT" : "OPTIMAL"}
                    statusColor={sensors.temperature > 50 ? "var(--accent-rose)" : "var(--accent-emerald)"}
                    iconColor="var(--accent-amber)"
                    alert={sensors.temperature > 50}
                    percentage={(sensors.temperature / 100) * 100}
                />
            </motion.div>
        </motion.div>
    );
};

export default SensorGrid;
