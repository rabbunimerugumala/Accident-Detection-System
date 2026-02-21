import React, { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

interface HeaderBarProps {
    isOnline: boolean;
    vehicleId: string;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ isOnline, vehicleId, isDarkMode, toggleTheme }) => {
    // Single source of truth for theme persistence
    useEffect(() => {
        const savedTheme = localStorage.getItem('lifeguardx-theme');
        if (savedTheme === 'dark' && !isDarkMode) {
            toggleTheme();
        } else if (savedTheme === 'light' && isDarkMode) {
            toggleTheme();
        } else if (!savedTheme) {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (systemPrefersDark && !isDarkMode) toggleTheme();
        }
    }, []);

    const handleThemeToggle = () => {
        localStorage.setItem('lifeguardx-theme', !isDarkMode ? 'dark' : 'light');
        toggleTheme();
    };

    return (
        <header className="sticky top-0 z-50 w-full glass border-b px-4 py-3 md:px-8 flex items-center justify-between transition-all duration-500">
            <div className="flex items-center gap-2 md:gap-3">
                <div className="bg-critical/10 p-1.5 rounded-xl">
                    <img src="/heartbeat.png" alt="LifeGuardX Logo" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
                </div>
                <div>
                    <h1 className="text-lg md:text-xl font-black tracking-tighter uppercase italic text-heading">
                        LifeGuard<span className="text-critical">X</span>
                    </h1>
                    <div className="flex items-center gap-1.5 mt-[-2px]">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                            {vehicleId}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                <div className="hidden sm:flex flex-col items-end mr-2">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50">System Heartbeat</span>
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${isOnline ? 'text-safety' : 'text-critical'}`}>
                        {isOnline ? 'Telemetric Link Active' : 'Waiting for Signal...'}
                    </span>
                </div>

                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-500 ${isOnline ? 'bg-safety/5 border-safety/30 text-safety shadow-[0_0_15px_rgba(74,222,128,0.1)]' : 'bg-critical/5 border-critical/30 text-critical'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-safety shadow-glow animate-pulse' : 'bg-critical shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>

                <button
                    onClick={handleThemeToggle}
                    className="p-2 md:p-2.5 rounded-xl hover:bg-foreground/5 transition-all text-muted-foreground hover:text-foreground"
                    title="Toggle Theme"
                >
                    {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
                </button>
            </div>
        </header>
    );
};
