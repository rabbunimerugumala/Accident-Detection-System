import React from 'react';
import { SensorCard } from './SensorCard';
import {
    Flame,
    Wind,
    Droplets,
    Zap,
    Navigation,
    Thermometer,
    Volume2,
    Compass
} from 'lucide-react';

interface SensorGridProps {
    sensors: {
        gforce: number;
        tilt_angle: number;
        temperature: number;
        sound_level: number;
        fire: boolean;
        gas_leak: boolean;
        water_detected: boolean;
    };
    hazards: {
        fire: string;
        gas: string;
        water: string;
        temperature: string;
        impact: string;
        tilt: string;
        sound: string;
    };
    location: {
        latitude: number;
        longitude: number;
        gps_fix: boolean;
    };
    system: {
        gps_fix: boolean;
    };
    isOnline: boolean;
}

export const SensorGrid: React.FC<SensorGridProps> = ({ sensors, hazards, location, system, isOnline }) => {

    const sensorList = [
        {
            icon: Flame,
            label: "Fire Hazard",
            value: sensors.fire ? "DETECTED" : "NONE",
            status: hazards.fire,
            severity: hazards.fire as any
        },
        {
            icon: Wind,
            label: "Gas Leak",
            value: sensors.gas_leak ? "DETECTED" : "NORMAL",
            status: hazards.gas,
            severity: hazards.gas as any
        },
        {
            icon: Droplets,
            label: "Water Level",
            value: sensors.water_detected ? "FLOODING" : "DRY",
            status: hazards.water,
            severity: hazards.water as any
        },
        {
            icon: Zap,
            label: "G-Force",
            value: `${sensors.gforce.toFixed(2)} G`,
            status: hazards.impact,
            severity: hazards.impact as any
        },
        {
            icon: Navigation,
            label: "Tilt Angle",
            value: `${sensors.tilt_angle.toFixed(1)}°`,
            status: hazards.tilt,
            severity: hazards.tilt as any
        },
        {
            icon: Thermometer,
            label: "Temperature",
            value: `${sensors.temperature.toFixed(1)}°C`,
            status: hazards.temperature,
            severity: hazards.temperature as any
        },
        {
            icon: Volume2,
            label: "Sound Level",
            value: `${sensors.sound_level.toFixed(0)}`,
            status: hazards.sound,
            severity: hazards.sound as any
        },
        {
            icon: Compass,
            label: "GPS Position",
            value: location.latitude !== 0 ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "No Location Data",
            status: system.gps_fix ? "GPS LOCKED" : "GPS NOT FIXED",
            severity: (system.gps_fix ? 'SAFE' : 'WARNING') as any
        }
    ];

    return (
        <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {sensorList.map((sensor, index) => (
                <SensorCard key={index} {...sensor} isOnline={isOnline} />
            ))}
        </section>
    );
};
