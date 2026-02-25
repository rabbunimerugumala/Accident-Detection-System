import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface SensorCardProps {
    title: string;
    value: string | number;
    unit?: string;
    icon: LucideIcon;
    status?: string;
    statusColor?: string;
    iconColor?: string;
    alert?: boolean;
    percentage?: number; // For progress bars
    isCenteredBar?: boolean; // For tilt (-90 to 90)
    isHero?: boolean; // For big Accident card
    iconType?: 'zap' | 'flame' | 'shield' | 'emerald' | 'blue' | 'amber' | 'rose' | 'indigo' | 'cyan';
    children?: React.ReactNode;
}

const SensorCard: React.FC<SensorCardProps> = ({
    title,
    value,
    unit,
    icon: Icon,
    status,
    statusColor = 'var(--text-secondary)',
    iconColor = 'var(--accent-blue)',
    alert = false,
    percentage,
    isCenteredBar = false,
    isHero = false,
    iconType = 'blue',
    children
}) => {

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-card relative flex flex-col h-full overflow-hidden border transition-all duration-500 hover:border-blue-500/50 
                ${alert ? 'border-red-500/40 ring-1 ring-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]' : 'border-color'}
                ${isHero ? 'md:col-span-2' : ''}
                shadow-2xl shadow-slate-200/50 dark:shadow-none
            `}
        >
            {/* Background Accent Gradient */}
            <div
                className="absolute -top-24 -right-24 w-64 h-64 opacity-[0.1] pointer-events-none rounded-full blur-[80px]"
                style={{ background: iconColor }}
            />

            <div className={`flex justify-between items-start z-10 relative ${isHero ? 'mb-4' : ''}`}>
                <div className="flex-1">
                    <span className="label-pro tracking-[0.4em]">{title}</span>
                    <div className="flex items-baseline gap-2 mt-3">
                        <div className="relative overflow-hidden h-16 lg:h-20 flex items-center">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={value}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className={`${isHero ? 'text-7xl lg:text-8xl' : 'text-5xl lg:text-6xl'} font-black text-main tracking-tighter`}
                                >
                                    {value}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                        {unit && (
                            <span className="text-xl font-bold text-slate-500 mb-2 tracking-tight opacity-50">{unit}</span>
                        )}
                    </div>
                </div>

                <div
                    className={`icon-container group icon-${iconType} ${alert ? 'neon-pulse shadow-red-500/30 text-red-500 border-red-500/30' : 'shadow-sm border border-white/20 dark:border-white/5'}`}
                >
                    <Icon className="w-7 h-7 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 icon-glow" />
                </div>
            </div>

            <div className="mt-8 z-10 relative flex flex-col justify-between flex-1">
                {/* Progress Bar Implementation */}
                {percentage !== undefined && (
                    <div className="mb-8">
                        <div className="progress-container">
                            {isCenteredBar ? (
                                /* Centered Bar for Tilt (-90 to 90) */
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-[3px] h-full bg-slate-400/30 dark:bg-white/20 z-20" /> {/* Center line */}
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: `${Math.abs(percentage)}%`,
                                            left: percentage >= 0 ? '50%' : 'auto',
                                            right: percentage < 0 ? '50%' : 'auto'
                                        }}
                                        className="h-full absolute transition-all duration-1000"
                                        style={{
                                            background: percentage >= 0
                                                ? `linear-gradient(to right, ${iconColor}, var(--accent-indigo))`
                                                : `linear-gradient(to left, ${iconColor}, var(--accent-rose))`,
                                            color: iconColor
                                        } as any}
                                    />
                                </div>
                            ) : (
                                /* Regular Progress Bar */
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                                    transition={{ duration: 1.2, ease: "circOut" }}
                                    className="progress-fill h-full"
                                    style={{
                                        background: alert
                                            ? 'linear-gradient(to right, #f87171, #ef4444)'
                                            : `linear-gradient(to right, var(--accent-cyan), ${iconColor})`,
                                        color: alert ? 'var(--accent-rose)' : iconColor
                                    } as any}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Bottom Section: Status & Children */}
                <div className="flex flex-col gap-4">
                    {status && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black tracking-widest uppercase opacity-70" style={{ color: statusColor }}>
                                    {status}
                                </span>
                                {alert && (
                                    <motion.div
                                        animate={{ opacity: [1, 0, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                                    />
                                )}
                            </div>
                            {alert && (
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1], opacity: [0.9, 1, 0.9] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="px-3 py-1 bg-red-500/15 border border-red-500/30 rounded-xl"
                                >
                                    <span className="text-[9px] font-black text-red-500 tracking-wider uppercase">Hazard Protocol</span>
                                </motion.div>
                            )}
                        </div>
                    )}
                    {children}
                </div>
            </div>
        </motion.div>
    );
};

export default SensorCard;
