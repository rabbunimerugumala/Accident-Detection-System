import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface HazardCardProps {
    title: string;
    value: string;
    status: 'SAFE' | 'WARNING' | 'DANGER' | 'CRITICAL';
    icon: LucideIcon;
    subValue?: string;
}

const statusColors = {
    SAFE: 'text-safety bg-safety/10 border-safety/20 shadow-safety/10',
    WARNING: 'text-warning bg-warning/10 border-warning/20 shadow-warning/10',
    DANGER: 'text-danger bg-danger/10 border-danger/20 shadow-danger/10',
    CRITICAL: 'text-critical bg-critical/10 border-critical/20 shadow-critical/10 hazard-glow-critical animate-shake',
};

export function HazardCard({ title, value, status, icon: Icon, subValue }: HazardCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={cn(
                "p-6 rounded-2xl border flex flex-col gap-4 card-gradient transition-all duration-300",
                statusColors[status]
            )}
        >
            <div className="flex justify-between items-start">
                <div className={cn("p-2 rounded-lg", statusColors[status].split(' ')[1])}>
                    <Icon className="w-6 h-6" />
                </div>
                <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold tracking-widest",
                    statusColors[status].split(' ')[1]
                )}>
                    {status}
                </span>
            </div>

            <div>
                <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{title}</h3>
                <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
                {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
            </div>

            <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-1.5 mt-2">
                <div
                    className={cn(
                        "h-1.5 rounded-full transition-all duration-1000",
                        statusColors[status].split(' ')[0].replace('text-', 'bg-')
                    )}
                    style={{ width: status === 'SAFE' ? '25%' : status === 'WARNING' ? '50%' : status === 'DANGER' ? '75%' : '100%' }}
                />
            </div>
        </motion.div>
    );
}
