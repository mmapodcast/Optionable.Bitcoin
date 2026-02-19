
import React, { useState, useEffect } from 'react';
import { GlobalMarketData } from '../types';
import { GlobeIcon } from './icons/GlobeIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';

interface GlobalMarketCapProps {
    data: GlobalMarketData | null;
    isLoading: boolean;
}

const formatMarketCap = (val: number) => {
    if (val >= 1_000_000_000_000) return `$${(val / 1_000_000_000_000).toFixed(2)}T`;
    if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
    return `$${val.toLocaleString()}`;
};

export const GlobalMarketCap: React.FC<GlobalMarketCapProps> = ({ data, isLoading }) => {
    const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

    useEffect(() => {
        if (data && data.totalMarketCap > 0) {
            setLastFetchTime(new Date());
        }
    }, [data]);

    if (!data && isLoading) {
         return (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg px-4 py-3 mb-8 max-w-fit mx-auto flex items-center gap-3 animate-pulse ring-1 ring-blue-500/20">
                <GlobeIcon className="w-5 h-5 text-blue-500/60 animate-spin-slow" />
                <div className="flex flex-col">
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider">Syncing Global Market Capitalization...</span>
                    <span className="text-blue-400 text-[9px] lowercase font-medium">establishing secure data stream</span>
                </div>
            </div>
        );
    }

    if (!data || data.totalMarketCap === 0) {
         return (
             <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg px-4 py-2 mb-8 max-w-fit mx-auto flex items-center gap-3 opacity-60">
                <GlobeIcon className="w-4 h-4 text-white" />
                <span className="text-white text-[10px] font-bold uppercase tracking-widest">Awaiting live market data stream...</span>
                {isLoading && <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />}
            </div>
         );
    }

    const isPositive = data.change24hPercent >= 0;
    const colorClass = isPositive ? 'text-green-400' : 'text-red-400';
    const arrow = isPositive ? <ArrowUpIcon className="w-2.5 h-2.5" /> : <ArrowDownIcon className="w-2.5 h-2.5" />;

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/60 rounded-lg px-4 py-2 mb-8 max-w-fit mx-auto flex items-center gap-5 text-[10px] font-bold uppercase tracking-widest shadow-xl ring-1 ring-slate-700/30 transition-all duration-300 group hover:ring-blue-500/40">
            <div className="flex items-center gap-2 pr-5 border-r border-slate-700/50">
                 <div className="relative">
                    <GlobeIcon className={`w-5 h-5 ${isLoading ? 'text-blue-500 animate-spin-slow' : 'text-blue-400'} group-hover:text-blue-300 transition-colors`} />
                    <div className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className={`absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 ${isLoading ? 'animate-ping' : ''}`}></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </div>
                 </div>
                 <div className="flex flex-col">
                     <div className="flex items-center gap-1.5 leading-none mb-1">
                        <span className="text-white">Global Market Cap</span>
                        {isLoading && <span className="text-blue-400 lowercase text-[8px] animate-pulse">Refining...</span>}
                     </div>
                     <span className={`text-sm font-black tracking-tight ${colorClass} leading-none flex items-center gap-1`}>
                        {formatMarketCap(data.totalMarketCap)}
                     </span>
                 </div>
            </div>
            
            <div className="flex flex-col">
                <span className="text-white leading-none mb-1">24H Trend</span>
                <div className={`flex items-center gap-0.5 text-sm font-black ${colorClass} leading-none`}>
                    {arrow}
                    <span>{Math.abs(data.change24hPercent).toFixed(2)}%</span>
                </div>
            </div>

            {lastFetchTime && (
                <div className="hidden sm:flex flex-col pl-5 border-l border-slate-700/50">
                    <span className="text-white text-[8px]">Live Feed</span>
                    <span className="text-white text-[9px] lowercase font-medium opacity-60">
                        Synced: {lastFetchTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
            )}
        </div>
    );
};
