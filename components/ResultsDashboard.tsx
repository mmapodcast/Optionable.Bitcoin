
import React from 'react';
import { SummaryMetrics } from './SummaryMetrics.tsx';
import { UnusualActivityTable } from './UnusualActivityTable.tsx';
import { GeminiAnalysis } from './GeminiAnalysis.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { HighlyUnusualTrades } from './HighlyUnusualTrades.tsx';
import { NewsSentimentAnalysis } from './NewsSentimentAnalysis.tsx';
import { TechnicalAnalysis } from './TechnicalAnalysis.tsx';
import { GammaAnalysis } from './GammaAnalysis.tsx';
import type { 
    SummaryData, 
    OptionContract, 
    AnalysisResult, 
    OverallAnalysisResult, 
    NewsSentimentResult, 
    TechnicalAnalysisResult,
    GammaSqueezeResult
} from '../types.ts';
import { MegaphoneIcon } from './icons/MegaphoneIcon.tsx';

interface ResultsDashboardProps {
    summaryData: SummaryData | null;
    unusualContracts: OptionContract[];
    selectedContract: OptionContract | null;
    geminiAnalysis: AnalysisResult | null;
    onSelectContract: (contract: OptionContract | null) => void;
    isLoadingData: boolean;
    isAnalyzing: boolean;
    overallAnalysis: OverallAnalysisResult | null;
    isAnalyzingOverall: boolean;
    mostUnusualCall: OptionContract | null;
    mostUnusualPut: OptionContract | null;
    newsSentimentAnalysis: NewsSentimentResult | null;
    isAnalyzingNews: boolean;
    technicalAnalysis: TechnicalAnalysisResult | null;
    isAnalyzingTechnical: boolean;
    gammaAnalysis: GammaSqueezeResult | null;
    isAnalyzingGamma: boolean;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
    summaryData,
    unusualContracts,
    selectedContract,
    geminiAnalysis,
    onSelectContract,
    isLoadingData,
    isAnalyzing,
    overallAnalysis,
    isAnalyzingOverall,
    mostUnusualCall,
    mostUnusualPut,
    newsSentimentAnalysis,
    isAnalyzingNews,
    technicalAnalysis,
    isAnalyzingTechnical,
    gammaAnalysis,
    isAnalyzingGamma,
}) => {
    if (isLoadingData) {
        return (
            <div className="flex flex-col items-center justify-center bg-slate-900/60 rounded-[2.5rem] p-24 border border-slate-800/50 min-h-[500px] backdrop-blur-md">
                <LoadingSpinner />
                <div className="mt-8 space-y-2 text-center">
                    <p className="text-amber-500 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">
                        Synchronizing Bitcoin Ledger...
                    </p>
                </div>
            </div>
        );
    }

    if (!summaryData) return null;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Top Metrics Row */}
            <SummaryMetrics data={summaryData} />

            {/* High-Impact Highlighting Section */}
            <HighlyUnusualTrades call={mostUnusualCall} put={mostUnusualPut} />

            {/* Primary Operational Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Flow Monitoring */}
                <UnusualActivityTable
                    contracts={unusualContracts}
                    onRowClick={onSelectContract}
                    selectedContractId={selectedContract?.id}
                />

                {/* AI Trade Deep Dive */}
                <GeminiAnalysis
                    analysis={geminiAnalysis}
                    isLoading={isAnalyzing}
                    selectedContract={selectedContract}
                />
            </div>

            {/* Strategic Intelligence Section */}
            <div className="pt-12 border-t border-slate-900">
                <div className="flex items-center justify-center mb-10">
                    <div className="h-px bg-slate-900 flex-grow"></div>
                    <h2 className="px-6 text-[10px] font-black uppercase tracking-[0.4em] text-white whitespace-nowrap">
                        Macro Intelligence Hub
                    </h2>
                    <div className="h-px bg-slate-900 flex-grow"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    <GammaAnalysis analysis={gammaAnalysis} isLoading={isAnalyzingGamma} />

                    <div className="space-y-8 flex flex-col">
                        <div className="bg-slate-900/90 backdrop-blur-lg border border-slate-800 rounded-2xl shadow-2xl p-6 border-l-2 border-l-amber-500 flex-grow transition-all hover:border-amber-500/30">
                            <div className="pb-4 mb-4 border-b border-slate-800/60">
                                <h3 className="text-base font-black text-white flex items-center gap-3 tracking-tight">
                                    <MegaphoneIcon className="w-5 h-5 text-amber-500" />
                                    Bias Override
                                </h3>
                            </div>
                            {isAnalyzingOverall ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <LoadingSpinner />
                                </div>
                            ) : overallAnalysis ? (
                                <div className="space-y-4">
                                    <div className={`text-4xl font-black uppercase tracking-tighter ${
                                        overallAnalysis.bias === 'Bullish' ? 'text-green-500' :
                                        overallAnalysis.bias === 'Bearish' ? 'text-red-500' : 'text-amber-500'
                                    }`}>
                                        {overallAnalysis.bias}
                                    </div>
                                    <p className="text-white text-sm leading-relaxed italic">
                                        "{overallAnalysis.summary}"
                                    </p>
                                </div>
                            ) : null}
                        </div>
                        <NewsSentimentAnalysis 
                            analysis={newsSentimentAnalysis} 
                            isLoading={isAnalyzingNews} 
                        />
                    </div>

                    <TechnicalAnalysis
                        analysis={technicalAnalysis}
                        isLoading={isAnalyzingTechnical}
                    />
                </div>
            </div>
        </div>
    );
};
