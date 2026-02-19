
import type { OptionContract, DataProvider, ApiKeys, GlobalMarketData } from '../types';

export type DataSource = 'Deribit' | 'Simulated';
export interface FetchResult {
    contracts: OptionContract[];
    underlyingPrice: number;
    priceChange24h: number;
    name: string;
    source: DataSource;
}

const getIndexName = (ticker: string): string => {
    const t = ticker.toLowerCase();
    const usdcSettled = ['sol', 'xrp', 'matic', 'ltc', 'bch', 'algo', 'avax', 'link', 'uni', 'dot', 'doge', 'ada', 'near', 'trx'];
    return usdcSettled.includes(t) ? `${t}_usdc` : `${t}_usd`;
};

const fetchDeribitOptionsData = async (ticker: string): Promise<FetchResult> => {
    const currency = ticker.toUpperCase();
    const usdcSettled = ['SOL', 'XRP', 'MATIC', 'LTC', 'BCH', 'ALGO', 'AVAX', 'LINK', 'UNI', 'DOT', 'DOGE', 'ADA', 'NEAR', 'TRX'];
    let apiCurrency = usdcSettled.includes(currency) ? 'USDC' : currency;

    try {
        const indexName = getIndexName(ticker);
        const optionsPromise = fetch(`https://www.deribit.com/api/v2/public/get_book_summary_by_currency?currency=${apiCurrency}&kind=option`);
        const futuresPromise = fetch(`https://www.deribit.com/api/v2/public/get_book_summary_by_currency?currency=${apiCurrency}&kind=future`);
        const indexPricePromise = fetch(`https://www.deribit.com/api/v2/public/get_index_price?index_name=${indexName}`);

        let [optionsResponse, futuresResponse, indexResponse] = await Promise.all([
            optionsPromise, 
            futuresPromise,
            indexPricePromise
        ]);
        
        if ((!optionsResponse.ok || !futuresResponse.ok) && apiCurrency !== 'USDC') {
             apiCurrency = 'USDC';
             [optionsResponse, futuresResponse] = await Promise.all([
                 fetch(`https://www.deribit.com/api/v2/public/get_book_summary_by_currency?currency=USDC&kind=option`),
                 fetch(`https://www.deribit.com/api/v2/public/get_book_summary_by_currency?currency=USDC&kind=future`)
             ]);
        }
        
        if (!optionsResponse.ok) throw new Error(`Deribit API error`);
        
        const optionsData = await optionsResponse.json();
        const futuresData = futuresResponse.ok ? await futuresResponse.json() : { result: [] };
        
        let realTimeIndexPrice = 0;
        if (indexResponse.ok) {
            const indexData = await indexResponse.json();
            if (indexData.result?.index_price) realTimeIndexPrice = indexData.result.index_price;
        }

        return processDeribitResponse(optionsData, futuresData, realTimeIndexPrice, ticker);
    } catch (err) {
        throw new Error(`Failed to connect to live data for ${ticker}.`);
    }
};

const processDeribitResponse = (optionsData: any, futuresData: any, realTimeIndexPrice: number, ticker: string): FetchResult => {
    if (!optionsData.result) throw new Error('No data');
    let rawContracts = optionsData.result;
    const tickerUpper = ticker.toUpperCase();
    let priceChange24h = 0;

    if (futuresData.result && Array.isArray(futuresData.result)) {
        const perp = futuresData.result.find((item: any) => 
            item.instrument_name.endsWith('PERPETUAL') && 
            (item.instrument_name.startsWith(tickerUpper) || item.instrument_name.includes(tickerUpper))
        );
        if (perp) priceChange24h = perp.price_change || 0;
    }

    rawContracts = rawContracts.filter((item: any) => {
        const name = item.instrument_name;
        return name.startsWith(`${tickerUpper}-`) || name.startsWith(`${tickerUpper}_USDC-`);
    });
    
    let underlyingPrice = realTimeIndexPrice || (rawContracts.find((c: any) => c.index_price)?.index_price) || 0;
    if (!underlyingPrice) throw new Error(`No price for ${ticker}.`);

    const contractSize = tickerUpper === 'XRP' ? 10 : 1;
    const contracts: OptionContract[] = rawContracts.map((item: any) => {
        const parts = item.instrument_name.split('-');
        if (parts.length < 4) return null;
        const typeShort = parts[parts.length - 1];
        const strikeStr = parts[parts.length - 2];
        const dateStr = parts[parts.length - 3];
        if (typeShort !== 'C' && typeShort !== 'P') return null;

        return {
            id: item.instrument_name,
            ticker: tickerUpper,
            underlyingPrice,
            strikePrice: parseFloat(strikeStr),
            expirationDate: new Date(dateStr).toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit' }),
            type: typeShort === 'C' ? 'CALL' : 'PUT',
            volume: (item.volume || 0) * contractSize,
            averageVolume: 0,
            openInterest: (item.open_interest || 0) * contractSize,
            impliedVolatility: item.mark_iv ? item.mark_iv / 100 : 0,
        };
    }).filter((c): c is OptionContract => c !== null);

    return { contracts, underlyingPrice, priceChange24h, name: `${tickerUpper} Options`, source: 'Deribit' };
};

export const fetchOptionsData = async (ticker: string): Promise<FetchResult> => {
    let t = ticker.toUpperCase().trim();
    if (t === 'SOLANA') t = 'SOL';
    if (t === 'RIPPLE') t = 'XRP';
    return fetchDeribitOptionsData(t);
};

export const fetchGlobalMarketData = async (): Promise<GlobalMarketData> => {
    const cacheBuster = `nocache=${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const fetchConfig: RequestInit = {
        headers: { 
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
        },
        cache: 'no-store'
    };

    // Sequential fallback for maximum reliability
    const sources = [
        {
            name: 'CoinLore',
            url: `https://api.coinlore.net/api/global/?${cacheBuster}`,
            parse: (json: any) => ({
                totalMarketCap: parseFloat(json[0].total_mcap),
                change24hPercent: parseFloat(json[0].mcap_change || "0")
            })
        },
        {
            name: 'CoinCap',
            url: `https://api.coincap.io/v2/global?${cacheBuster}`,
            parse: (json: any) => ({
                totalMarketCap: parseFloat(json.data.totalMarketCapUsd),
                change24hPercent: 0
            })
        },
        {
            name: 'CoinPaprika',
            url: `https://api.coinpaprika.com/v1/global?${cacheBuster}`,
            parse: (json: any) => ({
                totalMarketCap: json.market_cap_usd,
                change24hPercent: json.market_cap_change_24h || 0
            })
        }
    ];

    for (const source of sources) {
        try {
            const response = await fetch(source.url, fetchConfig);
            if (response.ok) {
                const json = await response.json();
                const data = source.parse(json);
                if (data.totalMarketCap > 0) return data;
            }
        } catch (e) {
            console.warn(`${source.name} Global fetch failed`, e);
        }
    }

    return { totalMarketCap: 0, change24hPercent: 0 };
}

export const validateApiKey = async (provider: DataProvider, key: string): Promise<boolean> => {
    if (!key) return false;
    return /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(key);
};
