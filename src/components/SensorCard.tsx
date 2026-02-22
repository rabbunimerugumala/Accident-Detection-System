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
    children
}) => {

    return (
        <motion.div
            layout
            whileHover={{ y: -8, scale: 1.01 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-card relative flex flex-col justify-between w-full transition-all duration-500 ${isHero ? 'min-h-[420px] lg:col-span-2' : 'min-h-[280px]'
                } ${alert ? 'ring-2 ring-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)]' : ''}`}
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
                    className={`icon-container group ${alert ? 'neon-pulse shadow-red-500/30 text-red-500 border-red-500/30' : ''}`}
                    style={{ color: alert ? undefined : iconColor }}
                >
                    <Icon className={`w-9 h-9 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`} />
                </div>
            </div>

            <div className="mt-8 z-10 relative">
                {/* Progress Bar Implementation */}
                {percentage !== undefined && (
                    <div className="mb-8">
                        <div className="progress-track">
                            {isCenteredBar ? (
                                /* Centered Bar for Tilt (-90 to 90) */
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-[2px] h-full bg-white/20 z-20" /> {/* Center line */}
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: `${Math.abs(percentage)}%`,
                                            left: percentage >= 0 ? '50%' : 'auto',
                                            right: percentage < 0 ? '50%' : 'auto'
                                        }}
                                        className="h-full absolute transition-all duration-1000 shadow-xl"
                                        style={{
                                            background: percentage >= 0
                                                ? `linear-gradient(to right, ${iconColor}, #818cf8)`
                                                : `linear-gradient(to left, ${iconColor}, #f472b6)`,
                                            boxShadow: `0 0 15px ${iconColor}40`
                                        }}
                                    />
                                </div>
                            ) : (
                                /* Regular Progress Bar */
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                                    transition={{ duration: 1.2, ease: "circOut" }}
                                    className="progress-fill shadow-lg h-full"
                                    style={{
                                        background: `linear-gradient(to right, ${iconColor}cc, ${alert ? 'var(--accent-rose)' : iconColor})`,
                                        boxShadow: `0 0 20px ${iconColor}30`
                                    }}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Status Indicator at the bottom */}
                {status && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative flex items-center justify-center">
                                <div
                                    className={`w-2.5 h-2.5 rounded-full ${alert ? 'animate-ping opacity-75' : ''}`}
                                    style={{ backgroundColor: alert ? 'var(--accent-rose)' : statusColor }}
                                />
                                <div
                                    className="absolute w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: alert ? 'var(--accent-rose)' : statusColor }}
                                />
                            </div>
                            <span className="text-[12px] font-black tracking-[0.25em] uppercase opacity-80" style={{ color: statusColor }}>
                                {status}
                            </span>
                        </div>
                        {alert && (
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg"
                            >
                                <span className="text-[10px] font-black text-red-500 tracking-widest whitespace-nowrap uppercase">Protocol Required</span>
                            </motion.div>
                        )}
                    </div>
                )}

                {children}
            </div>
        </motion.div>
    );
};

export default SensorCard;
