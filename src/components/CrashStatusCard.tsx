import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Activity, MapPin, Radio } from 'lucide-react';

interface CrashStatusCardProps {
    accident: {
        detected: boolean;
        severity: string;
    };
    location: {
        latitude: number;
        longitude: number;
        gps_fix: boolean;
    };
    timestamp: number;
    isOnline: boolean;
    severity: 'SAFE' | 'WARNING' | 'DANGER' | 'CRITICAL';
    deviceStatus: string;
}

export const CrashStatusCard: React.FC<CrashStatusCardProps> = ({
    accident,
    location,
    timestamp,
    isOnline,
    severity,
    deviceStatus
}) => {

    const colors = {
        SAFE: 'from-safe/20 to-safe/40 dark:from-safe/10 dark:to-safe/20',
        WARNING: 'from-warning/30 to-warning/50 dark:from-warning/10 dark:to-warning/20',
        DANGER: 'from-danger/30 to-danger/50 dark:from-danger/10 dark:to-danger/20',
        CRITICAL: 'from-critical/40 to-critical/60 dark:from-critical/20 dark:to-critical/30',
    };

    const isCritical = severity === 'CRITICAL' || accident.detected;
    const bgGradient = isOnline ? colors[severity] : 'from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900';

    const formattedTime = timestamp > 0
        ? new Date(timestamp).toLocaleTimeString([], { hour12: false })
        : '--:--:--';

    return (
        <motion.div
            layout
            className={`w-full rounded-[2.5rem] p-8 md:p-12 transition-all duration-1000 bg-gradient-to-br ${bgGradient} border border-white/20 dark:border-white/5 relative overflow-hidden shadow-2xl glass`}
        >
            <div className="absolute inset-0 tech-grid opacity-20 pointer-events-none" />
            <div className="scanline" />

            {isCritical && isOnline && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.2, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 bg-white"
                />
            )}

            <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center justify-between">
                <div className="flex items-center gap-8">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white/10 p-6 rounded-[2rem] backdrop-blur-2xl border border-white/20 shadow-2xl relative"
                    >
                        {isCritical ? <ShieldAlert size={64} className="text-white" /> : <ShieldCheck size={64} className="text-white" />}
                        {isOnline && (
                            <div className="absolute top-2 right-2 flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            </div>
                        )}
                    </motion.div>

                    <div>
                        <div className="flex items-center gap-2 mb-2 opacity-70">
                            <Radio size={14} className="animate-pulse text-accent" />
                            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground/60">TELEMETRIC COMMAND CENTER</span>
                        </div>
                        <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase leading-none drop-shadow-2xl text-heading">
                            {isOnline && severity}
                        </h2>
                        <div className="mt-4 flex items-center gap-4">
                            <span className="px-3 py-1 bg-foreground/5 dark:bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-foreground/10 dark:border-white/10 text-foreground/80 dark:text-white/80">
                                {deviceStatus}
                            </span>
                            <span className="text-[10px] font-bold opacity-40 tracking-[0.2em] uppercase text-foreground">LINK STABILITY: 98.4%</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-16 w-full md:w-auto">
                    <Stat icon={Activity} label="ACCIDENT DET." value={accident.detected ? "CRASH!!" : "NOMINAL"} critical={accident.detected} />
                    <Stat icon={MapPin} label="GPS LOCK" value={location.gps_fix ? "LOCKED" : "WAITING FOR GPS"} warning={!location.gps_fix} />
                    <Stat icon={Radio} label="LAST HANDSHAKE" value={formattedTime} />
                    <Stat icon={Activity} label="SYSTEM MODE" value={isOnline ? "ACTIVE" : "STANDBY"} />
                </div>
            </div>

            {/* Decorative Overlay */}
            <div className="absolute right-[-30px] bottom-[-60px] text-[180px] font-black italic opacity-[0.05] pointer-events-none select-none tracking-tighter uppercase leading-none">
                {severity}
            </div>
        </motion.div>
    );
};

const Stat = ({ icon: Icon, label, value, critical, warning }: { icon: any, label: string, value: string, critical?: boolean, warning?: boolean }) => (
    <div className="space-y-2">
        <div className="flex items-center gap-2 opacity-50">
            <Icon size={14} className="text-accent" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground">{label}</span>
        </div>
        <p className={`text-xl font-black tracking-tight uppercase drop-shadow-sm ${critical ? 'text-critical animate-pulse' : warning ? 'text-warning' : 'text-foreground'}`}>
            {value}
        </p>
    </div>
);
