
import React from 'react';
import { SearchIcon } from './icons/SearchIcon.tsx';

interface SearchBarProps {
    onRefresh: () => void;
    isLoading: boolean;
    expirationRange: string;
    onExpirationRangeChange: (range: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
    onRefresh, 
    isLoading,
    expirationRange,
    onExpirationRangeChange
}) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onRefresh();
    };

    const ranges = [
        { label: '1W', value: '1W' },
        { label: '2W', value: '2W' },
        { label: '1M', value: '1M' },
        { label: '3M', value: '3M' },
        { label: '6M', value: '6M' },
        { label: 'All', value: 'ALL' },
    ];

    return (
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-[1.5rem] p-6 shadow-2xl ring-1 ring-white/5">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full max-w-lg flex items-center justify-center gap-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-black py-3 px-6 rounded-xl text-base hover:from-amber-500 hover:to-amber-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.99] shadow-xl uppercase tracking-[0.1em] ring-1 ring-amber-400/10"
                    >
                        {isLoading ? (
                             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <SearchIcon className="w-5 h-5" />
                        )}
                        <span>{isLoading ? 'Syncing Flow...' : 'Sync Market Intelligence'}</span>
                    </button>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-px bg-slate-800/80 flex-grow"></div>
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] px-2">Window</label>
                        <div className="h-px bg-slate-800/80 flex-grow"></div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 justify-center">
                        {ranges.map((range) => (
                            <button
                                key={range.value}
                                type="button"
                                onClick={() => onExpirationRangeChange(range.value)}
                                className={`flex-1 min-w-[70px] py-2 px-3 rounded-lg text-[10px] font-black transition-all border uppercase tracking-widest ${
                                    expirationRange === range.value
                                        ? 'bg-amber-600/10 border-amber-500/40 text-amber-500'
                                        : 'bg-slate-950/40 border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-400'
                                }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                </div>
            </form>
        </div>
    );
};
