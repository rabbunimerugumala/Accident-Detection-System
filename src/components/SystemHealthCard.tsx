import React from 'react';
import { Activity, Battery, Wifi, Cpu } from 'lucide-react';

interface SystemHealthCardProps {
    isOnline: boolean;
    severity: 'SAFE' | 'WARNING' | 'DANGER' | 'CRITICAL';
    gpsFix: boolean;
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ isOnline, severity, gpsFix }) => {
    const isGood = isOnline && severity === 'SAFE';
    const isWarning = severity === 'WARNING' || severity === 'DANGER';
    const isCritical = severity === 'CRITICAL' || !isOnline;

    const statusText = isCritical
        ? (isOnline ? 'Critical Issues Detected' : 'System Offline')
        : (isWarning ? 'System Warnings Present' : 'All Systems Operational');

    const colorClass = isCritical ? 'bg-critical' : (isWarning ? 'bg-warning' : 'bg-safety');
    const textClass = isCritical ? 'text-critical' : (isWarning ? 'text-warning' : 'text-safety');

    return (
        <div className="glass dark:glass-dark rounded-3xl p-6 border border-border/50 shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`${isCritical ? 'bg-critical/10' : 'bg-safety/10'} p-2 rounded-xl border border-current/20`}>
                        <Activity className={`w-5 h-5 ${textClass}`} />
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-[0.1em] text-heading italic">System Health</h3>
                </div>
                <div className="flex gap-2">
                    <div className={`p-1.5 rounded-lg border border-border/50 ${isOnline ? 'bg-safety/10 text-safety' : 'bg-critical/10 text-critical'}`}>
                        <Wifi className="w-4 h-4" />
                    </div>
                    <div className="bg-foreground/5 p-1.5 rounded-lg border border-border/50 text-muted-foreground">
                        <Battery className="w-4 h-4" />
                    </div>
                    <div className="bg-foreground/5 p-1.5 rounded-lg border border-border/50 text-muted-foreground text-safety">
                        <Cpu className="w-4 h-4" />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{statusText}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${textClass}`}>
                            {isGood ? '100%' : (isWarning ? '75%' : '0%')}
                        </span>
                    </div>
                    <div className="w-full h-3 bg-foreground/5 rounded-full overflow-hidden border border-border/30 p-[1px]">
                        <div
                            className={`h-full transition-all duration-1000 ease-out rounded-full ${colorClass}`}
                            style={{ width: isGood ? '100%' : (isWarning ? '75%' : '20%') }}
                        >
                            <div className="w-full h-full bg-white/20 animate-pulse" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2 bg-foreground/5 p-3 rounded-2xl border border-border/30">
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Status</span>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-safety animate-pulse' : 'bg-critical'}`} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-heading">{isOnline ? 'Stellar' : 'Lost'}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 bg-foreground/5 p-3 rounded-2xl border border-border/30">
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-60">GPS</span>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${gpsFix ? 'bg-safety' : 'bg-gray-400'}`} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-heading">{gpsFix ? 'Locked' : 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
