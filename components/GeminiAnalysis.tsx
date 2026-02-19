
import React, { useState, useEffect, useCallback } from 'react';
import type { AnalysisResult, OptionContract } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { BrainIcon } from './icons/BrainIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { StopIcon } from './icons/StopIcon';

interface GeminiAnalysisProps {
    analysis: AnalysisResult | null;
    isLoading: boolean;
    selectedContract: OptionContract | null;
}

const AnalysisSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="border-b border-slate-800/50 pb-4 last:border-0">
        <h4 className="text-[10px] font-black text-amber-500 mb-2 uppercase tracking-widest">{title}</h4>
        <div className="text-white text-sm leading-relaxed">{children}</div>
    </div>
);

export const GeminiAnalysis: React.FC<GeminiAnalysisProps> = ({ analysis, isLoading, selectedContract }) => {
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
        return () => { if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = null; };
    }, []);

    const handleToggleSpeech = useCallback(() => {
        if (!('speechSynthesis' in window) || !analysis) return;
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            window.speechSynthesis.cancel();
            const textToRead = `${analysis.actionableSummary}. ${analysis.optionsFlow}.`;
            const utterance = new SpeechSynthesisUtterance(textToRead);
            const preferredVoice = voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('male')) || voices[0];
            if (preferredVoice) utterance.voice = preferredVoice;
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    }, [analysis, isSpeaking, voices]);

    useEffect(() => {
        setIsSpeaking(false);
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }, [selectedContract, analysis]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                    <LoadingSpinner />
                    <p className="mt-6 text-sm font-bold text-white uppercase tracking-widest animate-pulse">Running AI Simulation...</p>
                </div>
            );
        }

        if (analysis) {
            return (
                <div className="space-y-6">
                    <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-2xl mb-4">
                         <h4 className="text-[10px] font-black text-amber-500 mb-2 uppercase tracking-[0.2em]">Priority Verdict</h4>
                         <p className="text-lg font-bold text-white leading-tight">{analysis.actionableSummary}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        <AnalysisSection title="Options Flow Intensity">{analysis.optionsFlow}</AnalysisSection>
                        <AnalysisSection title="Gamma Trigger Profile">{analysis.gammaExposure}</AnalysisSection>
                        <AnalysisSection title="Skew Dynamics">{analysis.skewAndMaxPain}</AnalysisSection>
                        <AnalysisSection title="Catalyst Matrix">{analysis.potentialCatalysts}</AnalysisSection>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-10">
                <div className="p-8 rounded-full bg-slate-900 border border-slate-800 mb-6">
                    <BrainIcon className="w-12 h-12 text-white/20" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Awaiting Target Selection</h4>
                <p className="text-xs text-white uppercase tracking-widest font-bold opacity-60">Select a trade from the flow monitor to begin deep AI decomposition.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl shadow-2xl p-8 sticky top-8 flex flex-col">
            <div className="pb-6 mb-6 border-b border-slate-800/50 flex justify-between items-start">
                <div>
                    {selectedContract ? (
                        <>
                            <h3 className="text-xl font-black text-white tracking-tight">
                                Intelligence Report
                            </h3>
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">
                                {selectedContract.strikePrice} {selectedContract.type} • {selectedContract.expirationDate}
                            </p>
                        </>
                    ) : (
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight">Trade Decomposition</h3>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest mt-1">Neural Analysis Subsystem</p>
                        </div>
                    )}
                </div>
                {analysis && !isLoading && (
                    <button 
                        onClick={handleToggleSpeech}
                        className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
                        aria-label="Toggle Speech"
                    >
                        {isSpeaking ? <StopIcon className="w-5 h-5 text-red-400" /> : <SpeakerIcon className="w-5 h-5 text-amber-400" />}
                    </button>
                )}
            </div>
            <div className="flex-grow overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
                {renderContent()}
            </div>
        </div>
    );
};
