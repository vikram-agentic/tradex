import { supabase } from '@/integrations/supabase/client';

export interface MarketQuote {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  volume: number;
  timestamp: string;
  change?: number;
  changePercent?: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
}

export interface MarketDataResponse {
  [symbol: string]: MarketQuote;
}

/**
 * Fetch real-time market data from Alpaca
 */
export async function fetchRealMarketData(
  symbols: string[]
): Promise<MarketDataResponse> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return generateMockData(symbols);
    }

    // Get user's Alpaca keys from database
    const { data: apiKeys } = await supabase
      .from('api_keys')
      .select('service, encrypted_key')
      .eq('user_id', user.id)
      .in('service', ['alpaca_paper_key', 'alpaca_paper_secret']);

    if (!apiKeys || apiKeys.length < 2) {
      console.log('Alpaca API keys not configured, using mock data');
      return generateMockData(symbols);
    }

    const keyObj = apiKeys.find(k => k.service === 'alpaca_paper_key')?.encrypted_key;
    const secretObj = apiKeys.find(k => k.service === 'alpaca_paper_secret')?.encrypted_key;

    if (!keyObj || !secretObj) {
      console.log('Alpaca credentials incomplete, using mock data');
      return generateMockData(symbols);
    }

    // Fetch quotes from Alpaca
    const baseUrl = 'https://data.alpaca.markets';
    const marketData: MarketDataResponse = {};

    // Fetch quotes in parallel
    const quotePromises = symbols.map(async (symbol) => {
      try {
        const response = await fetch(
          `${baseUrl}/v2/stocks/${symbol}/quotes/latest`,
          {
            headers: {
              'APCA-API-KEY-ID': keyObj,
              'APCA-API-SECRET-KEY': secretObj,
            },
          }
        );

        if (!response.ok) {
          console.error(`Failed to fetch ${symbol}:`, response.statusText);
          return null;
        }

        const data = await response.json();
        const quote = data.quote;

        // Also fetch latest trade for additional info
        const tradeResponse = await fetch(
          `${baseUrl}/v2/stocks/${symbol}/trades/latest`,
          {
            headers: {
              'APCA-API-KEY-ID': keyObj,
              'APCA-API-SECRET-KEY': secretObj,
            },
          }
        );

        let tradeData = null;
        if (tradeResponse.ok) {
          tradeData = await tradeResponse.json();
        }

        // Fetch snapshot for more complete data
        const snapshotResponse = await fetch(
          `${baseUrl}/v2/stocks/${symbol}/snapshot`,
          {
            headers: {
              'APCA-API-KEY-ID': keyObj,
              'APCA-API-SECRET-KEY': secretObj,
            },
          }
        );

        let snapshot = null;
        if (snapshotResponse.ok) {
          snapshot = await snapshotResponse.json();
        }

        return {
          symbol,
          data: {
            quote,
            trade: tradeData?.trade,
            snapshot
          }
        };
      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
        return null;
      }
    });

    const results = await Promise.all(quotePromises);

    // Process results
    results.forEach((result) => {
      if (result && result.data.quote) {
        const { quote, trade, snapshot } = result.data;

        const price = trade?.p || quote.ap || quote.bp || 0;
        const prevClose = snapshot?.prevDailyBar?.c || price;
        const change = price - prevClose;
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

        marketData[result.symbol] = {
          symbol: result.symbol,
          price,
          bid: quote.bp || 0,
          ask: quote.ap || 0,
          volume: trade?.s || quote.as || 0,
          timestamp: trade?.t || quote.t || new Date().toISOString(),
          change,
          changePercent,
          high: snapshot?.dailyBar?.h || snapshot?.prevDailyBar?.h,
          low: snapshot?.dailyBar?.l || snapshot?.prevDailyBar?.l,
          open: snapshot?.dailyBar?.o || snapshot?.prevDailyBar?.o,
          close: snapshot?.dailyBar?.c || snapshot?.prevDailyBar?.c
        };
      }
    });

    // Fill in any missing symbols with mock data
    symbols.forEach(symbol => {
      if (!marketData[symbol]) {
        marketData[symbol] = generateMockQuote(symbol);
      }
    });

    return marketData;
  } catch (error) {
    console.error('Error fetching real market data:', error);
    return generateMockData(symbols);
  }
}

/**
 * Generate mock market data for testing
 */
export function generateMockData(symbols: string[]): MarketDataResponse {
  const mockData: MarketDataResponse = {};

  symbols.forEach(symbol => {
    mockData[symbol] = generateMockQuote(symbol);
  });

  return mockData;
}

/**
 * Generate a mock quote for a single symbol
 */
function generateMockQuote(symbol: string): MarketQuote {
  // Base prices for common symbols
  const basePrices: Record<string, number> = {
    'AAPL': 178,
    'MSFT': 380,
    'GOOGL': 140,
    'AMZN': 155,
    'TSLA': 245,
    'NVDA': 495,
    'META': 320,
    'NFLX': 445,
    'AMD': 115,
    'INTC': 45,
    'BTCUSD': 43500,
    'ETHUSD': 2300
  };

  const basePrice = basePrices[symbol] || (Math.random() * 200 + 50);
  const volatility = 0.02; // 2% volatility
  const change = (Math.random() - 0.5) * basePrice * volatility;
  const price = basePrice + change;
  const changePercent = (change / basePrice) * 100;

  const spread = price * 0.001; // 0.1% spread
  const bid = price - spread / 2;
  const ask = price + spread / 2;

  return {
    symbol,
    price: Number(price.toFixed(2)),
    bid: Number(bid.toFixed(2)),
    ask: Number(ask.toFixed(2)),
    volume: Math.floor(Math.random() * 10000000),
    timestamp: new Date().toISOString(),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    high: Number((price * 1.02).toFixed(2)),
    low: Number((price * 0.98).toFixed(2)),
    open: basePrice,
    close: price
  };
}

/**
 * Get recommended symbols based on market type
 */
export function getSymbolsForMarketType(marketType: string): string[] {
  switch (marketType) {
    case 'stocks':
      return ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META'];
    case 'crypto':
      return ['BTCUSD', 'ETHUSD'];
    case 'both':
      return ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'BTCUSD', 'ETHUSD'];
    default:
      return ['AAPL', 'MSFT', 'GOOGL'];
  }
}
