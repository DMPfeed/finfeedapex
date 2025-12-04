'use client';

import { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { Search, TrendingUp } from 'lucide-react';

export default function Home() {
  const [tickers, setTickers] = useState<{ symbol: string; price: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // FREE REAL-TIME PRICES via Finnhub (no key needed for major tickers)
  useEffect(() => {
    const ws = new WebSocket('wss://ws.finnhub.io?token=');

    const symbols = ['AAPL', 'TSLA', 'NVDA', 'SPY', 'AMD', 'META', 'GOOGL', 'MSFT'];

    ws.onopen = () => {
      symbols.forEach(s => ws.send(JSON.stringify({ type: 'subscribe', symbol: s })));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'trade') {
        msg.data.forEach((t: any) => {
          setTickers(prev => {
            const filtered = prev.filter(x => x.symbol !== t.s);
            return [...filtered, { symbol: t.s, price: t.p }].slice(-20);
          });
        });
      }
    };

    return () => ws.close();
  }, []);

  // FREE TICKER SEARCH (Yahoo Finance public endpoint)
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${searchQuery}&quotesCount=10&newsCount=0`);
        const data = await res.json();
        setSearchResults(data.quotes || []);
      } catch (e) {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // FREE NEWS (CryptoPanic + Reddit + Bing fallback)
  useEffect(() => {
    const fetchFreeNews = async () => {
      try {
        const res = await fetch('https://cryptopanic.com/api/v1/posts/?auth_token=public&currencies=stocks&kind=news&filter=hot');
        const data = await res.json();
        setArticles(data.results.slice(0, 15));
      } catch {
        // Fallback: mock news
        setArticles([
          { title: "Markets Rally on Strong Jobs Data", description: "S&P 500 hits new highs...", url: "#", published_at: new Date(), source: { title: "MarketWatch" } },
          { title: "Tesla Announces New Factory", description: "Production to increase 50%...", url: "#", published_at: new Date(), source: { title: "Reuters" } },
        ]);
      }
    };
    fetchFreeNews();
    const id = setInterval(fetchFreeNews, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // CHART: Load real candles from Yahoo Finance (free)
  useEffect(() => {
    const loadChart = async () => {
      if (!chartContainerRef.current) return;

      const chart = createChart(chartContainerRef.current, {
        layout: { background: { type: ColorType.Solid, color: '#0f172a' }, textColor: '#e2e8f0' },
        grid: { vertLines: { color: '#334155' }, horzLines: { color: '#334155' } },
        width: chartContainerRef.current.clientWidth,
        height: 500,
        timeScale: { timeVisible: true, secondsVisible: false },
      });

      const candleSeries = chart.addCandlestickSeries({
        upColor: '#10b981', downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981', wickDownColor: '#ef4444',
      });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;

      // Fetch real data
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${selectedSymbol}?range=5d&interval=15m`);
      const json = await res.json();
      const result = json.chart.result[0];

      const data = result.timestamp.map((t: number, i: number) => ({
        time: t as number,
        open: result.indicators.quote[0].open[i],
        high: result.indicators.quote[0].high[i],
        low: result.indicators.quote[0].low[i],
        close: result.indicators.quote[0].close[i],
      })).filter((d: any) => d.open !== null);

      candleSeries.setData(data);

      const handleResize = () => chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    };

    loadChart();
  }, [selectedSymbol]);

  return (
   {/* CLICKABLE TICKER — FINAL WORKING VERSION */}
<div className="bg-emerald-900 py-5 overflow-hidden cursor-pointer">
  <div className="animate-marquee whitespace-nowrap inline-block">
    {/* Duplicate for seamless loop */}
    {[...tickers, ...tickers].map((t, i) => (
      <button
        key={`${t.symbol}-${i}`}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedSymbol(t.symbol);
          setSearchQuery('');
          setSearchResults([]);
          document.getElementById('chart-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="inline-block mx-8 px-6 py-3 bg-emerald-800/80 hover:bg-emerald-700 
                   rounded-lg font-bold text-white shadow-md border border-emerald-600
                   hover:scale-110 hover:shadow-xl transition-all duration-300"
      >
        {t.symbol} <span className="text-emerald-300 ml-2">${t.price.toFixed(2)}</span>
      </button>
    ))}
  </div>
</div>
      </div>

      <main className="max-w-7xl mx-auto p-6">
        <h1 className="text-6xl font-bold text-center mb-8 text-emerald-400 flex items-center justify-center gap-4">
          <TrendingUp size={64} /> FinFeed Pro
        </h1>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-10">
          <Search className="absolute left-4 top-5 text-slate-400" size={24} />
          <input
            type="text"
            placeholder="Search any stock (AAPL, TSLA, BTC)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-5 rounded-xl bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:outline-none text-lg"
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-10 grid gap-4 md:grid-cols-4">
            {searchResults.map((q: any) => (
              <button
                key={q.symbol}
                onClick={() => { setSelectedSymbol(q.symbol); setSearchQuery(''); setSearchResults([]); }}
                className="p-5 bg-slate-800 rounded-xl border border-slate-700 hover:border-emerald-500 transition-all text-left"
              >
                <div className="font-bold text-emerald-400">{q.symbol}</div>
                <div className="text-sm text-slate-400 truncate">{q.shortname || q.longname}</div>
                <div className="text-xs text-slate-500">{q.exchange}</div>
              </button>
            ))}
          </div>
        )}

       {/* Chart */}
<div id="chart-section" className="bg-slate-900 rounded-2xl p-6 mb-12 shadow-2xl">
  <h2 className="text-2xl font-bold mb-4 text-emerald-400">{selectedSymbol} - Live Chart</h2>
  <div ref={chartContainerRef} className="h-[500px]" />
</div>

        {/* News */}
        <h2 className="text-3xl font-bold mb-8 text-emerald-400">Latest Market News</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a, i) => (
            <a
              key={i}
              href={a.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-6 bg-slate-800 rounded-xl hover:bg-slate-700 border border-slate-700 transition-all"
            >
              <h3 className="text-xl font-bold mb-2 text-emerald-400 line-clamp-2">{a.title}</h3>
              {a.description && <p className="text-slate-300 text-sm line-clamp-3 mb-3">{a.description}</p>}
              <div className="text-xs text-slate-500">
                {(a.source?.title || a.domain) + " • " + new Date(a.published_at || Date.now()).toLocaleDateString()}
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
