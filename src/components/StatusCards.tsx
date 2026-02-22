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
            <div className={`dashboard-card flex items-center gap-4 !p-4 ${isCritical ? 'border-danger/30 bg-danger/5' : isModerate ? 'border-warning/30 bg-warning/5' : ''}`}>
                <div className={`p-2 rounded-lg ${isCritical ? 'bg-danger/20 text-danger' : isModerate ? 'bg-warning/20 text-warning' : 'bg-emerald-100 text-emerald-600'}`}>
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                    <p className="status-label">Accident</p>
                    <p className={`font-black uppercase text-sm ${isCritical ? 'text-danger' : isModerate ? 'text-warning' : 'text-emerald-600'}`}>
                        {data.accident.severity}
                    </p>
                </div>
            </div>

            <div className="dashboard-card flex items-center gap-4 !p-4">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                    <Zap className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                    <p className="status-label">G-Force</p>
                    <p className="font-black text-sm">{data.sensors.gforce.toFixed(2)}g</p>
                </div>
            </div>

            <div className="dashboard-card flex items-center gap-4 !p-4">
                <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                    <Thermometer className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                    <p className="status-label">Temp</p>
                    <p className="font-black text-sm">{data.sensors.temperature}°C</p>
                </div>
            </div>

            <div className="dashboard-card flex items-center gap-4 !p-4">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                    <MapPin className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                    <p className="status-label">GPS</p>
                    <p className="font-black text-sm">{data.location.gps_fix ? 'Fixed' : 'Searching'}</p>
                </div>
            </div>
        </div>
    );
};

export default StatusCards;
