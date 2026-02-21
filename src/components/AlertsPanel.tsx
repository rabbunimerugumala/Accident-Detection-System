import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Trash2, ShieldAlert, Zap, Thermometer, Droplets, Info } from 'lucide-react';
import { AlertNotification } from '../hooks/useFirebaseData';

interface AlertsPanelProps {
    alerts: AlertNotification[];
    onAcknowledgeAll: () => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onAcknowledgeAll }) => {

    const icons: Record<string, any> = {
        ACCIDENT: ShieldAlert,
        HAZARD: Zap,
        TEMP: Thermometer,
        WATER: Droplets,
    };

    const colors = {
        SAFE: 'border-safe/20 text-safe bg-safe/5',
        WARNING: 'border-warning/30 text-warning bg-warning/5 glow-warning',
        DANGER: 'border-danger/30 text-danger bg-danger/5 glow-danger',
        CRITICAL: 'border-critical/30 text-critical bg-critical/5 shadow-hazard',
    };

    return (
        <div className="premium-card flex flex-col h-full relative overflow-hidden group">
            <div className="absolute inset-0 tech-grid opacity-[0.02] pointer-events-none" />

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="bg-accent/10 p-3 rounded-[1.2rem] border border-accent/20 relative">
                        <Bell className="w-5 h-5 text-accent" />
                        {alerts.length > 0 && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-critical rounded-full border-2 border-background" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-black uppercase tracking-tighter text-2xl italic text-heading">Alert Logs</h3>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Real-time status feed</p>
                    </div>
                </div>
                {alerts.length > 0 && (
                    <button
                        onClick={onAcknowledgeAll}
                        className="group flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-foreground/5 hover:bg-critical/10 px-4 py-2 rounded-xl transition-all border border-border/50 text-muted-foreground hover:text-critical"
                    >
                        <Trash2 size={12} className="group-hover:rotate-12 transition-transform" />
                        Wipe Logs
                    </button>
                )}
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-[440px] pr-2 custom-scrollbar relative z-10">
                <AnimatePresence initial={false}>
                    {alerts.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-24 text-muted-foreground/30 text-center"
                        >
                            <div className="relative mb-6">
                                <Bell className="w-20 h-20 opacity-5" />
                                <motion.div
                                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <Info className="w-8 h-8 opacity-20" />
                                </motion.div>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">All Systems Nominal</p>
                            <p className="text-[9px] italic mt-2 opacity-50 uppercase tracking-widest">Listening for incoming data...</p>
                        </motion.div>
                    ) : (
                        alerts.map((alert) => {
                            const Icon = icons[alert.type] || Bell;
                            return (
                                <motion.div
                                    key={alert.id}
                                    layout
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`p-5 rounded-2xl border flex items-start gap-4 transition-all duration-300 shadow-xl backdrop-blur-md ${colors[alert.severity as keyof typeof colors]}`}
                                >
                                    <div className="mt-1 bg-current/10 p-2 rounded-lg">
                                        <Icon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                                {alert.timestamp}
                                            </span>
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-current/20">
                                                {alert.severity}
                                            </span>
                                        </div>
                                        <p className="text-sm font-black leading-tight uppercase tracking-tight italic break-words">
                                            {alert.message}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            <div className="absolute right-[-20px] top-40 text-8xl font-black italic opacity-[0.02] select-none pointer-events-none -rotate-12 uppercase tracking-tighter">ALERTS</div>
        </div>
    );
};
