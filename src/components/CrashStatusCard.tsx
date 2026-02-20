import React from 'react';
import { AlertTriangle, ShieldCheck, MapPin, Clock, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface CrashStatusCardProps {
    accident: {
        detected: boolean;
        severity: "SAFE" | "DANGER" | "CRITICAL";
    };
    location: {
        latitude: number;
        longitude: number;
        gps_fix: boolean;
    };
    timestamp: number;
    isOnline: boolean;
}

export const CrashStatusCard: React.FC<CrashStatusCardProps> = ({ accident, location, timestamp, isOnline }) => {
    const severity = accident.severity || 'SAFE';
    const detected = accident.detected;

    // Gradient definitions for severity
    const colorStyles = isOnline ? {
        SAFE: 'from-safety/20 via-blue-500/10 to-transparent border-safety/30 text-safety',
        DANGER: 'from-danger/20 to-transparent border-danger/30 text-danger',
        CRITICAL: 'from-red-900/40 via-red-600/30 to-transparent border-critical/50 text-critical shadow-hazard',
    }[severity] : 'from-gray-500/10 to-transparent border-gray-500/20 text-muted-foreground';

    if (!isOnline) {
        return (
            <div className="w-full glass rounded-3xl p-8 md:p-12 border-2 border-dashed border-muted-foreground/20 text-center space-y-4">
                <div className="bg-muted-foreground/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <WifiOff className="w-8 h-8 text-muted-foreground opacity-50" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-muted-foreground">Device Offline</h2>
                <p className="text-muted-foreground max-w-sm mx-auto text-sm font-bold uppercase tracking-widest leading-relaxed">
                    Telemetry link lost. Waiting for ESP reactivation...
                </p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative w-full overflow-hidden glass rounded-3xl border-2 ${colorStyles} bg-gradient-to-br transition-all duration-700 shadow-2xl`}
        >
            {detected && (
                <div className="absolute inset-0 bg-red-600/10 animate-crash-pulse pointer-events-none" />
            )}

            <div className="relative p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <div className={`p-4 rounded-2xl mb-4 ${detected ? 'bg-critical text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-bounce' : 'bg-safety/20 text-safety border border-safety/30'}`}>
                        {detected ? <AlertTriangle className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
                    </div>
                    <h2 className={`text-3xl md:text-6xl font-black uppercase tracking-tighter mb-4 italic leading-none ${detected ? 'text-critical' : 'text-heading dark:text-white'}`}>
                        {detected ? 'ACCIDENT DETECTED' : (severity === 'SAFE' ? 'SYSTEM NORMAL' : 'POTENTIAL HAZARD')}
                    </h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-muted-foreground font-black text-[10px] md:text-xs tracking-[0.2em] uppercase">
                        <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-xl border border-border/50 backdrop-blur-md">
                            <Clock className="w-4 h-4 text-accent" />
                            {timestamp > 0 ? new Date(timestamp).toLocaleTimeString() : 'Waiting for Telemetry...'}
                        </div>
                        <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-xl border border-border/50 backdrop-blur-md">
                            <div className={`w-2.5 h-2.5 rounded-full ${location.gps_fix ? 'bg-safety shadow-glow' : 'bg-gray-500'}`} />
                            {location.gps_fix ? 'GPS LOCKED' : 'GPS SEARCHING'}
                        </div>
                        <div className={`px-4 py-2 rounded-xl border-2 bg-background/50 font-black tracking-widest ${colorStyles.split(' ').pop()}`}>
                            {severity} LEVEL
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-4 min-w-[200px]">
                    <a
                        href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col items-center gap-3 bg-background/60 p-5 rounded-2xl border border-border/50 backdrop-blur-xl hover:bg-background/80 transition-all shadow-lg hover:scale-105 active:scale-95"
                    >
                        <div className="bg-accent/20 p-3 rounded-full group-hover:bg-accent/30 transition-colors">
                            <MapPin className="w-8 h-8 text-accent animate-pulse" />
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-0.5">Emergency Location</p>
                            <p className="font-black text-sm tracking-widest text-heading uppercase dark:text-white">View on Map</p>
                        </div>
                    </a>
                </div>
            </div>
        </motion.div>
    );
};
