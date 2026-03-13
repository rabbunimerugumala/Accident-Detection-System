import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, MapPin } from 'lucide-react';

interface MapDisplayProps {
    latitude: number;
    longitude: number;
    accidentDetected: boolean;
    gpsFix: boolean;
    status: string;
}

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

// ─── DEFAULT FALLBACK LOCATION ───────────────────────────────────────────────
// Used when gps_fix === false (device offline or GPS not acquired yet).
// Replace these values with your default/home location.
const FALLBACK_LAT = 14.2262; // ← change latitude here
const FALLBACK_LNG = 79.1384;  // ← change longitude here
// ─────────────────────────────────────────────────────────────────────────────

const MapDisplay: React.FC<MapDisplayProps> = ({ latitude, longitude, accidentDetected, gpsFix, status }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    const isOnline = status === "ONLINE";

    // ── COORDINATE RESOLUTION ──────────────────────────────────────────────
    // gps_fix: true  → use live lat/lng from Firebase DB (sensor data)
    //                   latitude  ← db: accidentState.location.latitude
    //                   longitude ← db: accidentState.location.longitude
    //
    // gps_fix: false → GPS not ready; fall back to hardcoded FALLBACK_LAT/LNG
    //                   (see constants above to update the fallback location)
    // ──────────────────────────────────────────────────────────────────────
    const displayLat = gpsFix ? latitude  : FALLBACK_LAT;
    const displayLng = gpsFix ? longitude : FALLBACK_LNG;

    // Initialise map once — always centred on the resolved coords
    useEffect(() => {
        if (!mapRef.current) return;

        if (!mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapRef.current, {
                zoomControl: true,
                attributionControl: true
            }).setView([FALLBACK_LAT, FALLBACK_LNG], 15); // initial centre = fallback

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstanceRef.current);

            // Permanent marker — starts at fallback, moves when GPS fix arrives
            markerRef.current = L.marker([FALLBACK_LAT, FALLBACK_LNG], { icon: blueIcon })
                .addTo(mapInstanceRef.current)
                .bindPopup('<b>Vehicle Location</b>')
                .openPopup();
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            }
        };
    }, []);

    // Update map view + marker whenever coords or accident state changes
    useEffect(() => {
        if (!mapInstanceRef.current || !markerRef.current) return;

        // displayLat/displayLng is already resolved above:
        //   • gpsFix true  → real coordinates from DB
        //   • gpsFix false → FALLBACK_LAT / FALLBACK_LNG
        const pos: L.LatLngExpression = [displayLat, displayLng];

        mapInstanceRef.current.setView(pos, 15);
        markerRef.current.setLatLng(pos);
        markerRef.current.setIcon(accidentDetected ? redIcon : blueIcon);
        markerRef.current.getPopup()?.setContent(
            accidentDetected ? '<b>Accident Detected Here!</b>' : '<b>Vehicle Location</b>'
        );
    }, [displayLat, displayLng, accidentDetected]);

    const googleMapsUrl = `https://www.google.com/maps?q=${displayLat},${displayLng}`;

    return (
        <div className="glass-card overflow-hidden !p-0 border border-color shadow-2xl relative flex flex-col h-[480px]">
            <div className="p-4 border-b border-color flex items-center justify-between bg-white/5 z-10">
                <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                        <h3 className="text-sm font-black tracking-tight">Live Satellite Tracking</h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest leading-none">
                            {/* Shows live coords when GPS fix is active, fallback otherwise */}
                            {gpsFix
                                ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                                : `${FALLBACK_LAT.toFixed(6)}, ${FALLBACK_LNG.toFixed(6)}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Open in Google Maps — always visible */}
                    <button
                        onClick={() => window.open(googleMapsUrl, '_blank')}
                        className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors"
                        title="Open in Google Maps"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                    {/* GPS status badge */}
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${gpsFix ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {gpsFix ? 'GPS LIVE' : isOnline ? 'NO FIX' : 'OFFLINE'}
                    </span>
                </div>
            </div>

            {/* Map always renders — no spinner overlay */}
            <div className="flex-1 relative">
                <div ref={mapRef} className="absolute inset-0 z-0" style={{ height: '400px' }} />
            </div>
        </div>
    );
};

export default MapDisplay;
