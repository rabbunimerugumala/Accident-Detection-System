import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { AccidentCard } from './components/AccidentCard';
import { HazardCard } from './components/HazardCard';
import { MapSection } from './components/MapSection';
import { NotificationsPanel } from './components/NotificationsPanel';
import { useFirebaseData } from './hooks/useFirebaseData';
import { Flame, Droplets, Thermometer, Wind, Zap, CloudRain, ShieldCheck, Moon, Sun as SunIcon, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const { data, loading, error } = useFirebaseData();

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle('dark');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="relative flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    <div className="mt-6 text-accent font-bold animate-pulse">Establishing Link...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-6 text-foreground">
                <div className="max-w-md w-full glass rounded-3xl p-8 text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-critical/20 flex items-center justify-center rounded-2xl">
                        <ShieldCheck className="text-critical w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold">Connection Failed</h1>
                    <p className="text-muted-foreground">{error.message || "Unable to establish a secure link with the LifeGuardX network."}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-accent text-white rounded-2xl font-bold shadow-xl shadow-accent/20"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-6 text-foreground">
                <div className="max-w-md w-full glass rounded-3xl p-8 text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-warning/20 flex items-center justify-center rounded-2xl">
                        <Activity className="text-warning w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold">Waiting for Data</h1>
                    <p className="text-muted-foreground">The system is online but no accident data has been transmitted yet. Monitoring is active.</p>
                    <div className="flex gap-2 justify-center">
                        <div className="w-2 h-2 bg-safety rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-safety">System Ready</span>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className={`min-h-screen bg-background text-foreground transition-colors duration-500 overflow-x-hidden ${isDarkMode ? 'dark' : ''}`}>
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

            <main className="pl-64 min-h-screen p-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">System Overview</h1>
                        <p className="text-muted-foreground font-medium">Vehicle ID: <span className="text-accent uppercase">{data.vehicle_id}</span> • Status: <span className="text-safety">Online</span></p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-3 glass rounded-xl hover:bg-accent/10 transition-colors"
                        >
                            {isDarkMode ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
                        </button>
                        <div className="flex items-center gap-3 glass px-4 py-2 rounded-xl">
                            <div className="w-2 h-2 bg-safety rounded-full animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider">{data.system.device_status}</span>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 space-y-8">
                        {/* Dashboard Content */}
                        <AnimatePresence mode="wait">
                            {activeTab === 'dashboard' && (
                                <motion.div
                                    key="dashboard"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-8"
                                >
                                    <AccidentCard
                                        crash={data.crash}
                                        severity={data.severity}
                                        timestamp={data.timestamp}
                                        gpsFix={data.system.gps_fix}
                                    />

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <HazardCard
                                            title="Fire Hazard"
                                            status={(data.hazards.fire as any)}
                                            value={data.sensors.fire ? "DETECTED" : "NONE"}
                                            icon={Flame}
                                        />
                                        <HazardCard
                                            title="Gas Leak"
                                            status={(data.hazards.gas as any)}
                                            value={data.sensors.gas_leak ? "LEAK DETECTED" : "NORMAL"}
                                            icon={Wind}
                                        />
                                        <HazardCard
                                            title="Water Level"
                                            status={(data.hazards.water as any)}
                                            value={data.sensors.water_detected ? "FLOODING" : "DRY"}
                                            icon={Droplets}
                                        />
                                        <HazardCard
                                            title="Shock (G-Force)"
                                            status={data.sensors.gforce > 8 ? "CRITICAL" : data.sensors.gforce > 5 ? "DANGER" : "SAFE"}
                                            value={`${data.sensors.gforce.toFixed(1)} G`}
                                            icon={Zap}
                                        />
                                        <HazardCard
                                            title="Temperature"
                                            status={(data.hazards.temperature as any)}
                                            value={`${data.sensors.temperature.toFixed(1)}°C`}
                                            icon={Thermometer}
                                        />
                                        <HazardCard
                                            title="Humidity"
                                            status="SAFE"
                                            value={`${data.sensors.humidity}%`}
                                            icon={CloudRain}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'map' && (
                                <motion.div
                                    key="map"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <MapSection latitude={data.location.latitude} longitude={data.location.longitude} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="space-y-8">
                        <NotificationsPanel
                            notifications={data.crash ? ["CRASH ALERT: Immediate attention required", "Emergency contacts notified"] : []}
                        />

                        <div className="glass rounded-3xl p-6 border bg-card/50">
                            <h3 className="font-bold mb-4">System Health</h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'GPS Satellite', value: data.system.gps_fix ? 'Stable' : 'Offline', active: data.system.gps_fix },
                                    { label: 'Cloud Sync', value: 'Active', active: true },
                                    { label: 'Battery', value: '92%', active: true },
                                    { label: 'Sensors', value: 'Calibrated', active: true },
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">{item.label}</span>
                                        <span className={item.active ? 'text-safety' : 'text-critical'}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="pl-64 py-8 text-center text-muted-foreground text-xs uppercase tracking-widest font-bold opacity-50">
                LifeGuardX • Smart Golden Hour Dashboard • © 2024
            </footer>
        </div>
    );
}

export default App;
