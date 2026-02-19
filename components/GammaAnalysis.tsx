
import React from 'react';
import type { GammaSqueezeResult, GammaLevel } from '../types.ts';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { ScaleIcon } from './icons/ScaleIcon.tsx';

interface GammaAnalysisProps {
    analysis: GammaSqueezeResult | null;
    isLoading: boolean;
}

const LEVEL_DESCRIPTIONS: Record<string, string> = {
    'Call Wall': 'The strike with the highest positive gamma. Acts as a major resistance level where market makers sell to hedge.',
    'Put Wall': 'The strike with the highest negative gamma. Acts as a major support floor where market makers buy to hedge.',
    'Zero Gamma': 'The transition point between positive and negative gamma. Expect high volatility if price breaks below this.',
    'Neutral': 'Balanced hedging activity at this strike.'
};

export const GammaAnalysis: React.FC<GammaAnalysisProps> = ({ analysis, isLoading }) => {
    if (isLoading) {
        return (
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-8 flex flex-col items-center min-h-[250px] justify-center shadow-2xl">
                <LoadingSpinner />
                <p className="mt-4 text-white text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Mapping Bitcoin Gamma Walls...</p>
            </div>
        );
    }

    if (!analysis) return null;

    return (
        <div className="bg-slate-900/90 backdrop-blur-lg border border-slate-800 rounded-2xl shadow-2xl p-6 border-l-2 border-l-amber-500 h-full flex flex-col transition-all hover:border-amber-500/30">
            <div className="pb-4 mb-5 border-b border-slate-800/60 flex justify-between items-center">
                <div>
                    <h3 className="text-base font-black text-white flex items-center gap-3 tracking-tight">
                        <ScaleIcon className="w-5 h-5 text-amber-500" />
                        BTC Gamma Intel
                    </h3>
                    <p className="text-[10px] text-white uppercase tracking-widest mt-1 font-bold">Structural positioning</p>
                </div>
                <div className="text-right">
                    <span className="text-[9px] uppercase text-white font-black tracking-widest">Squeeze Risk</span>
                    <div className={`text-xl font-black tracking-tighter ${
                        analysis.squeezeProbability === 'High' || analysis.squeezeProbability === 'Extreme' ? 'text-red-500' : 'text-green-500'
                    }`}>
                        {analysis.squeezeProbability}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 mb-6">
                <div>
                    <h4 className="text-[9px] font-black text-white uppercase tracking-[0.3em] mb-3">Market Regime</h4>
                    <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                        <div className={`text-lg font-black tracking-tight ${analysis.gammaRegime === 'Positive' ? 'text-blue-400' : 'text-amber-500'}`}>
                            {analysis.gammaRegime} Gamma
                        </div>
                        <span className="text-[10px] text-white font-bold bg-slate-900 px-2 py-1 rounded">
                            {analysis.gammaRegime === 'Positive' ? 'STABLE' : 'HIGH VOL'}
                        </span>
                    </div>
                </div>

                <div>
                    <h4 className="text-[9px] font-black text-white uppercase tracking-[0.3em] mb-3">Hedging Barriers</h4>
                    <div className="space-y-2">
                        {analysis.keyLevels?.map((lvl: GammaLevel, idx: number) => (
                            <div 
                                key={idx} 
                                className="group relative flex items-center justify-between p-3 rounded-xl bg-slate-950/30 border border-slate-800/40 hover:border-slate-700 transition-colors cursor-help"
                            >
                                <div className="flex flex-col">
                                    <span className={`text-[10px] font-black tracking-[0.1em] uppercase mb-0.5 ${
                                        lvl.type === 'Call Wall' ? 'text-green-500' : 
                                        lvl.type === 'Put Wall' ? 'text-red-500' : 'text-blue-400'
                                    }`}>
                                        {lvl.type}
                                    </span>
                                    <span className="text-xs text-white font-medium italic truncate max-w-[120px]">
                                        {lvl.gammaValue}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm text-white font-mono font-black">${lvl.strike?.toLocaleString() || 'N/A'}</span>
                                </div>

                                {/* Custom Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-[10px] text-white rounded-lg shadow-2xl border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 leading-relaxed font-bold">
                                    {LEVEL_DESCRIPTIONS[lvl.type] || 'Critical BTC price point.'}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                                </div>
                            </div>
                        ))}
                        {(!analysis.keyLevels || analysis.keyLevels.length === 0) && (
                            <div className="text-center py-4 text-white text-[10px] font-bold uppercase tracking-widest">
                                Calculating Wall Proxies...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-auto bg-slate-950/60 p-4 rounded-xl border border-slate-800/60 shadow-inner">
                <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] mb-2">Neural Decomposition</h4>
                <p className="text-white text-xs leading-relaxed font-medium italic">
                    "{analysis.commentary}"
                </p>
            </div>
        </div>
    );
};
