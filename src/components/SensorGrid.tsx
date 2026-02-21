import React from 'react';
import { SensorCard } from './SensorCard';
import {
    Thermometer,
    Zap,
    Compass,
    Flame,
    Wind,
    Droplets
} from 'lucide-react';

interface SensorGridProps {
    sensors: {
        temperature: number;
        gforce: number;
        tilt_angle: number;
        fire: boolean;
        gas_leak: boolean;
        water_detected: boolean;
    };
    isOnline: boolean;
}

export const SensorGrid: React.FC<SensorGridProps> = ({ sensors, isOnline }) => {

    const sensorList = [
        {
            icon: Thermometer,
            label: "Internal Temperature",
            value: sensors.temperature.toFixed(1),
            unit: "°C",
            severity: (sensors.temperature > 70 ? "CRITICAL" : sensors.temperature > 50 ? "DANGER" : sensors.temperature > 35 ? "WARNING" : "SAFE") as any,
            color: sensors.temperature > 70 ? "var(--color-critical)" : sensors.temperature > 50 ? "var(--color-danger)" : sensors.temperature > 35 ? "var(--color-warning)" : "var(--color-safe)"
        },
        {
            icon: Zap,
            label: "Impact G-Force",
            value: sensors.gforce.toFixed(2),
            unit: "G",
            severity: (sensors.gforce > 3 ? "CRITICAL" : sensors.gforce > 1.8 ? "DANGER" : "SAFE") as any,
            color: sensors.gforce > 3 ? "var(--color-critical)" : sensors.gforce > 1.8 ? "var(--color-danger)" : "var(--color-safe)"
        },
        {
            icon: Compass,
            label: "Chassis Tilt Angle",
            value: sensors.tilt_angle.toFixed(1),
            unit: "°",
            severity: (Math.abs(sensors.tilt_angle) > 65 ? "WARNING" : "SAFE") as any,
            color: Math.abs(sensors.tilt_angle) > 65 ? "var(--color-warning)" : "var(--color-safe)"
        },
        {
            icon: Flame,
            label: "Fire Risk Factor",
            value: sensors.fire ? "DETECTED" : "NULL",
            severity: (sensors.fire ? "DANGER" : "SAFE") as any,
            color: sensors.fire ? "var(--color-critical)" : "var(--color-safe)"
        },
        {
            icon: Wind,
            label: "Atmospheric Gas",
            value: sensors.gas_leak ? "LEAK!" : "NORMAL",
            severity: (sensors.gas_leak ? "DANGER" : "SAFE") as any,
            color: sensors.gas_leak ? "var(--color-danger)" : "var(--color-safe)"
        },
        {
            icon: Droplets,
            label: "Hydraulic Leakage",
            value: sensors.water_detected ? "LEAK!" : "NONE",
            severity: (sensors.water_detected ? "WARNING" : "SAFE") as any,
            color: sensors.water_detected ? "var(--color-warning)" : "var(--color-safe)"
        }
    ];

    return (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {sensorList.map((sensor, index) => (
                <SensorCard key={index} {...sensor} isOnline={isOnline} />
            ))}
        </section>
    );
};
