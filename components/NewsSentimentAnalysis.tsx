
import React, { useState, useEffect, useCallback } from 'react';
import type { NewsSentimentResult } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { GlobeIcon } from './icons/GlobeIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { StopIcon } from './icons/StopIcon';

interface NewsSentimentAnalysisProps {
    analysis: NewsSentimentResult | null;
    isLoading: boolean;
}

export const NewsSentimentAnalysis: React.FC<NewsSentimentAnalysisProps> = ({ analysis, isLoading }) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        if (!('speechSynthesis' in window)) {
            console.warn("Speech Synthesis API not supported on this browser.");
            return;
        }
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                setVoices(availableVoices);
            }
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
            const textToRead = `News sentiment is ${analysis.bias}. Summary: ${analysis.summary}`;
            const utterance = new SpeechSynthesisUtterance(textToRead);
            const preferredVoice = voices.find(voice => voice.name === 'Google UK English Male') || voices.find(voice => voice.lang.startsWith('en-') && voice.name.toLowerCase().includes('male'));
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    }, [isSpeaking, analysis, voices]);

    useEffect(() => {
        setIsSpeaking(false);
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }, [analysis]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[150px]">
                    <LoadingSpinner />
                    <p className="mt-4 text-white text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Analyzing real-time news sentiment...</p>
                </div>
            );
        }
        
        if (!analysis || !analysis.summary) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[150px] text-center">
                    <p className="text-white font-bold uppercase tracking-widest text-[10px]">Awaiting Sentiment Stream...</p>
                </div>
            );
        }

        const { bias, summary, sources } = analysis;

        return (
            <div className="space-y-4">
                <div>
                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Sentiment Velocity</h4>
                    <p className={`text-2xl font-black tracking-tighter ${
                        bias === 'Bullish' ? 'text-green-500' :
                        bias === 'Bearish' ? 'text-red-500' :
                        'text-amber-500'
                    }`}>
                        {bias}
                    </p>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 shadow-inner">
                    <p className="text-white text-xs leading-relaxed italic">"{summary}"</p>
                </div>
                {sources && sources.length > 0 && (
                    <div>
                        <h4 className="text-[9px] font-black text-white uppercase tracking-widest mb-2">Validated Sources</h4>
                        <ul className="space-y-2 text-[10px] font-bold">
                            {sources.slice(0, 3).map((source, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                                    <a 
                                        href={source.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-white hover:text-amber-500 transition-colors line-clamp-1"
                                        title={source.title}
                                    >
                                        {source.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-slate-900/90 backdrop-blur-lg border border-slate-800 rounded-2xl shadow-2xl p-6 border-l-2 border-l-amber-500 flex-grow transition-all hover:border-amber-500/30">
            <div className="pb-4 mb-4 border-b border-slate-800/60 flex justify-between items-start">
                <div>
                    <h3 className="text-base font-black text-white flex items-center gap-3 tracking-tight">
                        <GlobeIcon className="w-5 h-5 text-amber-500" />
                        Global Sentiment
                    </h3>
                    <p className="text-[10px] text-white uppercase tracking-widest mt-1 font-bold">Real-time macro scan</p>
                </div>
                    {analysis && !isLoading && (
                    <button 
                        onClick={handleToggleSpeech}
                        className="p-2 text-white hover:text-amber-500 transition-colors"
                        aria-label={isSpeaking ? "Stop reading sentiment" : "Read sentiment aloud"}
                    >
                        {isSpeaking 
                            ? <StopIcon className="w-4 h-4 text-red-500" /> 
                            : <SpeakerIcon className="w-4 h-4" />}
                    </button>
                )}
            </div>
            {renderContent()}
        </div>
    );
};
