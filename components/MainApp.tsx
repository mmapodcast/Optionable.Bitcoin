
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { SearchBar } from './SearchBar.tsx';
import { ResultsDashboard } from './ResultsDashboard.tsx';
import { fetchOptionsData, DataSource, FetchResult, fetchGlobalMarketData } from '../services/marketDataService.ts';
import type { 
    OptionContract, 
    AnalysisResult, 
    SummaryData, 
    OverallAnalysisResult, 
    NewsSentimentResult, 
    TechnicalAnalysisResult, 
    GlobalMarketData,
    GammaSqueezeResult
} from '../types.ts';
import { 
    getGeminiAnalysis, 
    getOverallAnalysis, 
    getNewsSentimentWithSearch, 
    getTechnicalAnalysis,
    getGammaSqueezeAnalysis
} from '../services/geminiService.ts';
import { AdminModal } from '../pages/LoginPage.tsx';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon.tsx';
import { defaultInfoContent } from '../types.ts';

const MainApp: React.FC = () => {
    const [ticker, setTicker] = useState<string>('BTC');
    const [selectedContract, setSelectedContract] = useState<OptionContract | null>(null);
    const [geminiAnalysis, setGeminiAnalysis] = useState<AnalysisResult | null>(null);
    const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [overallAnalysis, setOverallAnalysis] = useState<OverallAnalysisResult | null>(null);
    const [isAnalyzingOverall, setIsAnalyzingOverall] = useState<boolean>(false);
    const [newsSentimentAnalysis, setNewsSentimentAnalysis] = useState<NewsSentimentResult | null>(null);
    const [isAnalyzingNews, setIsAnalyzingNews] = useState<boolean>(false);
    const [technicalAnalysis, setTechnicalAnalysis] = useState<TechnicalAnalysisResult | null>(null);
    const [isAnalyzingTechnical, setIsAnalyzingTechnical] = useState<boolean>(false);
    const [gammaAnalysis, setGammaAnalysis] = useState<GammaSqueezeResult | null>(null);
    const [isAnalyzingGamma, setIsAnalyzingGamma] = useState<boolean>(false);
    
    const [error, setError] = useState<string | null>(null);
    const [dataSourceUsed, setDataSourceUsed] = useState<DataSource | null>(null);
    const [expirationRange, setExpirationRange] = useState<string>('ALL');
    const [rawMarketData, setRawMarketData] = useState<{ contracts: OptionContract[]; underlyingPrice: number; priceChange24h: number; name: string; } | null>(null);
    
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [infoContent, setInfoContent] = useState('');

    useEffect(() => {
        setInfoContent(localStorage.getItem('infoContent') || defaultInfoContent);
    }, []);

    const handleRefresh = useCallback(async () => {
        setIsLoadingData(true);
        setError(null);
        setSelectedContract(null);
        setGeminiAnalysis(null);
        setOverallAnalysis(null);

        try {
            const result = await fetchOptionsData('BTC');
            setDataSourceUsed(result.source);
            setRawMarketData(result);
            
            setIsAnalyzingNews(true);
            getNewsSentimentWithSearch('BTC').then(setNewsSentimentAnalysis).finally(() => setIsAnalyzingNews(false));
            
            setIsAnalyzingTechnical(true);
            getTechnicalAnalysis('BTC', result.underlyingPrice).then(setTechnicalAnalysis).finally(() => setIsAnalyzingTechnical(false));
            
            setIsAnalyzingGamma(true);
            getGammaSqueezeAnalysis('BTC', result.underlyingPrice).then(setGammaAnalysis).finally(() => setIsAnalyzingGamma(false));

        } catch (err) {
            setError((err as Error).message || 'Refresh failed.');
        } finally {
            setIsLoadingData(false);
        }
    }, []);

    // Filtered contracts based on Expiration Window
    const filteredContracts = useMemo(() => {
        if (!rawMarketData) return [];
        const now = new Date();
        return rawMarketData.contracts.filter(c => {
            if (c.volume <= 0) return false;
            if (expirationRange === 'ALL') return true;
            
            const expDate = new Date(c.expirationDate);
            const diffDays = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            
            if (expirationRange === '1W') return diffDays <= 7;
            if (expirationRange === '2W') return diffDays <= 14;
            if (expirationRange === '1M') return diffDays <= 31;
            if (expirationRange === '3M') return diffDays <= 92;
            if (expirationRange === '6M') return diffDays <= 183;
            
            return true;
        });
    }, [rawMarketData, expirationRange]);

    const unusualContracts = useMemo(() => {
        return filteredContracts
            .map(c => ({...c, score: (c.volume * c.underlyingPrice) * (1 + (c.openInterest > 0 ? Math.min(c.volume / c.openInterest, 10) : 5))}))
            .sort((a, b) => b.score - a.score)
            .slice(0, 30);
    }, [filteredContracts]);

    const mostUnusualCall = useMemo(() => unusualContracts.find(c => c.type === 'CALL') || null, [unusualContracts]);
    const mostUnusualPut = useMemo(() => unusualContracts.find(c => c.type === 'PUT') || null, [unusualContracts]);

    const summaryData = useMemo(() => {
        if (!rawMarketData) return null;
        return { 
            ticker: 'BTC', 
            name: rawMarketData.name, 
            underlyingPrice: rawMarketData.underlyingPrice, 
            priceChange24h: rawMarketData.priceChange24h,
            totalUnusualVolume: unusualContracts.reduce((s, c) => s + c.volume, 0),
            totalNotionalValue: unusualContracts.reduce((s, c) => s + (c.volume * c.underlyingPrice), 0),
            putCallRatio: 0.8 
        };
    }, [rawMarketData, unusualContracts]);

    // Trigger overall analysis whenever the filtered set of unusual contracts changes
    useEffect(() => {
        if (unusualContracts.length > 0) {
            setIsAnalyzingOverall(true);
            getOverallAnalysis(unusualContracts, 'BTC').then(setOverallAnalysis).finally(() => setIsAnalyzingOverall(false));
        }
    }, [unusualContracts]);

    useEffect(() => {
        handleRefresh();
    }, [handleRefresh]);

    const handleSelectContract = useCallback(async (contract: OptionContract | null) => {
        setSelectedContract(contract);
        if (contract) {
            setIsAnalyzing(true);
            setGeminiAnalysis(null);
            try {
                const analysis = await getGeminiAnalysis('BTC', contract);
                setGeminiAnalysis(analysis);
            } catch (err) { setError('AI Analysis failed.'); } finally { setIsAnalyzing(false); }
        }
    }, []);

    const sentimentColorClass = useMemo(() => {
        const bias = overallAnalysis?.bias;
        if (bias === 'Bullish') return 'bg-green-500';
        if (bias === 'Bearish') return 'bg-red-500';
        return 'bg-amber-500';
    }, [overallAnalysis]);

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-white">
            <div className="bg-amber-600/10 text-center py-1.5 px-4 text-[9px] text-white border-b border-amber-900/20 uppercase tracking-[0.3em] font-bold">
                Institutional Bitcoin Options Intelligence
            </div>
            
            <main className="flex-grow container mx-auto px-4 pb-12 max-w-6xl">
                <header className="relative flex flex-col items-center justify-center py-8">
                    <div className="text-center group">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter select-none cursor-default bg-gradient-to-b from-slate-100 via-slate-300 to-slate-500 bg-clip-text text-transparent">
                            Optionable.Bitcoin
                        </h1>
                        <div className={`h-0.5 w-16 ${sentimentColorClass} opacity-60 mx-auto mt-3 rounded-full group-hover:w-32 transition-all duration-700 shadow-[0_0_15px_rgba(255,255,255,0.1)]`}></div>
                    </div>
                    
                    <button 
                        onClick={() => setIsInfoModalOpen(true)} 
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-amber-500 transition-all hover:bg-slate-900/50 rounded-full"
                        title="Operational Manual"
                    >
                        <QuestionMarkCircleIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="space-y-8">
                    <SearchBar 
                        onRefresh={handleRefresh} 
                        isLoading={isLoadingData} 
                        expirationRange={expirationRange} 
                        onExpirationRangeChange={setExpirationRange} 
                    />

                    {error && (
                        <div className="bg-red-950/40 border border-red-900/50 text-white px-6 py-4 rounded-2xl text-center font-bold tracking-tight animate-pulse">
                            {error}
                        </div>
                    )}

                    <ResultsDashboard 
                        summaryData={summaryData} 
                        unusualContracts={unusualContracts} 
                        selectedContract={selectedContract} 
                        geminiAnalysis={geminiAnalysis} 
                        onSelectContract={handleSelectContract} 
                        isLoadingData={isLoadingData} 
                        isAnalyzing={isAnalyzing} 
                        overallAnalysis={overallAnalysis} 
                        isAnalyzingOverall={isAnalyzingOverall} 
                        mostUnusualCall={mostUnusualCall} 
                        mostUnusualPut={mostUnusualPut} 
                        newsSentimentAnalysis={newsSentimentAnalysis} 
                        isAnalyzingNews={isAnalyzingNews} 
                        technicalAnalysis={technicalAnalysis} 
                        isAnalyzingTechnical={isAnalyzingTechnical}
                        gammaAnalysis={gammaAnalysis}
                        isAnalyzingGamma={isAnalyzingGamma}
                    />
                </div>
            </main>

            <footer className="text-center py-8 text-[9px] text-white border-t border-slate-900/50 bg-slate-950/30">
                <div className="flex flex-col items-center gap-3 mb-4">
                    <span className="font-black text-amber-600 uppercase tracking-[0.4em]">SECURE DATA UPLINK: VERIFIED</span>
                    <span className="font-bold text-white uppercase tracking-widest max-w-sm px-4">Risk Warning: Trading derivative instruments involves high speculative risk.</span>
                </div>
                <p className="opacity-60">&copy; 2024 Optionable.Bitcoin • <button onClick={() => setIsAdminModalOpen(true)} className="hover:text-amber-500 transition-colors uppercase font-black">Sys_Admin_V2</button></p>
            </footer>

            {isInfoModalOpen && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50 p-4" onClick={() => setIsInfoModalOpen(false)}>
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 w-full max-w-2xl shadow-2xl ring-1 ring-white/5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
                            <h2 className="text-3xl font-black text-white tracking-tighter">
                                 Terminal <span className="text-amber-500">Manual</span>
                            </h2>
                            <button onClick={() => setIsInfoModalOpen(false)} className="text-white hover:text-amber-500 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="text-white whitespace-pre-wrap text-base leading-relaxed max-h-[50vh] overflow-y-auto pr-6 custom-scrollbar font-medium">
                            {infoContent}
                        </div>
                        <button onClick={() => setIsInfoModalOpen(false)} className="mt-10 w-full py-5 bg-amber-600 text-white font-black rounded-2xl shadow-xl hover:bg-amber-500 transition-all uppercase tracking-[0.2em] text-xs">
                            Acknowledge & Continue
                        </button>
                    </div>
                </div>
            )}
            
            <AdminModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />
        </div>
    );
};

export default MainApp;
