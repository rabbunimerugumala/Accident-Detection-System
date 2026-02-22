import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface FooterProps {
    vehicleId: string;
    systemStatus: string;
}

const Footer: React.FC<FooterProps> = ({ vehicleId, systemStatus }) => {
    return (
        <footer className="py-8 flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    LifeGuardX Production Intelligence System
                </p>
            </div>
            <p className="max-w-md text-[10px] text-slate-400 font-medium">
                Real-time telemetry synced via Firebase RTDB. Precision monitoring for vehicle {vehicleId}. System status: {systemStatus}.
            </p>
        </footer>
    );
};

export default Footer;
