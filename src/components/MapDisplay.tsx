import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, MapPin, Navigation } from 'lucide-react';

interface MapDisplayProps {
    latitude: number;
    longitude: number;
    accidentDetected: boolean;
    gpsFix: boolean;
    status: string;
}

// Fix for default Leaflet icon issue in React/Vite
const blueIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const MapDisplay: React.FC<MapDisplayProps> = ({ latitude, longitude, accidentDetected, gpsFix, status }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    const isOnline = status === "ONLINE";
    const hasValidCoords = isOnline && latitude !== 0 && longitude !== 0 && gpsFix;

    useEffect(() => {
        if (!mapRef.current) return;

        // Initialize map
        if (!mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapRef.current, {
                zoomControl: true,
                attributionControl: true
            }).setView([latitude || 0, longitude || 0], 15);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstanceRef.current);
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!mapInstanceRef.current) return;

        if (hasValidCoords) {
            const pos: L.LatLngExpression = [latitude, longitude];

            // Update view
            mapInstanceRef.current.setView(pos, 15);

            // Update or create marker
            if (markerRef.current) {
                markerRef.current.setLatLng(pos);
                markerRef.current.setIcon(accidentDetected ? redIcon : blueIcon);
                markerRef.current.getPopup()?.setContent(accidentDetected ? "<b>Accident Detected Here!</b>" : "<b>Current Vehicle Location</b>");
            } else {
                markerRef.current = L.marker(pos, { icon: accidentDetected ? redIcon : blueIcon })
                    .addTo(mapInstanceRef.current)
                    .bindPopup(accidentDetected ? "<b>Accident Detected Here!</b>" : "<b>Current Vehicle Location</b>")
                    .openPopup();
            }
        } else {
            // Remove marker if GPS lost or offline
            if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
        }
    }, [latitude, longitude, accidentDetected, hasValidCoords, isOnline]);

    const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

    return (
        <div className="glass-card overflow-hidden !p-0 border border-color shadow-2xl relative flex flex-col h-[480px]">
            <div className="p-4 border-b border-color flex items-center justify-between bg-white/5 z-10">
                <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                        <h3 className="text-sm font-black tracking-tight">Live Satellite Tracking</h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest leading-none">
                            {hasValidCoords ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : (isOnline ? "GPS SIGNAL LOST" : "SYSTEM LINK OFFLINE")}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {hasValidCoords && (
                        <button
                            onClick={() => window.open(googleMapsUrl, '_blank')}
                            className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors"
                            title="Open in Google Maps"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 relative">
                <div ref={mapRef} className="absolute inset-0 z-0" style={{ height: '400px' }} />

                {!hasValidCoords && (
                    <div className="absolute inset-0 z-20 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
                            <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <Navigation className={`absolute inset-0 m-auto w-6 h-6 ${isOnline ? 'text-primary' : 'text-danger'} animate-pulse`} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-black text-main uppercase tracking-widest">
                                {isOnline ? "Searching for GPS Fix..." : "Device Connection Lost"}
                            </p>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">
                                {isOnline ? "Satellite triangulation in progress" : "Awaiting heartbeat signal reset"}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapDisplay;
