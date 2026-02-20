import { useState, useEffect } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { CrashStatusCard } from './components/CrashStatusCard';
import { SensorGrid } from './components/SensorGrid';
import { AlertsPanel } from './components/AlertsPanel';
import { SystemHealthCard } from './components/SystemHealthCard';
import { useFirebaseData } from './hooks/useFirebaseData';
import { ShieldAlert } from 'lucide-react';

function App() {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('lifeguardx-theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    const firebaseState = useFirebaseData();
    const [debouncedState, setDebouncedState] = useState(firebaseState);

    // Debounce UI updates at 250ms for smooth animations as requested
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedState(firebaseState);
        }, 250);

        return () => clearTimeout(handler);
    }, [firebaseState]);

    const {
        vehicle_id,
        timestamp,
        accident,
        location,
        sensors,
        hazards,
        system,
        isOnline,
        alerts,
        loading,
        error,
        acknowledgeAll
    } = debouncedState;

    // Effect to handle dark mode class on html element
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    if (loading && !timestamp) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="relative flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    <div className="mt-6 text-accent font-black uppercase tracking-widest animate-pulse">Establishing Secure Link...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-6">
                <div className="max-w-md w-full glass dark:glass-dark rounded-3xl p-10 text-center space-y-6 border border-critical/30">
                    <div className="mx-auto w-16 h-16 bg-critical/20 flex items-center justify-center rounded-2xl">
                        <ShieldAlert className="text-critical w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter italic">Telemetric Failure</h1>
                    <p className="text-muted-foreground text-sm font-bold uppercase tracking-wide">
                        {error.message || "Unable to establish a secure link with the LifeGuardX network."}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-critical text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-critical/20 hover:scale-[1.02] transition-transform"
                    >
                        Re-Establish Link
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-500 pb-12 selection:bg-accent/30">
            <HeaderBar
                isOnline={isOnline}
                vehicleId={vehicle_id}
                isDarkMode={isDarkMode}
                toggleTheme={() => setIsDarkMode(!isDarkMode)}
            />

            <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 md:space-y-12 animate-in fade-in duration-1000">
                {/* Hero Section */}
                <CrashStatusCard
                    accident={accident}
                    location={location}
                    timestamp={timestamp}
                    isOnline={isOnline}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
                    {/* Primary Sensor Data */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic text-heading text-foreground">Live Telemetry</h3>
                            <div className="flex gap-1">
                                <div className="w-1 h-3 bg-accent rounded-full" />
                                <div className="w-1 h-3 bg-accent/70 rounded-full" />
                                <div className="w-1 h-3 bg-accent/40 rounded-full" />
                            </div>
                        </div>
                        <SensorGrid sensors={sensors} hazards={hazards} location={location} system={system} isOnline={isOnline} />
                    </div>

                    {/* Meta/Alert Panels */}
                    <aside className="lg:col-span-4 space-y-8 sticky top-24">
                        <AlertsPanel
                            alerts={alerts}
                            onAcknowledgeAll={acknowledgeAll}
                        />
                        <SystemHealthCard
                            isOnline={isOnline}
                            severity={accident.severity as any}
                            gpsFix={system.gps_fix}
                        />
                    </aside>
                </div>
            </main>

            {/* Global Footer */}
            <footer className="mt-12 text-center text-muted-foreground">
                <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="w-8 h-px bg-border" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic">Secure Shield Protocol Enabled</span>
                    <div className="w-8 h-px bg-border" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-20">LifeGuardX Dashboard • © 2024 • Smart Golden Hour Monitoring</p>
            </footer>
        </div>
    );
}

export default App;
