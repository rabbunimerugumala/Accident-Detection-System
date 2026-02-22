import React from 'react';
import { ShieldCheck, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
    vehicleId: string;
    status: string;
    isCritical: boolean;
    isDark: boolean;
    onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ status, isCritical, isDark, onToggleTheme }) => {
    const isOnline = status === "ONLINE";

    return (
        <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-header border-b border-color transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

                {/* Logo & Branding */}
                <div className="flex items-center gap-4">
                    <motion.div
                        animate={isCritical ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
                        transition={{ repeat: isCritical ? Infinity : 0, duration: 2 }}
                        className={`p-3 rounded-2xl shadow-xl transition-all ${isCritical ? 'bg-danger text-white shadow-danger/20' : 'bg-blue-600 text-white shadow-blue-500/20'
                            }`}
                    >
                        <ShieldCheck className="w-7 h-7" />
                    </motion.div>
                    <div className="hidden sm:block">
                        <h1 className="text-2xl font-black tracking-tighter text-main leading-none">
                            LIFEGUARD<span className="text-blue-500">X</span>
                        </h1>
                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mt-1 opacity-70">
                            Pro Telemetry Dashboard
                        </p>
                    </div>
                </div>

                {/* Status & Options */}
                <div className="flex items-center gap-4 sm:gap-6">
                    {/* Vehicle ID */}
                    <div className="hidden md:block">
                        <span className="text-lg font-black tracking-tighter text-main">
                            VEHICLE_01<span className="text-blue-500">X</span>
                        </span>
                    </div>

                    <div className="hidden md:w-[1px] md:h-8 md:bg-white/10" />

                    {/* Offline Badge (Pulse only if offline) */}
                    <motion.div
                        animate={!isOnline ? { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all ${isOnline
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
                            : 'bg-danger/10 border-danger/20 text-danger'
                            }`}
                    >
                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-danger'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                            {isOnline ? "Link Stable" : "Offline"}
                        </span>
                    </motion.div>

                    {/* Theme Toggle */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onToggleTheme}
                        className="p-3 rounded-2xl bg-white/5 border border-white/5 shadow-inner text-main hover:border-blue-500/30 transition-colors"
                    >
                        {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-blue-600" />}
                    </motion.button>
                </div>

            </div>
        </header>
    );
};

export default Header;
