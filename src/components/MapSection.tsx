import { ExternalLink, MapPin } from 'lucide-react';

interface MapSectionProps {
    latitude: number;
    longitude: number;
}

export function MapSection({ latitude, longitude }: MapSectionProps) {
    const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    const externalLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

    return (
        <div className="rounded-3xl overflow-hidden glass border flex flex-col h-[500px]">
            <div className="p-4 border-b bg-card/50 flex justify-between items-center">
                <div className="flex items-center gap-3 text-foreground">
                    <MapPin className="text-critical" />
                    <div>
                        <h3 className="text-sm font-bold">Accident Location</h3>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Live GPS Tracking</p>
                    </div>
                </div>
                <a
                    href={externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-accent/20 transition-all"
                >
                    Open in Google Maps
                    <ExternalLink size={14} />
                </a>
            </div>
            <div className="flex-1 w-full bg-slate-200 dark:bg-slate-800">
                <iframe
                    width="100%"
                    height="100%"
                    id="gmap_canvas"
                    src={mapUrl}
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                />
            </div>
        </div>
    );
}
