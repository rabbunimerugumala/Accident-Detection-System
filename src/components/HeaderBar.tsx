import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface HeaderBarProps {
    isOnline: boolean;
    vehicleId: string;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ isOnline, vehicleId, isDarkMode, toggleTheme }) => {

    const handleThemeToggle = () => {
        localStorage.setItem('lifeguardx-theme', !isDarkMode ? 'dark' : 'light');
        toggleTheme();
    };

    return (
        <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/70 border-b border-border/50 px-6 py-4 md:px-12 flex items-center justify-between transition-all duration-500">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="bg-critical/10 p-2 rounded-2xl border border-critical/20">
                        <img src="/heartbeat.png" alt="LifeGuardX Logo" className="w-8 h-8 object-contain" />
                    </div>
                    {isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-safe rounded-full border-2 border-background shadow-glow" />
                    )}
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic leading-none">
                        LIFEGUARD<span className="text-critical">X</span>
                    </h1>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1 block">
                        SECURE SHIELD PROXY • {vehicleId}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-8">
                <div className="hidden lg:flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-60">System Heartbeat</p>
                        <p className={`text-[10px] font-black uppercase tracking-tighter ${isOnline ? 'text-safe' : 'text-critical'}`}>
                            {isOnline ? 'Network Synchronized' : 'Searching for Signal...'}
                        </p>
                    </div>
                    <div className="w-px h-8 bg-border/50" />
                </div>

                <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all duration-500 ${isOnline ? 'bg-safe/[0.05] dark:bg-safe/10 border-safe/30 text-safe shadow-glow-safe' : 'bg-critical/10 border-critical/30 text-critical shadow-glow-critical'}`}>
                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-safe animate-pulse' : 'bg-critical shadow-glow'}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                </div>

                <button
                    onClick={handleThemeToggle}
                    className="p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-all text-muted-foreground hover:text-foreground border border-border/50"
                    title="Toggle Theme"
                >
                    {isDarkMode ? <Sun className="w-5 h-5 text-warning" /> : <Moon className="w-5 h-5" />}
                </button>
            </div>
        </header>
    );
};
