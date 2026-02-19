
import React from 'react';
import type { SummaryData } from '../types';
import { ChartIcon } from './icons/ChartIcon';
import { DollarIcon } from './icons/DollarIcon';
import { ScaleIcon } from './icons/ScaleIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';

interface SummaryMetricsProps {
    data: SummaryData;
}

const formatCurrency = (value: number) => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
};

const MetricItem: React.FC<{ icon: React.ReactNode; label: string; value: string; colorClass?: string }> = ({ icon, label, value, colorClass }) => (
    <div className="flex items-center gap-5 px-8 py-6 group">
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white group-hover:text-amber-500 group-hover:border-amber-500/30 transition-all">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white mb-1 group-hover:text-slate-200 transition-colors">{label}</p>
            <p className={`text-2xl font-black tracking-tight ${colorClass || 'text-white'}`}>{value}</p>
        </div>
    </div>
);

export const SummaryMetrics: React.FC<SummaryMetricsProps> = ({ data }) => {
    const isPositive = data.priceChange24h > 0;
    const priceColor = isPositive ? 'text-green-500' : 'text-red-500';
    const ratioColor = data.putCallRatio > 1.2 ? 'text-green-400' : data.putCallRatio < 0.8 ? 'text-red-400' : 'text-amber-500';

    return (
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/80 rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/5">
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800/60">
                {/* Live Spot Tracker */}
                <div className="flex-1 flex items-center gap-6 px-10 py-8 bg-slate-950/40">
                    <div className={`p-5 rounded-3xl ${isPositive ? 'bg-green-500/10' : 'bg-red-500/10'} border border-slate-800/50 shadow-inner`}>
                        {isPositive ? <ArrowUpIcon className={`w-10 h-10 ${priceColor}`} /> : <ArrowDownIcon className={`w-10 h-10 ${priceColor}`} />}
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white mb-2">Ticker: BTC/USD</p>
                        <div className="flex flex-col">
                            <span className="text-4xl font-black tracking-tighter text-white">
                                ${data.underlyingPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </span>
                            <span className={`text-xs font-black mt-1 ${priceColor}`}>
                                {isPositive ? '▲' : '▼'} {Math.abs(data.priceChange24h).toFixed(2)}% (24H)
                            </span>
                        </div>
                    </div>
                </div>

                {/* Analytical Overlays */}
                <div className="flex-[2] grid grid-cols-1 sm:grid-cols-3">
                    <MetricItem 
                        icon={<ChartIcon className="w-6 h-6" />} 
                        label="Vol Spike" 
                        value={data.totalUnusualVolume.toLocaleString(undefined, {maximumFractionDigits: 0})}
                        colorClass="text-amber-500"
                    />
                    <MetricItem 
                        icon={<DollarIcon className="w-6 h-6" />} 
                        label="Notional At Stake" 
                        value={formatCurrency(data.totalNotionalValue)}
                        colorClass="text-green-500"
                    />
                    <MetricItem 
                        icon={<ScaleIcon className="w-6 h-6" />} 
                        label="Call/Put Flow" 
                        value={data.putCallRatio.toFixed(2)}
                        colorClass={ratioColor}
                    />
                </div>
            </div>
        </div>
    );
};
