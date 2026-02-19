
import { GoogleGenAI, Type } from "@google/genai";
import type { 
    OptionContract, 
    AnalysisResult, 
    OverallAnalysisResult, 
    NewsSentimentResult, 
    NewsSource, 
    TechnicalAnalysisResult, 
    GammaSqueezeResult 
} from '../types.ts';

// Helper to safely parse JSON from Gemini which might contain markdown blocks
const safeJsonParse = (text: string, fallback: any) => {
    try {
        // Remove markdown code blocks if present
        const cleaned = text.replace(/```json\n?|```/g, "").trim();
        // Look for the first { and last } to isolate JSON if there's surrounding text
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
            return JSON.parse(match[0]);
        }
        return JSON.parse(cleaned);
    } catch (e) {
        console.warn("AI JSON Parse failed:", e, "Raw text:", text);
        return fallback;
    }
};

const getGeminiAnalysis = async (ticker: string, contract: OptionContract): Promise<AnalysisResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const notionalValue = contract.volume * contract.underlyingPrice;
    
    const prompt = `
Analyze this unusual BTC options activity.
Price: $${contract.underlyingPrice.toFixed(2)}.
Contract: ${contract.type} @ $${contract.strikePrice} exp ${contract.expirationDate}.
Vol: ${contract.volume.toLocaleString()}, OI: ${contract.openInterest.toLocaleString()}.
Notional: $${notionalValue.toLocaleString()}.

1. Options Flow: Sweep/Block? Sentiment?
2. Gamma: Long/Short regime?
3. Skew/Pain: Cheap/Expensive vol?
4. Catalysts: Macro/Crypto events?
5. Summary: Actionable signal.
`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        optionsFlow: { type: Type.STRING },
        gammaExposure: { type: Type.STRING },
        skewAndMaxPain: { type: Type.STRING },
        potentialCatalysts: { type: Type.STRING },
        actionableSummary: { type: Type.STRING },
      },
      required: ["optionsFlow", "gammaExposure", "skewAndMaxPain", "potentialCatalysts", "actionableSummary"]
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json', responseSchema },
        });
        return safeJsonParse(response.text, {
            optionsFlow: "Flow analysis unavailable.",
            gammaExposure: "Gamma profiling limited.",
            skewAndMaxPain: "Skew metrics pending.",
            potentialCatalysts: "Catalyst scan incomplete.",
            actionableSummary: "Target decomposition in progress."
        });
    } catch (err) {
        return {
            optionsFlow: "Service temporarily interrupted.",
            gammaExposure: "Unable to calculate exposure.",
            skewAndMaxPain: "Volatility surface data restricted.",
            potentialCatalysts: "Macro feed disconnected.",
            actionableSummary: "AI Analysis Error: Please try again."
        };
    }
};

const getOverallAnalysis = async (contracts: OptionContract[], ticker: string): Promise<OverallAnalysisResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const details = contracts.slice(0, 10).map(c => `- ${c.volume} ${c.type} @ ${c.strikePrice} exp ${c.expirationDate}`).join('\n');
    const prompt = `Summarize BTC options flow based on these trades:\n${details}\nProvide bias (Bullish/Bearish/Neutral/Mixed) and a short summary. Return strictly JSON.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        bias: { type: Type.STRING, enum: ['Bullish', 'Bearish', 'Neutral', 'Mixed'] },
                    },
                    required: ["summary", "bias"]
                }
            },
        });
        return safeJsonParse(response.text, { bias: 'Neutral', summary: 'Consensus calculation in progress.' });
    } catch (err) {
        return { bias: 'Neutral', summary: 'Global flow analysis service unavailable.' };
    }
};

const getGammaSqueezeAnalysis = async (ticker: string, price: number): Promise<GammaSqueezeResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
Find the latest Bitcoin (BTC) options gamma distribution data.
Current BTC price: $${price.toLocaleString()}.
Identify: Call Wall, Put Wall, and Zero Gamma trigger.
Comment on Squeeze risk.

Return ONLY JSON:
{
  "squeezeProbability": "Low/Moderate/High/Extreme",
  "gammaRegime": "Positive/Negative",
  "commentary": "...",
  "keyLevels": [
    {"strike": number, "gammaValue": "...", "type": "Call Wall/Put Wall/Zero Gamma"}
  ]
}
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });

        return safeJsonParse(response.text, {
            squeezeProbability: 'Moderate',
            gammaRegime: 'Positive',
            commentary: 'Awaiting structural hedging data.',
            keyLevels: []
        });
    } catch (e) {
        return {
            squeezeProbability: 'Moderate',
            gammaRegime: 'Positive',
            commentary: 'Connection to gamma distribution hub timed out.',
            keyLevels: []
        };
    }
};

const getNewsSentimentWithSearch = async (ticker: string): Promise<NewsSentimentResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Search for top BTC news in the last 24h. Aggregate sentiment. Return JSON {bias, summary}.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources: NewsSource[] = groundingChunks 
            ? groundingChunks.map(chunk => chunk.web).filter(w => !!w).map(w => ({ title: w!.title, uri: w!.uri })) 
            : [];
        
        const analysis = safeJsonParse(response.text, { bias: 'Neutral', summary: 'Aggregating sentiment streams...' });
        
        // Ensure sources are unique by URI
        const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

        return { 
            bias: analysis.bias || 'Neutral', 
            summary: analysis.summary || 'Sentiment analysis in progress.', 
            sources: uniqueSources 
        };
    } catch (err) {
        return { bias: 'Neutral', summary: 'Global news feed unavailable.', sources: [] };
    }
};

const getTechnicalAnalysis = async (ticker: string, underlyingPrice: number): Promise<TechnicalAnalysisResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `BTC Technical Analysis at $${underlyingPrice}. Return JSON {bias, summary, supportLevels: [number], resistanceLevels: [number], movingAverageAnalysis, indicatorAnalysis}.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
        });
        
        return safeJsonParse(response.text, {
            bias: 'Neutral',
            summary: 'Structural technical scan in progress.',
            supportLevels: [],
            resistanceLevels: [],
            movingAverageAnalysis: 'Calculating averages...',
            indicatorAnalysis: 'Oscillators pending.'
        });
    } catch (err) {
        return {
            bias: 'Neutral',
            summary: 'Technical analysis engine disconnected.',
            supportLevels: [],
            resistanceLevels: [],
            movingAverageAnalysis: 'Feed unavailable.',
            indicatorAnalysis: 'Feed unavailable.'
        };
    }
};

export { getGeminiAnalysis, getOverallAnalysis, getNewsSentimentWithSearch, getTechnicalAnalysis, getGammaSqueezeAnalysis };
