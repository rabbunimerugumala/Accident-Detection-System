import React from 'react';

interface MapDisplayProps {
    latitude: number;
    longitude: number;
}

const MapDisplay: React.FC<MapDisplayProps> = ({ latitude, longitude }) => {
    return (
        <div className="dashboard-card overflow-hidden !p-0 h-[300px] border-2 border-slate-100 shadow-xl">
            <iframe
                width="100%"
                height="100%"
                src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
                title="Vehicle Location"
                className="grayscale-[0.5] contrast-[1.1]"
            />
        </div>
    );
};

export default MapDisplay;
