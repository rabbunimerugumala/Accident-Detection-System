import React from 'react';
import { Flame, Wind, Droplets, Zap, Compass, Volume2, Navigation, Thermometer, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { FirebaseData } from '../types';

interface SensorGridProps {
    data: FirebaseData['accidentState'];
    age: number;
    googleMapsUrl: string;
}

const SensorGrid: React.FC<SensorGridProps> = ({ data, age, googleMapsUrl }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* FIRE */}
            <div className={`dashboard-card group hover:scale-[1.02] ${data.sensors.fire ? 'border-danger bg-danger/5 shadow-lg shadow-danger/10' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${data.sensors.fire ? 'bg-danger text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <Flame className="w-6 h-6" />
                    </div>
                    <p className={`text-xs font-black px-2 py-1 rounded bg-slate-100 ${data.sensors.fire ? 'text-danger' : 'text-slate-400'}`}>
                        {data.sensors.fire ? 'ACTIVE' : 'OFF'}
                    </p>
                </div>
                <h3 className="status-label !text-slate-400">🔥 FIRE DETECTOR</h3>
                <p className={`text-2xl font-black ${data.sensors.fire ? 'text-danger' : 'text-slate-900'}`}>
                    {data.sensors.fire ? 'FIRE DETECTED' : 'CLEAR'}
                </p>
            </div>

            {/* GAS */}
            <div className={`dashboard-card group hover:scale-[1.02] ${data.sensors.gas_leak ? 'border-warning bg-warning/5 shadow-lg shadow-warning/10' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${data.sensors.gas_leak ? 'bg-warning text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <Wind className="w-6 h-6" />
                    </div>
                    <p className={`text-xs font-black px-2 py-1 rounded bg-slate-100 ${data.sensors.gas_leak ? 'text-warning' : 'text-slate-400'}`}>
                        {data.sensors.gas_leak ? 'ACTIVE' : 'OFF'}
                    </p>
                </div>
                <h3 className="status-label !text-slate-400">💨 GAS LEAK</h3>
                <p className={`text-2xl font-black ${data.sensors.gas_leak ? 'text-warning' : 'text-slate-900'}`}>
                    {data.sensors.gas_leak ? 'LEAK DETECTED' : 'STABLE'}
                </p>
            </div>

            {/* WATER */}
            <div className={`dashboard-card group hover:scale-[1.02] ${data.sensors.water_detected ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${data.sensors.water_detected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <Droplets className="w-6 h-6" />
                    </div>
                    <p className={`text-xs font-black px-2 py-1 rounded bg-slate-100 ${data.sensors.water_detected ? 'text-primary' : 'text-slate-400'}`}>
                        {data.sensors.water_detected ? 'ACTIVE' : 'OFF'}
                    </p>
                </div>
                <h3 className="status-label !text-slate-400">💧 WATER DETECTED</h3>
                <p className={`text-2xl font-black ${data.sensors.water_detected ? 'text-primary' : 'text-slate-900'}`}>
                    {data.sensors.water_detected ? 'FLOOD ALERT' : 'DRY'}
                </p>
            </div>

            {/* G-FORCE GAUGE */}
            <div className="dashboard-card group hover:scale-[1.02]">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-slate-100 text-slate-600">
                        <Zap className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accelerometer</p>
                </div>
                <h3 className="status-label !text-slate-400">⚖️ G-FORCE</h3>
                <div className="flex items-end gap-2">
                    <p className={`text-3xl font-black ${data.sensors.gforce > 2.5 ? (data.sensors.gforce > 5 ? 'text-danger' : 'text-warning') : 'text-emerald-500'}`}>
                        {data.sensors.gforce.toFixed(2)}g
                    </p>
                    <p className={`text-xs font-bold mb-1 uppercase ${data.sensors.gforce > 2.5 ? 'text-danger' : 'text-emerald-500'}`}>
                        {data.sensors.gforce > 5 ? 'DANGER' : data.sensors.gforce > 2.5 ? 'WARNING' : 'SAFE'}
                    </p>
                </div>
                <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((data.sensors.gforce / 10) * 100, 100)}%` }}
                        className={`h-full ${data.sensors.gforce > 5 ? 'bg-danger' : data.sensors.gforce > 2.5 ? 'bg-warning' : 'bg-emerald-500'}`}
                    />
                </div>
            </div>

            {/* TILT ANGLE */}
            <div className="dashboard-card group hover:scale-[1.02]">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-slate-100 text-slate-600">
                        <Compass className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gyroscope</p>
                </div>
                <h3 className="status-label !text-slate-400">📐 TILT ANGLE</h3>
                <p className="text-3xl font-black text-slate-900">{data.sensors.tilt_angle.toFixed(1)}°</p>
                <div className="mt-4 flex gap-1 items-end h-8">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            className={`flex-1 rounded-t-sm transition-all duration-500 ${Math.abs(data.sensors.tilt_angle) > (i * 7.5) ? 'bg-primary' : 'bg-slate-100'}`}
                            style={{ height: `${20 + (i * 6)}%` }}
                        />
                    ))}
                </div>
            </div>

            {/* SOUND LEVEL */}
            <div className="dashboard-card group hover:scale-[1.02]">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-slate-100 text-slate-600">
                        <Volume2 className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acoustics</p>
                </div>
                <h3 className="status-label !text-slate-400">🔊 SOUND</h3>
                <p className="text-3xl font-black text-slate-900">{data.sensors.sound_level}%</p>
                <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${data.sensors.sound_level}%` }} />
                </div>
            </div>

            {/* GPS FIX */}
            <div className="dashboard-card group hover:scale-[1.02] flex flex-col justify-between" onClick={() => window.open(googleMapsUrl, '_blank')}>
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${data.location.gps_fix ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <Navigation className="w-6 h-6" />
                        </div>
                        <p className={`text-xs font-black px-2 py-1 rounded bg-slate-100 ${data.location.gps_fix ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {data.location.gps_fix ? 'FIXED' : 'NO FIX'}
                        </p>
                    </div>
                    <h3 className="status-label !text-slate-400">📍 GPS FIX</h3>
                    <p className="text-sm font-mono text-slate-500 leading-none">
                        {data.location.latitude.toFixed(6)}, {data.location.longitude.toFixed(6)}
                    </p>
                </div>
                <button className="mt-4 w-full py-2 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors">
                    Open in Maps
                </button>
            </div>

            {/* TEMPERATURE */}
            <div className="dashboard-card group hover:scale-[1.02]">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl bg-orange-100 text-orange-600`}>
                        <Thermometer className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Internal</p>
                </div>
                <h3 className="status-label !text-slate-400">🌡️ TEMP</h3>
                <p className={`text-3xl font-black ${data.sensors.temperature > 40 ? 'text-danger' : 'text-slate-900'}`}>{data.sensors.temperature}°C</p>
                <div className="mt-4 flex gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">0°C</span>
                    <div className="flex-grow h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1 relative">
                        <div className="h-full bg-gradient-to-r from-blue-400 via-orange-400 to-red-500" style={{ width: `${(data.sensors.temperature / 50) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">50°C</span>
                </div>
            </div>

            {/* LAST UPDATE (HEARTBEAT) */}
            <div className="dashboard-card group hover:scale-[1.02] flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-2xl bg-slate-100 text-slate-600">
                            <Clock className="w-6 h-6" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ESP32 Uptime</p>
                    </div>
                    <h3 className="status-label !text-slate-400">⏰ LAST</h3>
                    <p className="text-2xl font-black text-slate-900">
                        {new Date(data.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-4">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Packet Age</p>
                    <div className="flex items-center justify-between">
                        <p className={`text-sm font-black ${age < 10 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {age < 10 ? 'FRESH' : 'STALE'}
                        </p>
                        <div className={`w-1.5 h-1.5 rounded-full ${age < 10 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SensorGrid;
