'use client';
import { useState, useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

const ALPACA_KEY = 'PK6YURO5TC3PN3VP726YBXOWEZ';
const ALPACA_SECRET = '2EWqWKG2rLpPdxv4Vyoepzi8vwSiMAMoJFuWGDDgvF22';
const NEWSAPI_KEY = '0f520a239e1148e7ab44d666bbf690f6';

export default function Home() {
  const [articles, setArticles] = useState<any[]>([]);
  const [tickers, setTickers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');  // NEW: Search state
  const [searchResults, setSearchResults] = useState<any[]>([]);  // NEW: Ticker search results
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // YOUR LIVE ALPACA PRICES (kept)
  useEffect(() => {
    const ws = new WebSocket('wss://stream.data.alpaca.markets/v2/sip');
    ws.onopen = () => {
      ws.send(JSON.stringify({ action: 'auth', key: ALPACA_KEY, secret: ALPACA_SECRET }));
      ws.send(JSON.stringify({ action: 'subscribe', trades: ['AAPL','TSLA','NVDA','SPY','BTCUSD'] }));
    };
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.stream?.includes('trade')) {
        const t = data.data[0];
        setTickers(prev => {
          const filtered = prev.filter(x => x.s !== t.s);
          return [...filtered, {symbol: t.s, price: t.p.toFixed(2)}];
        });
      }
    };
  }, []);

  // YOUR LIVE NEWS (kept)
  useEffect(() => {
    fetch(`https://newsapi.org/v2/everything?q=stocks+OR+earnings&domains=bloomberg.com,reuters.com,cnbc.com,wsj.com,benzinga.com&apiKey=${NEWSAPI_KEY}`)
      .then(r => r.json())
      .then(d => setArticles(d.articles));
  }, []);

  // NEW: Live ticker search (Alpaca API – free)
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    fetch(`https://api.alpaca.markets/v1beta1/assets/search?q=${encodeURIComponent(searchQuery)}`, {
      headers: { 'APCA-API-KEY-ID': ALPACA_KEY, 'APCA-API-SECRET-KEY': ALPACA_SECRET }
    })
      .then(r => r.json())
      .then(d => setSearchResults(d.assets.slice(0, 10)));  // Top 10 matches
  }, [searchQuery]);

  // NEW: Filter news for search matches
  const filteredArticles = articles.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Chart (kept)
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#0f172a' }, textColor: '#e2e8f0' },
      grid: { vertLines: { color: '#334155' }, horzLines: { color: '#334155' } },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981', downColor: '#ef4444',
      borderVisible: false, wickUpColor: '#10b981', wickDownColor: '#ef4444',
    });
    candleSeries.setData([
      { time: '2025-04-01', open: 220, high: 230, low: 215, close: 228 },
      { time: '2025-04-02', open: 228, high: 240, low: 225, close: 238 },
      { time: '2025-04-03', open: 238, high: 245, low: 235, close: 242 },
      { time: '2025-04-04', open: 242, high: 255, low: 240, close: 252 },
      { time: '2025-04-05', open: 252, high: 260, low: 248, close: 258 },
    ]);
    const handleResize = () => chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Live Ticker */}
      <div className="bg-emerald-900 py-3 overflow-hidden text-lg font-bold">
        <div className="animate-marquee whitespace-nowrap">
          {tickers.map((t, i) => (
            <span key={i} className="mx-8">{t.symbol} ${t.price}</span>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6">
        <h1 className="text-6xl font-bold text-center mb-8 text-emerald-400">FinFeed Pro</h1>

        {/* NEW: Search Bar */}
        <input
          type="text"
          placeholder="Search tickers (AAPL) or news..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-2xl mx-auto block px-6 py-4 rounded-xl bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:outline-none text-lg mb-8"
        />

        {/* NEW: Ticker Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4 text-emerald-400">Tickers</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {searchResults.map((asset, i) => (
                <div key={i} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <h3 className="font-bold text-emerald-400">{asset.symbol}</h3>
                  <p className="text-slate-400">{asset.name}</p>
                  <p className="text-sm text-slate-500">{asset.exchange || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chart */}
        <div ref={chartContainerRef} className="bg-slate-900 rounded-xl p-4 mb-12" />

        {/* News Grid (filtered) */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.slice(0, 12).map((a, i) => (
            <a key={i} href={a.url} target="_blank" className="block p-6 bg-slate-800 rounded-xl hover:bg-slate-700 border border-slate-700">
              <h3 className="text-xl font-bold mb-2 text-emerald-400">{a.title}</h3>
              <p className="text-slate-300 mb-3 line-clamp-3">{a.description}</p>
              <div className="text-sm text-slate-500">
                {a.source.name} • {new Date(a.publishedAt).toLocaleDateString()}
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
