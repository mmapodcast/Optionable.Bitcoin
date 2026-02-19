
import React, { useState, useEffect, useCallback } from 'react';
import type { AnalystRatingResult } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { StopIcon } from './icons/StopIcon';

interface AnalystRatingsProps {
    analysis: AnalystRatingResult | null;
    isLoading: boolean;
}

export const AnalystRatings: React.FC<AnalystRatingsProps> = ({ analysis, isLoading }) => {
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
            const viewsText = analysis.analystViews.join(". ");
            const textToRead = `
                Top Analysts Rating is ${analysis.bias}.
                Summary: ${analysis.summary}.
                Key Views: ${viewsText}.
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
                    <p className="mt-4 text-slate-300">Aggregating analyst ratings...</p>
                </div>
            );
        }
        
        if (!analysis) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[150px] text-center">
                    <p className="text-slate-500">Could not retrieve analyst ratings.</p>
                </div>
            );
        }

        const { bias, summary, analystViews } = analysis;

        return (
            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-semibold text-blue-400 mb-1 uppercase tracking-wider">Consensus Rating</h4>
                    <p className={`text-2xl font-bold ${
                        bias === 'Bullish' ? 'text-green-400' :
                        bias === 'Bearish' ? 'text-red-400' :
                        'text-yellow-400'
                    }`}>
                        {bias}
                    </p>
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-blue-400 mb-1 uppercase tracking-wider">Summary</h4>
                    <p className="text-slate-300 leading-relaxed">{summary}</p>
                </div>
                {analystViews && analystViews.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-blue-400 mb-2 uppercase tracking-wider">Key Analyst Views</h4>
                        <ul className="space-y-2 list-disc list-inside text-sm text-slate-300">
                            {analystViews.map((view, index) => (
                                <li key={index} className="leading-relaxed">
                                    {view}
                                </li>
                            ))}
                        </ul>
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
                            <UserGroupIcon className="w-6 h-6 text-blue-400" />
                            Top Analysts Ratings
                        </h3>
                        <p className="text-sm text-slate-400">Expert opinions & price targets from across the web.</p>
                    </div>
                     {analysis && !isLoading && (
                        <button 
                            onClick={handleToggleSpeech}
                            className="p-2 -mr-2 -mt-2 rounded-full hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label={isSpeaking ? "Stop reading ratings" : "Read ratings aloud"}
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
