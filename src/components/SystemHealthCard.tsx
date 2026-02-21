import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Globe, Wifi, Cpu, Signal } from 'lucide-react';

interface SystemHealthCardProps {
    isOnline: boolean;
    timestamp: number;
    gpsFix: boolean;
    deviceStatus: string;
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({
    isOnline,
    timestamp,
    gpsFix,
    deviceStatus
}) => {
    const [lastSeen, setLastSeen] = useState<string>('0.0s');

    useEffect(() => {
        const interval = setInterval(() => {
            if (timestamp === 0) {
                setLastSeen('NO DATA');
                return;
            }
            const seconds = ((Date.now() - timestamp) / 1000).toFixed(1);
            setLastSeen(`${seconds}s`);
        }, 100);
        return () => clearInterval(interval);
    }, [timestamp]);

    return (
        <div className="premium-card relative overflow-hidden group">
            <div className="absolute inset-0 tech-grid opacity-[0.03] pointer-events-none" />

            <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className={`${isOnline ? 'bg-safe/10 border-safe/20' : 'bg-critical/10 border-critical/20'} p-3 rounded-2xl border backdrop-blur-md transition-colors`}>
                    <Cpu className={isOnline ? 'text-safe' : 'text-critical'} size={24} />
                </div>
                <div>
                    <h3 className="font-black uppercase tracking-tighter text-2xl italic text-heading">Health Core</h3>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">System link analytics</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 relative z-10">
                <HealthItem
                    icon={Heart}
                    label="Signal Heartbeat"
                    value={lastSeen}
                    status={isOnline ? 'SAFE' : 'CRITICAL'}
                    pulsate={isOnline}
                    subValue={isOnline ? "Nominal" : "Signal Dropped"}
                />

                <HealthItem
                    icon={Globe}
                    label="GPS Constellation"
                    value={gpsFix ? "SECURED" : "WAITING FOR GPS"}
                    status={gpsFix ? 'SAFE' : 'WARNING'}
                    subValue={gpsFix ? "High Precision" : "Lost Connection"}
                />

                <HealthItem
                    icon={Wifi}
                    label="Telemetric Rank"
                    value={isOnline ? "TIER 01" : "TIER 00"}
                    status={isOnline ? 'SAFE' : 'CRITICAL'}
                    subValue={isOnline ? "Encrypted Link" : "Disconnected"}
                />

                <HealthItem
                    icon={Signal}
                    label="Network Load"
                    value={isOnline ? "STABLE" : "N/A"}
                    status={isOnline ? 'SAFE' : 'WARNING'}
                    subValue={isOnline ? "Latency < 120ms" : "Unreachable"}
                />
            </div>

            {/* Device Analytics Footer */}
            <div className="mt-8 pt-6 border-t border-border/50 relative z-10">
                <div className="flex justify-between items-center bg-foreground/[0.03] p-4 rounded-2xl border border-border/10">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-safe shadow-glow-safe animate-pulse' : 'bg-critical'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-heading opacity-80">{deviceStatus}</span>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50">v2.1.0_LFX</span>
                </div>
            </div>

            <div className="absolute right-[-20px] top-[-20px] text-8xl font-black italic opacity-[0.02] select-none pointer-events-none rotate-45 uppercase tracking-tighter">HEALTH</div>
        </div>
    );
};

const HealthItem = ({
    icon: Icon,
    label,
    value,
    status,
    pulsate,
    subValue
}: {
    icon: any,
    label: string,
    value: string,
    status: 'SAFE' | 'WARNING' | 'CRITICAL',
    pulsate?: boolean,
    subValue?: string
}) => {

    const colors = {
        SAFE: 'text-safe border-safe/20',
        WARNING: 'text-warning border-warning/20',
        CRITICAL: 'text-critical border-critical/20',
    };

    return (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-foreground/[0.02] border border-border/10 group-hover:bg-foreground/[0.04] transition-all">
            <div className="flex items-center gap-4">
                <motion.div
                    animate={pulsate ? { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={`${colors[status]} bg-current/10 p-2.5 rounded-xl border-2 border-transparent`}
                >
                    <Icon size={18} />
                </motion.div>
                <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block leading-none mb-1">{label}</span>
                    <span className="text-[8px] font-bold text-muted-foreground opacity-50 uppercase tracking-widest">{subValue}</span>
                </div>
            </div>
            <div className="text-right">
                <span className={`text-sm font-black tracking-tighter uppercase block leading-none ${colors[status]}`}>
                    {value}
                </span>
            </div>
        </div>
    );
};
