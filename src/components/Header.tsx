import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface HeaderProps {
    vehicleId: string;
    status: string;
    isCritical: boolean;
}

const Header: React.FC<HeaderProps> = ({ vehicleId, status, isCritical }) => {
    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${isCritical ? 'bg-danger' : 'bg-primary'}`}>
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tighter text-slate-900 leading-tight">
                            LifeGuardX <span className="text-primary opacity-80">v4.0</span>
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{vehicleId}</p>
                    </div>
                </div>

                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-all ${status.includes('🟢') ? 'bg-emerald-50 border-emerald-100 animate-pulse-green' : 'bg-red-50 border-red-100 animate-shake'}`}>
                    <div className={`w-2 h-2 rounded-full ${status.includes('🟢') ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className={`text-xs font-black uppercase tracking-tight ${status.includes('🟢') ? 'text-emerald-700' : 'text-red-700'}`}>
                        {status}
                    </span>
                </div>
            </div>
        </header>
    );
};

export default Header;
