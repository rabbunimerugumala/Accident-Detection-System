import { Bell, CheckCircle2, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface AlertsPanelProps {
    notifications: string[];
}

export function NotificationsPanel({ notifications }: AlertsPanelProps) {
    return (
        <div className="rounded-3xl glass border bg-card/50 flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Bell className="text-accent" />
                    <h3 className="font-bold">Live Alerts</h3>
                </div>
                <span className="bg-accent/10 text-accent text-[10px] font-bold px-2 py-1 rounded-md">
                    {notifications.length} NEW
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 gap-2">
                        <Info size={32} />
                        <p className="text-sm">No new alerts</p>
                    </div>
                ) : (
                    notifications.map((alert, idx) => (
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            key={idx}
                            className="p-4 rounded-2xl bg-white/5 border border-white/10 flex gap-4 items-start"
                        >
                            <div className="p-2 bg-accent/20 rounded-xl">
                                <Bell size={16} className="text-accent" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">{alert}</p>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[10px] text-muted-foreground">Just now</span>
                                    <button className="text-[10px] font-bold text-accent hover:underline">Mark read</button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <div className="p-4 border-t bg-card/30">
                <button className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} />
                    Acknowledge All
                </button>
            </div>
        </div>
    );
}
