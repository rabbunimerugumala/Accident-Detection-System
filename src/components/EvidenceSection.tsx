import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CheckCircle2, AlertCircle, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Evidence } from '../types';

interface EvidenceSectionProps {
    data: Evidence;
}

export default function EvidenceSection({ data }: EvidenceSectionProps) {
    const [showLockedBanner, setShowLockedBanner] = useState(false);
    const [bothReadyProcessed, setBothReadyProcessed] = useState(false);

    // "EVIDENCE LOCKED" Banner Logic
    useEffect(() => {
        const bothReady = data.cam1_ready && data.cam2_ready;
        if (bothReady && !bothReadyProcessed) {
            setShowLockedBanner(true);
            setBothReadyProcessed(true);
            const t = setTimeout(() => setShowLockedBanner(false), 3000);
            return () => clearTimeout(t);
        } else if (!bothReady) {
            setBothReadyProcessed(false);
        }
    }, [data.cam1_ready, data.cam2_ready, bothReadyProcessed]);

    const renderCard = (
        url: string,
        label: string,
        ready: boolean,
        iconBg: string,
        iconColor: string
    ) => {
        const [imgError, setImgError] = useState(false);
        const [imgLoaded, setImgLoaded] = useState(false);

        // Reset states if URL changes
        useEffect(() => {
            setImgError(false);
            setImgLoaded(false);
        }, [url]);

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.4 }}
                className="bg-[#1a2333] border border-[#2a3649] shadow-xl rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden group"
            >
                {/* Glow Effect behind card on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 z-10">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
                            <Camera className={`w-5 h-5 ${iconColor}`} />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-lg">{label}</h3>
                            {!ready && (
                                <div className="text-xs text-slate-500 mt-0.5">
                                    Standby mode
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Badge */}
                    <div className="z-10">
                        {ready && !imgError ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                CAPTURED
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold tracking-wide animate-pulse">
                                <AlertCircle className="w-3.5 h-3.5" />
                                WAITING FOR TRIGGER
                            </div>
                        )}
                    </div>
                </div>

                {/* Image Area */}
                <div className="mt-2 w-full aspect-video rounded-xl overflow-hidden bg-[#0f172a] border border-[#2a3649] relative flex items-center justify-center group/img cursor-pointer">
                    {ready && url && !imgError ? (
                        <>
                            {/* Skeleton Preloader */}
                            {!imgLoaded && (
                                <div className="absolute inset-0 bg-slate-800/50 animate-pulse flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-slate-600 animate-bounce" />
                                </div>
                            )}

                            <img
                                src={url}
                                alt={label}
                                className={`w-full h-full object-cover transition-all duration-700 ${imgLoaded ? 'opacity-100 group-hover/img:scale-105 group-hover/img:brightness-110' : 'opacity-0 scale-95 blur-sm'}`}
                                onLoad={() => setImgLoaded(true)}
                                onError={() => setImgError(true)}
                                onClick={() => window.open(url, '_blank')}
                                title="Click to view full image"
                            />
                            {imgLoaded && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                                    <ExternalLink className="w-8 h-8 text-white drop-shadow-lg scale-50 group-hover/img:scale-100 transition-transform duration-300" />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                            <Camera className="w-10 h-10 mb-3 opacity-30 group-hover/img:opacity-50 transition-opacity" />
                            <p className="text-sm font-medium tracking-wide">Awaiting ESP32-CAM trigger</p>
                            {/* Subtle pulsing border overlay */}
                            <div className="absolute inset-0 border-2 border-slate-700/30 rounded-xl animate-pulse pointer-events-none" />
                        </div>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="w-full flex flex-col gap-5 px-2">
            
            {/* Section Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                        <h2 className="text-xl md:text-2xl font-bold text-white tracking-widest uppercase">
                            Evidence Capture <span className="text-slate-500 font-normal ml-2">— Road + Driver</span>
                        </h2>
                    </div>

                    {/* "Locked" Banner Indicator */}
                    <AnimatePresence>
                        {showLockedBanner && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 border border-emerald-500/50 rounded-full text-emerald-400 font-bold text-sm tracking-widest pointer-events-none"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                EVIDENCE LOCKED
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    {renderCard(
                        data.cam1_url,
                        data.cam1_label || 'Road Scene',
                        data.cam1_ready,
                        'bg-blue-500/10',
                        'text-blue-400'
                    )}
                    {/* 
                    {renderCard(
                        data.cam2_url,
                        data.cam2_label || 'Driver Condition',
                        data.cam2_ready,
                        'bg-purple-500/10',
                        'text-purple-400'
                    )}
                    */}
                </div>
        </div>
    );
}
