import { AlertCircle, Clock, Signal } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface AccidentCardProps {
    crash: boolean;
    severity: string;
    timestamp: string;
    gpsFix: boolean;
}

export function AccidentCard({ crash, severity, timestamp, gpsFix }: AccidentCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "relative overflow-hidden rounded-3xl p-8 card-gradient border-2 transition-all duration-500",
                crash ? "border-critical shadow-2xl shadow-critical/20" : "border-border shadow-lg"
            )}
        >
            {crash && (
                <div className="absolute inset-0 bg-critical/5 animate-pulse-slow pointer-events-none" />
            )}

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
                <div className="flex gap-6 items-center">
                    <div className={cn(
                        "p-5 rounded-2xl transition-transform duration-500",
                        crash ? "bg-critical text-white scale-110 shadow-lg shadow-critical/40 rotate-12" : "bg-safety text-white"
                    )}>
                        <AlertCircle size={40} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Crash Status</h2>
                        <div className="flex items-center gap-3 mt-2">
                            <span className={cn(
                                "text-4xl font-extrabold tracking-tighter",
                                crash ? "text-critical" : "text-safety"
                            )}>
                                {crash ? "CRASH DETECTED" : "SYSTEM NORMAL"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full md:w-auto">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock size={14} />
                            <span className="text-[10px] font-bold uppercase">Timestamp</span>
                        </div>
                        <p className="font-mono text-sm">{timestamp || "Unknown"}</p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <AlertCircle size={14} />
                            <span className="text-[10px] font-bold uppercase">Severity</span>
                        </div>
                        <p className={cn(
                            "font-bold text-sm",
                            severity === 'CRITICAL' ? "text-critical" : severity === 'HIGH' ? "text-danger" : "text-foreground"
                        )}>{severity}</p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Signal size={14} />
                            <span className="text-[10px] font-bold uppercase">GPS Fix</span>
                        </div>
                        <p className={cn(
                            "font-bold text-sm",
                            gpsFix ? "text-safety" : "text-danger"
                        )}>{gpsFix ? "STABLE" : "SEARCHING"}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
