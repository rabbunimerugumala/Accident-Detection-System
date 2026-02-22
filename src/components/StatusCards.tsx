import React from 'react';
import { AlertTriangle, Zap, Thermometer, MapPin } from 'lucide-react';
import { FirebaseData } from '../types';

interface StatusCardsProps {
    data: FirebaseData['accidentState'];
    isCritical: boolean;
    isModerate: boolean;
}

const StatusCards: React.FC<StatusCardsProps> = ({ data, isCritical, isModerate }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="dashboard-card flex items-center gap-4 !p-4 transition-all"
                style={{
                    borderColor: isCritical ? 'rgba(239, 68, 68, 0.3)' : isModerate ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)',
                    backgroundColor: isCritical ? 'rgba(239, 68, 68, 0.05)' : isModerate ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-card)'
                }}>
                <div className="p-2 rounded-lg"
                    style={{
                        backgroundColor: isCritical ? 'rgba(239, 68, 68, 0.2)' : isModerate ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                        color: isCritical ? 'var(--accent-rose)' : isModerate ? 'var(--accent-amber)' : 'var(--accent-emerald)'
                    }}>
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                    <p className="status-label">Accident</p>
                    <p className="font-black uppercase text-sm"
                        style={{
                            color: isCritical ? 'var(--accent-rose)' : isModerate ? 'var(--accent-amber)' : 'var(--accent-emerald)'
                        }}>
                        {data.accident.severity}
                    </p>
                </div>
            </div>

            <div className="dashboard-card flex items-center gap-4 !p-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)' }}>
                    <Zap className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                    <p className="status-label">G-Force</p>
                    <p className="font-black text-sm" style={{ color: 'var(--text-main)' }}>{data.sensors.gforce.toFixed(2)}g</p>
                </div>
            </div>

            <div className="dashboard-card flex items-center gap-4 !p-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)' }}>
                    <Thermometer className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                    <p className="status-label">Temp</p>
                    <p className="font-black text-sm" style={{ color: 'var(--text-main)' }}>{data.sensors.temperature}°C</p>
                </div>
            </div>

            <div className="dashboard-card flex items-center gap-4 !p-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(67, 56, 202, 0.1)', color: 'var(--accent-indigo)' }}>
                    <MapPin className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                    <p className="status-label">GPS</p>
                    <p className="font-black text-sm" style={{ color: 'var(--text-main)' }}>{data.location.gps_fix ? 'Fixed' : 'Searching'}</p>
                </div>
            </div>
        </div>
    );
};

export default StatusCards;
