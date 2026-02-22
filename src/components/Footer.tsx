import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="mt-10 py-8">
            <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-3">
                <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-slate-500 to-transparent" />
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-center">
                    <span className="bg-gradient-to-b from-slate-200 via-slate-400 to-slate-500 bg-clip-text text-transparent drop-shadow-sm">
                        Designed by Rcubix Technologies
                    </span>
                </p>
            </div>
        </footer>
    );
};

export default Footer;
