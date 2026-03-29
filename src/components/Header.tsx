import { Radio, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
    status: string;
    isCritical: boolean;
    isDark: boolean;
    onToggleTheme: () => void;
    buttonPressed: boolean;
    accidentDetected: boolean;
}

const Header: React.FC<HeaderProps> = ({ status, isCritical, isDark, onToggleTheme }) => {
    const isOnline = status === "ONLINE";

    return (
        <header
            className="sticky top-0 z-50 w-full backdrop-blur-md border-b shadow-2xl transition-all duration-500"
            style={{
                backgroundColor: 'var(--bg-header)',
                borderColor: 'var(--border-color)',
                boxShadow: '0 1px 30px rgba(0,0,0,0.06)'
            }}
        >
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
                        <h1 className="text-3xl font-[1000] tracking-tighter leading-none uppercase" style={{ color: 'var(--text-main)' }}>
                            LIFEGUARD<span style={{ color: 'var(--accent-blue)' }}>X</span>
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-2 opacity-80" style={{ color: 'var(--text-secondary)' }}>
                            Pro Telemetry Dashboard
                        </p>
                    </div>
                </div>

                {/* CENTER: Empty for Centered Messaging (Toasts) */}
                <div className="flex justify-center items-center">
                    {/* Centered Messages will appear here via Toaster */}
                </div>

                {/* Right: Connectivity Status + Theme Toggle */}
                <div className="flex justify-end items-center gap-3">
                    <motion.div
                        animate={!isOnline ? { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all ${isOnline
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-lg shadow-emerald-500/5'
                            : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                            }`}
                    >
                        <Radio className={`w-4 h-4 ${isOnline ? 'text-emerald-500' : 'text-red-500'}`} />
                        <span className="text-[11px] font-black uppercase tracking-widest leading-none">
                            {isOnline ? "Online" : "Offline"}
                        </span>
                    </motion.div>

                    {/* Theme Toggle Button */}
                    <button
                        onClick={onToggleTheme}
                        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                        className="p-2.5 rounded-2xl border transition-all duration-300 hover:scale-105 active:scale-95"
                        style={{
                            borderColor: 'var(--border-color)',
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--text-secondary)',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-blue)';
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent-blue)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-color)';
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                        }}
                    >
                        {isDark
                            ? <Sun className="w-4 h-4 transition-transform duration-300 hover:rotate-12" />
                            : <Moon className="w-4 h-4 transition-transform duration-300 hover:-rotate-12" />
                        }
                    </button>
                </div>

            </div>
        </header>
    );
};

export default Header;

