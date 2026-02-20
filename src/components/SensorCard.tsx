import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SensorCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    status: string;
    severity: 'SAFE' | 'WARNING' | 'DANGER' | 'CRITICAL';
    isOnline: boolean;
}

export const SensorCard: React.FC<SensorCardProps> = ({ icon: Icon, label, value, status, severity, isOnline }) => {
    // Severity color mapping based on unified variables
    const colorMap = {
        SAFE: 'text-safety border-safety/30 shadow-safety/10',
        WARNING: 'text-warning border-warning/30 shadow-warning/10',
        DANGER: 'text-danger border-danger/30 shadow-danger/10',
        CRITICAL: 'text-critical border-critical/30 shadow-critical/10',
    };

    const bgMap = {
        SAFE: 'bg-safety/5 dark:bg-safety/10',
        WARNING: 'bg-warning/5 dark:bg-warning/10',
        DANGER: 'bg-danger/5 dark:bg-danger/10',
        CRITICAL: 'bg-critical/5 dark:bg-critical/10',
    };

    const activeSeverity = isOnline ? (severity || 'SAFE') : 'SAFE';
    const activeColor = colorMap[activeSeverity as keyof typeof colorMap];
    const activeBg = bgMap[activeSeverity as keyof typeof bgMap];

    return (
        <div className={`glass rounded-2xl p-4 md:p-5 border-2 glow-border ${activeColor} ${activeBg} transition-all duration-300 group hover:scale-[1.03] shadow-lg`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl border-2 ${activeColor} bg-background/50 backdrop-blur-sm shadow-sm`}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${activeColor} bg-background/50`}>
                    {isOnline ? status : 'OFFLINE'}
                </div>
            </div>

            <div className="space-y-1">
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
                <p className="text-xl md:text-2xl font-black tracking-tight text-heading truncate dark:text-white">
                    {isOnline ? value : '0'}
                </p>
            </div>

            <div className="mt-5 w-full bg-foreground/5 h-1.5 rounded-full overflow-hidden border border-border/10">
                <div
                    className={`h-full opacity-80 ${activeColor.split(' ')[0].replace('text-', 'bg-')}`}
                    style={{
                        width: !isOnline ? '0%' : (activeSeverity === 'SAFE' ? '100%' : activeSeverity === 'WARNING' ? '60%' : activeSeverity === 'DANGER' ? '35%' : '15%'),
                        transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                />
            </div>
        </div>
    );
};
