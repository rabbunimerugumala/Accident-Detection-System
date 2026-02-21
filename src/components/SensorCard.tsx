import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SensorCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    unit?: string;
    severity: 'SAFE' | 'WARNING' | 'DANGER' | 'CRITICAL';
    isOnline: boolean;
    color: string;
}

export const SensorCard: React.FC<SensorCardProps> = ({ icon: Icon, label, value, unit, severity, isOnline, color }) => {

    const severityStyles = {
        SAFE: 'border-safe/20 bg-safe/[0.03] dark:bg-safe/5 glow-safe',
        WARNING: 'border-warning/30 bg-warning/[0.03] dark:bg-warning/5 glow-warning',
        DANGER: 'border-danger/30 bg-danger/[0.03] dark:bg-danger/5 glow-danger',
        CRITICAL: 'border-critical/40 bg-critical/[0.03] dark:bg-critical/5 glow-critical shadow-hazard',
    };

    const activeSeverity = isOnline ? severity : 'SAFE';
    const styleClass = severityStyles[activeSeverity];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`premium-card group relative overflow-hidden ${styleClass}`}
        >
            <div className="absolute inset-0 tech-grid opacity-[0.03] pointer-events-none" />

            <div className="relative z-10 flex justify-between items-start mb-6">
                <div
                    className="p-3.5 rounded-2xl bg-foreground/5 border border-border/50 backdrop-blur-md shadow-inner transition-colors duration-500"
                    style={{ color: isOnline ? color : 'var(--color-muted-foreground)' }}
                >
                    <Icon className="w-6 h-6" />
                </div>
                {isOnline && (
                    <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border backdrop-blur-sm transition-all duration-500`}
                        style={{
                            borderColor: color,
                            color: color,
                            backgroundColor: `${color}15`
                        }}>
                        {severity}
                    </div>
                )}
            </div>

            <div className="relative z-10 space-y-2">
                <p className="text-muted-foreground text-[11px] font-black uppercase tracking-[0.3em] mb-2">{label}</p>
                <div className="flex items-baseline gap-2">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={value}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="text-3xl md:text-5xl font-black tracking-tighter text-heading drop-shadow-sm"
                        >
                            {isOnline ? value : '0'}
                        </motion.p>
                    </AnimatePresence>
                    {unit && isOnline && (
                        <span className="text-sm font-black text-muted-foreground/60 uppercase tracking-widest">{unit}</span>
                    )}
                </div>
            </div>

            <div className="mt-8 relative h-1.5 w-full bg-foreground/[0.03] rounded-full overflow-hidden border border-border/10">
                <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                        background: `linear-gradient(to right, ${color}40, ${color})`,
                        boxShadow: `0 0 10px ${color}80`
                    }}
                    initial={{ width: 0 }}
                    animate={{
                        width: !isOnline ? '0%' : (severity === 'SAFE' ? '100%' : severity === 'WARNING' ? '60%' : severity === 'DANGER' ? '35%' : '15%')
                    }}
                    transition={{ type: "spring", stiffness: 40, damping: 15 }}
                />
            </div>

            {/* Background Decorative Alpha Label */}
            <div className="absolute right-[-10px] bottom-[-10px] text-5xl font-black italic opacity-[0.02] select-none pointer-events-none group-hover:opacity-[0.05] transition-opacity uppercase">
                {label.split(' ')[0]}
            </div>
        </motion.div>
    );
};
