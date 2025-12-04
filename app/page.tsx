'use client';
import { useState, useEffect, useRef } from 'react';
import { createChart, IChartApi } from 'lightweight-charts';

const ALPACA_KEY = 'PK6YURO5TC3PN3VP726YBXOWEZ';
const ALPACA_SECRET = '2EWqWKG2rLpPdxv4Vyoepzi8vwSiMAMoJFuWGDDgvF22';
const NEWSAPI_KEY = '0f520a239e1148e7ab44d666bbf690f6';

export default function Home() {
  const [articles, setArticles] = useState<any[]>([]);
  const [ticker, setTicker] = useState('AAPL');
  const [price, setPrice] = useState(0);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Live Price + Ticker Tape
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
        setPrice(t.p);
        document.title = `${t.s} $${t.p.toFixed(2)} • FinFeed`;
      }
    };
  }, []);

  // Pro News
  useEffect(() => {
    fetch(`https://newsapi.org/v2/everything?q=stocks+OR+earnings&domains=bloomberg.com,reuters.com,cnbc.com,wsj.com,benzinga.com&apiKey=${NEWSAPI_KEY}`)
      .then(r => r.json())
      .then(d => setArticles(d.articles));
  }, []);

  // TradingView-style Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: { background: { color: '#0f172a' }, textColor: '#e2e8f0' },
      grid: { vertLines: { color: '#334155' }, horzLines: { color: '#334155' } },
    });
    const candleSeries = chart.addCandlestickSeries();
    // Fake data for demo — replace with real OHLC from Alpaca later
    candleSeries.setData([
      { time: '2025-04-01', open: 220, high: 230, low: 215, close: 228 },
      { time: '2025-04-02', open: 228, high: 240, low: 225, close: 238 },
      // ... more
    ]);
    chartRef.current = chart;
    return () => chart.remove();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Ticker Tape */}
      <div className="bg-emerald-900 py-3 overflow-hidden text-lg font-bold">
        <div className="animate-marquee whitespace-nowrap">
          AAPL $227.48 +1.8% • TSLA $342.10 +3.2% • BTC $96,420 -0.7% • NVDA $138.92 +2.5%
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-6xl font-bold text-center mb-2 text-emerald-400">FinFeed Pro</h1>
        <p className="text-center text-slate-400 mb-8">Real-time markets • Pro news • Charts</p>

        {/* Live Chart */}
        <div ref={chartContainerRef} className="mb-12 bg-slate-900 rounded-xl p-4" />

        {/* News Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 12).map((a, i) => (
            <a key={i} href={a.url} target="_blank" className="block p-6 bg-slate-800 rounded-xl hover:bg-slate-700 border border-slate-700 transition">
              <h3 className="text-xl font-bold mb-2 text-emerald-400">{a.title}</h3>
              <p className="text-slate-300 mb-3 line-clamp-3">{a.description}</p>
              <div className="text-sm text-slate-500">
                {a.source.name} • {new Date(a.publishedAt).toLocaleDateString()}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
