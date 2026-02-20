import React from 'react';
import { Bell, CheckCircle, Clock } from 'lucide-react';
import { AlertNotification } from '../hooks/useFirebaseData';

interface AlertsPanelProps {
    alerts: AlertNotification[];
    onAcknowledgeAll: () => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onAcknowledgeAll }) => {
    return (
        <div className="glass dark:glass-dark rounded-3xl p-6 border border-border/50 flex flex-col h-full shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-accent/10 p-2 rounded-xl border border-accent/20">
                        <Bell className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="font-black uppercase tracking-tighter text-xl italic text-heading">Live Alerts</h3>
                </div>
                {alerts.length > 0 && (
                    <button
                        onClick={onAcknowledgeAll}
                        className="text-[10px] font-black uppercase tracking-widest bg-foreground/5 hover:bg-foreground/10 px-3 py-1.5 rounded-lg transition-colors border border-border/50 text-muted-foreground hover:text-foreground"
                    >
                        Acknowledge All
                    </button>
                )}
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/40 text-center">
                        <CheckCircle className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">No active alerts</p>
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`p-4 rounded-2xl border-2 bg-gradient-to-r flex items-start gap-4 transition-all duration-300 animate-in slide-in-from-right-4 shadow-md ${{
                                    SAFE: 'from-safety/10 to-transparent border-safety/30 text-safety',
                                    WARNING: 'from-warning/10 to-transparent border-warning/30 text-warning',
                                    DANGER: 'from-danger/10 to-transparent border-danger/30 text-danger',
                                    CRITICAL: 'from-critical/10 to-transparent border-critical/30 text-critical shadow-hazard',
                                }[alert.severity]
                                }`}
                        >
                            <div className="flex-1">
                                <p className="text-xs font-black leading-tight uppercase tracking-wide italic">{alert.message}</p>
                                <div className="flex items-center gap-2 mt-2.5 opacity-70">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">
                                        {alert.timestamp}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
