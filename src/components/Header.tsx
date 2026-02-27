import { Radio } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
    status: string;
    isCritical: boolean;
    isDark: boolean;
    onToggleTheme: () => void;
    buttonPressed: boolean;
    accidentDetected: boolean;
}

const Header: React.FC<HeaderProps> = ({ status, isCritical, isDark: _isDark, onToggleTheme: _onToggleTheme, buttonPressed: _buttonPressed, accidentDetected: _accidentDetected }) => {
    const isOnline = status === "ONLINE";

    return (
        <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-header/95 border-b border-white/10 shadow-2xl shadow-slate-950/30 transition-all duration-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 grid grid-cols-3 items-center">

                {/* Logo & Branding */}
                <div className="flex items-center gap-5">
                    <div className={`p-3 rounded-2xl transition-all duration-500 backdrop-blur-xl border ${isCritical
                        ? 'bg-red-500/10 border-red-500/60 shadow-lg shadow-red-500/30'
                        : 'bg-emerald-500/10 border-emerald-500/60 shadow-lg shadow-emerald-500/30'
                        }`}>
                        <img src="/heartbeat.png" alt="LifeGuardX Logo" className="w-8 h-8 object-contain" />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-3xl font-[1000] tracking-tighter text-main leading-none uppercase">
                            LIFEGUARD<span className="text-blue-500">X</span>
                        </h1>
                        <p className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] mt-2 opacity-80">
                            Pro Telemetry Dashboard
                        </p>
                    </div>
                </div>

                {/* CENTER: Empty for Centered Messaging (Toasts) */}
                <div className="flex justify-center items-center">
                    {/* Centered Messages will appear here via Toaster */}
                </div>

                {/* Right: Connectivity Status only */}
                <div className="flex justify-end items-center gap-4">
                    <motion.div
                        animate={!isOnline ? { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all ${isOnline
                            ? 'bg-emerald-500/15 dark:bg-emerald-500/10 border-emerald-500/40 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-500 shadow-lg shadow-emerald-500/5'
                            : 'bg-danger/20 dark:bg-danger/10 border-danger/40 dark:border-danger/20 text-danger'
                            }`}
                    >
                        <Radio className={`w-4 h-4 ${isOnline ? 'text-emerald-500' : 'text-danger'}`} />
                        <span className="text-[11px] font-black uppercase tracking-widest leading-none">
                            {isOnline ? "Online" : "Offline"}
                        </span>
                    </motion.div>
                </div>

            </div>
        </header>
    );
};

export default Header;
