
export type DataProvider = 'coinapi';
export type OptionType = 'CALL' | 'PUT';

export interface ApiKeys {
  coinapi: string | null;
}

export interface OptionContract {
  id: string;
  ticker: string;
  underlyingPrice: number;
  strikePrice: number;
  expirationDate: string;
  type: OptionType;
  volume: number;
  averageVolume: number; 
  openInterest: number;
  impliedVolatility: number;
}

export interface SummaryData {
  ticker: string;
  name: string;
  underlyingPrice: number;
  priceChange24h: number;
  totalUnusualVolume: number;
  totalNotionalValue: number;
  putCallRatio: number;
}

export interface AnalysisResult {
  optionsFlow: string;
  gammaExposure: string;
  skewAndMaxPain: string;
  potentialCatalysts: string;
  actionableSummary: string;
}

export interface OverallAnalysisResult {
  bias: 'Bullish' | 'Bearish' | 'Neutral' | 'Mixed';
  summary: string;
}

export interface NewsSource {
  title: string;
  uri: string;
}

export interface NewsSentimentResult {
  bias: 'Bullish' | 'Bearish' | 'Neutral';
  summary: string;
  sources: NewsSource[];
}

export interface TechnicalAnalysisResult {
  bias: 'Bullish' | 'Bearish' | 'Neutral';
  summary: string;
  supportLevels: number[];
  resistanceLevels: number[];
  movingAverageAnalysis: string;
  indicatorAnalysis: string;
}

// Added AnalystRatingResult type to fix component error in components/AnalystRatings.tsx
export interface AnalystRatingResult {
  bias: 'Bullish' | 'Bearish' | 'Neutral';
  summary: string;
  analystViews: string[];
}

// Added PredictionResult types to fix component error in components/PricePredictions.tsx
export interface Prediction {
  probability: string;
  targetPrice: string;
  deadline: string;
  source: string;
}

export interface PredictionResult {
  summary: string;
  predictions: Prediction[];
}

export interface GammaLevel {
  strike: number;
  gammaValue: string;
  type: 'Call Wall' | 'Put Wall' | 'Zero Gamma' | 'Neutral';
}

export interface GammaSqueezeResult {
  squeezeProbability: 'Low' | 'Moderate' | 'High' | 'Extreme';
  gammaRegime: 'Positive' | 'Negative';
  commentary: string;
  keyLevels: GammaLevel[];
}

export interface GlobalMarketData {
  totalMarketCap: number;
  change24hPercent: number;
}

export const defaultInfoContent = `Welcome to Optionable.Bitcoin!

**How it works:**
1.  Click "Refresh Bitcoin Intelligence" to sync the latest market activity.
2.  The app scans the Bitcoin options market for trades with unusually high volume compared to their open interest.
3.  The dashboard provides real-time Gamma Wall analysis, identifying where market makers may be forced to hedge.
4.  Click on any trade in the table to get a detailed AI breakdown.
5.  Banner advertisement inquires can email us at trendlogic@yahoo.com
6.  No information on this app is sold or saved.
`;
