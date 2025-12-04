'use client';

import { useState, useEffect } from 'react';

interface Article {
  title: string;
  description: string;
  url: string;
  source: { name: string };
  publishedAt: string;
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  fetch('/api/cache')  // Your cached RSS endpoint
    .then(r => r.json())
    .then(data => setArticles(data.posts || []));
}, []);

  const filtered = articles.filter((a: Article) =>
    a.title?.toLowerCase().includes(search.toLowerCase())
  );

  const tickers = [
    'AAPL +1.8%', 'BTC -0.7%', 'TSLA +3.2%', 'NVDA +2.5%', 'SPY +0.9%'
  ];

  return (
    <>
      {/* Ticker Bar */}
      <div className="bg-emerald-900 py-3 overflow-hidden border-b border-emerald-800">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...tickers, ...tickers].map((t, i) => (
            <span key={i} className="mx-10 text-lg font-medium">
              {t}
            </span>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-5xl md:text-6xl font-bold text-center mb-4 text-emerald-400">
          FinFeed
        </h1>
        <p className="text-center text-slate-400 mb-10 text-lg">
          Real-time financial news • No ads • No tracking
        </p>

        <input
          type="text"
          placeholder="Search headlines..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-2xl mx-auto block px-6 py-4 rounded-xl bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:outline-none text-lg mb-12"
        />

        {loading ? (
          <p className="text-center text-slate-400">Loading latest news...</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a, i) => (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-emerald-500 transition-all hover:shadow-xl"
              >
                <h3 className="text-xl font-bold mb-3 line-clamp-2">{a.title}</h3>
                <p className="text-slate-300 mb-4 line-clamp-3">{a.description}</p>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>{a.source.name}</span>
                  <span>{new Date(a.publishedAt).toLocaleTimeString()}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee { animation: marquee 30s linear infinite; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </>
  );
}
