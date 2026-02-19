
import React, { useState, useEffect, useCallback } from 'react';
import type { TechnicalAnalysisResult } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { WaveIcon } from './icons/WaveIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { StopIcon } from './icons/StopIcon';

interface TechnicalAnalysisProps {
    analysis: TechnicalAnalysisResult | null;
    isLoading: boolean;
}

const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export const TechnicalAnalysis: React.FC<TechnicalAnalysisProps> = ({ analysis, isLoading }) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        if (!('speechSynthesis' in window)) return;
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) setVoices(availableVoices);
        };
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.onvoiceschanged = null;
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const handleToggleSpeech = useCallback(() => {
        if (!('speechSynthesis' in window) || !analysis) return;
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            window.speechSynthesis.cancel();
            const textToRead = `Technical bias is ${analysis.bias}. Summary: ${analysis.summary}`;
            const utterance = new SpeechSynthesisUtterance(textToRead);
            const preferredVoice = voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('male')) || voices[0];
            if (preferredVoice) utterance.voice = preferredVoice;
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    }, [isSpeaking, analysis, voices]);

    useEffect(() => {
        setIsSpeaking(false);
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }, [analysis]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                    <LoadingSpinner />
                </div>
            );
        }
        
        if (!analysis) return null;

        const { bias, summary, supportLevels = [], resistanceLevels = [], movingAverageAnalysis, indicatorAnalysis } = analysis;

        return (
            <div className="space-y-6">
                <div>
                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-2">Trend Bias</h4>
                    <div className={`text-4xl font-black uppercase tracking-tighter ${
                        bias === 'Bullish' ? 'text-green-500' :
                        bias === 'Bearish' ? 'text-red-500' : 'text-amber-500'
                    }`}>
                        {bias}
                    </div>
                </div>

                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
                    <p className="text-white text-sm leading-relaxed italic">"{summary}"</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-500/5 p-3 rounded-xl border border-green-500/10">
                        <h4 className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-2">Support</h4>
                        <div className="space-y-1">
                            {supportLevels.length > 0 ? supportLevels.map((level, i) => (
                                <div key={i} className="text-xs font-mono font-bold text-white">{formatCurrency(level)}</div>
                            )) : <div className="text-xs text-white/40">No Data</div>}
                        </div>
                    </div>
                    <div className="bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                        <h4 className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-2">Resistance</h4>
                        <div className="space-y-1">
                            {resistanceLevels.length > 0 ? resistanceLevels.map((level, i) => (
                                <div key={i} className="text-xs font-mono font-bold text-white">{formatCurrency(level)}</div>
                            )) : <div className="text-xs text-white/40">No Data</div>}
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <h4 className="text-[9px] font-black text-white uppercase tracking-widest">Averages</h4>
                        <p className="text-xs text-white font-medium">{movingAverageAnalysis}</p>
                    </div>
                    <div>
                        <h4 className="text-[9px] font-black text-white uppercase tracking-widest">Oscillators</h4>
                        <p className="text-xs text-white font-medium">{indicatorAnalysis}</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-slate-900/90 backdrop-blur-lg border border-slate-800 rounded-2xl shadow-2xl p-6 border-l-2 border-l-amber-500 h-full flex flex-col transition-all hover:border-amber-500/30">
            <div className="pb-4 mb-4 border-b border-slate-800/60 flex justify-between items-start">
                <div>
                    <h3 className="text-base font-black text-white flex items-center gap-3 tracking-tight">
                        <WaveIcon className="w-5 h-5 text-amber-500" />
                        AI Technicians
                    </h3>
                </div>
                 {analysis && !isLoading && (
                    <button onClick={handleToggleSpeech} className="p-2 text-white hover:text-amber-500 transition-colors">
                        {isSpeaking ? <StopIcon className="w-4 h-4 text-red-500" /> : <SpeakerIcon className="w-4 h-4" />}
                    </button>
                )}
            </div>
            {renderContent()}
        </div>
    );
};
