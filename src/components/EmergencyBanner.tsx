import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Activity } from 'lucide-react';

interface EmergencyBannerProps {
    isCritical: boolean;
}

const EmergencyBanner: React.FC<EmergencyBannerProps> = ({ isCritical }) => {
    return (
        <AnimatePresence>
            {isCritical && (
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="bg-danger p-4 rounded-2xl flex items-center justify-between text-white shadow-xl shadow-danger/20"
                >
                    <div className="flex items-center gap-4">
                        <AlertTriangle className="w-8 h-8 animate-bounce" />
                        <div>
                            <h2 className="text-xl font-black">CRITICAL ACCIDENT DETECTED</h2>
                            <p className="text-xs font-bold opacity-80 uppercase tracking-widest leading-none">Emergency response required immediately</p>
                        </div>
                    </div>
                    <Activity className="w-6 h-6 opacity-30 animate-pulse" />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default EmergencyBanner;
