
import React from 'react';
import type { OptionContract } from '../types';
import { FireIcon } from './icons/FireIcon';

interface HighlyUnusualTradesProps {
    call: OptionContract | null;
    put: OptionContract | null;
}

const formatNumber = (num: number, digits = 2) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

const formatCurrency = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
    return `$${value.toFixed(0)}`;
};

const TradeCard: React.FC<{ trade: OptionContract }> = ({ trade }) => {
    const isCall = trade.type === 'CALL';
    const notionalValue = trade.volume * trade.underlyingPrice;
    const volRatio = trade.openInterest > 0 ? trade.volume / trade.openInterest : Infinity;
    const cardColor = isCall ? 'border-green-600/50 bg-green-900/20' : 'border-red-600/50 bg-red-900/20';
    const textColor = isCall ? 'text-green-400' : 'text-red-400';

    return (
        <div className={`rounded-xl p-4 flex-1 ${cardColor} border`}>
            <p className={`text-lg font-bold ${textColor} mb-2`}>Most Unusual {trade.type}</p>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-white opacity-60">Strike / Exp:</span>
                    <span className="font-semibold text-white">${formatNumber(trade.strikePrice, 0)} (Exp: {trade.expirationDate})</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-white opacity-60">Volume:</span>
                    <span className="font-semibold text-white">{formatNumber(trade.volume, 2)} Coins</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-white opacity-60">Notional Value:</span>
                    <span className="font-semibold text-white">{formatCurrency(notionalValue)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-white opacity-60">Vol/OI Ratio:</span>
                    <span className="font-semibold text-white">{isFinite(volRatio) ? `${formatNumber(volRatio)}x` : 'New Position'}</span>
                </div>
            </div>
        </div>
    );
};

export const HighlyUnusualTrades: React.FC<HighlyUnusualTradesProps> = ({ call, put }) => {
    if (!call && !put) {
        return null;
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-4 mb-6">
            <div className="pb-3 mb-3 border-b border-slate-700">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <FireIcon className="w-6 h-6 text-amber-400" />
                    Overall Highly unusual Activity
                </h3>
                <p className="text-sm text-white opacity-70">The single most significant Call and Put detected today.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
                {call ? <TradeCard trade={call} /> : <div className="flex-1 text-center py-8 text-white opacity-40">No unusual calls found.</div>}
                {put ? <TradeCard trade={put} /> : <div className="flex-1 text-center py-8 text-white opacity-40">No unusual puts found.</div>}
            </div>
        </div>
    );
};
