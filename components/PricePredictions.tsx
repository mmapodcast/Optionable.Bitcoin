
import React, { useState, useEffect, useCallback } from 'react';
import type { PredictionResult } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { TargetIcon } from './icons/TargetIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { StopIcon } from './icons/StopIcon';

interface PricePredictionsProps {
    analysis: PredictionResult | null;
    isLoading: boolean;
}

export const PricePredictions: React.FC<PricePredictionsProps> = ({ analysis, isLoading }) => {
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
            const predsText = analysis.predictions.map(p => `${p.probability} chance of reaching ${p.targetPrice} by ${p.deadline} according to ${p.source}`).join(". ");
            const textToRead = `
                Market Predictions Summary: ${analysis.summary}.
                Details: ${predsText}.
            `;
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
                    <p className="mt-4 text-slate-300">Fetching prediction market data...</p>
                </div>
            );
        }
        
        if (!analysis) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[150px] text-center">
                    <p className="text-slate-500">Could not retrieve prediction market data.</p>
                </div>
            );
        }

        const { summary, predictions } = analysis;

        return (
            <div className="space-y-6">
                <div>
                    <h4 className="text-sm font-semibold text-blue-400 mb-1 uppercase tracking-wider">Market Consensus</h4>
                    <p className="text-slate-300 leading-relaxed">{summary}</p>
                </div>
                
                {predictions && predictions.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {predictions.map((item, index) => {
                            // Basic parsing to see if probability is high or low for coloring
                            const probVal = parseInt(item.probability);
                            const probColor = !isNaN(probVal) && probVal > 50 ? 'text-green-400' : 'text-slate-200';
                            
                            return (
                                <div key={index} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50 hover:border-blue-500/30 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs text-slate-400 uppercase tracking-wide">{item.source}</span>
                                        <span className={`font-bold text-lg ${probColor}`}>{item.probability}</span>
                                    </div>
                                    <div className="mb-1">
                                        <span className="text-slate-400 text-sm">Target: </span>
                                        <span className="text-white font-semibold">{item.targetPrice}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 text-sm">By: </span>
                                        <span className="text-slate-300 text-sm">{item.deadline}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mt-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
                <div className="pb-4 mb-4 border-b border-slate-700 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                            <TargetIcon className="w-6 h-6 text-blue-400" />
                            Market Predictions & Odds
                        </h3>
                        <p className="text-sm text-slate-400">Crowd-sourced probabilities from Polymarket, Kalshi, etc.</p>
                    </div>
                     {analysis && !isLoading && (
                        <button 
                            onClick={handleToggleSpeech}
                            className="p-2 -mr-2 -mt-2 rounded-full hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label={isSpeaking ? "Stop reading predictions" : "Read predictions aloud"}
                            title={isSpeaking ? "Stop reading" : "Read aloud"}
                        >
                            {isSpeaking 
                                ? <StopIcon className="w-5 h-5 text-red-400" /> 
                                : <SpeakerIcon className="w-5 h-5 text-blue-400" />}
                        </button>
                    )}
                </div>
                {renderContent()}
            </div>
        </div>
    );
};
