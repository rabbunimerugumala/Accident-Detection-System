import React, { useMemo } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { Maximize2, MapPin } from 'lucide-react';

interface MapDisplayProps {
    latitude: number;
    longitude: number;
}

const containerStyle = {
    width: '100%',
    height: '400px'
};

const MapDisplay: React.FC<MapDisplayProps> = ({ latitude, longitude }) => {
    // Note: In a real app, you'd use an environment variable for the API key
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "" // User can add key here
    });

    const center = useMemo(() => ({
        lat: latitude,
        lng: longitude
    }), [latitude, longitude]);

    const mapOptions = useMemo(() => ({
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
        styles: [
            {
                "elementType": "geometry",
                "stylers": [{ "color": "#212121" }]
            },
            {
                "elementType": "labels.icon",
                "stylers": [{ "visibility": "off" }]
            },
            {
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#757575" }]
            },
            {
                "elementType": "labels.text.stroke",
                "stylers": [{ "color": "#212121" }]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry",
                "stylers": [{ "color": "#757575" }]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{ "color": "#000000" }]
            },
            {
                "featureType": "water",
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#3d3d3d" }]
            }
        ]
    }), []);

    const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

    return (
        <div className="glass-card overflow-hidden !p-0 border border-color shadow-2xl">
            <div className="p-4 border-b border-color flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                        <h3 className="text-sm font-black tracking-tight">Live Satellite Tracking</h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest leading-none">
                            {latitude.toFixed(6)}, {longitude.toFixed(6)}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => window.open(googleMapsUrl, '_blank')}
                    className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors"
                >
                    <Maximize2 className="w-4 h-4" />
                </button>
            </div>

            <div className="relative">
                {isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={center}
                        zoom={15}
                        options={mapOptions}
                    >
                        <MarkerF
                            position={center}
                        />
                    </GoogleMap>
                ) : (
                    <div className="w-full h-[400px] bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm font-bold text-muted uppercase tracking-widest">
                            Syncing Satellite Data...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapDisplay;

