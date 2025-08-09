import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './index.css';

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [maxMcap, setMaxMcap] = useState(200000000);
  const [minRsi, setMinRsi] = useState(0);
  const [maxRsi, setMaxRsi] = useState(100);
  const [pattern, setPattern] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.VITE_API_BASE || '/api'}/screener`, {
        params: { max_mcap: maxMcap, min_rsi: minRsi, max_rsi: maxRsi, pattern }
      });
      setItems(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Crypto Screener — Better than altFINS</h1>
      <div className="filters bg-gray-100 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium">Max Market Cap</label>
            <input
              type="number"
              value={maxMcap}
              onChange={e => setMaxMcap(Number(e.target.value))}
              className="mt-1 block w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Min RSI</label>
            <input
              type="number"
              value={minRsi}
              onChange={e => setMinRsi(Number(e.target.value))}
              className="mt-1 block w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Max RSI</label>
            <input
              type="number"
              value={maxRsi}
              onChange={e => setMaxRsi(Number(e.target.value))}
              className="mt-1 block w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Candlestick Pattern</label>
            <select
              value={pattern}
              onChange={e => setPattern(e.target.value)}
              className="mt-1 block w-full p-2 border rounded"
            >
              <option value="">None</option>
              <option value="doji">Doji</option>
              <option value="hammer">Hammer</option>
            </select>
          </div>
        </div>
        <button
          onClick={load}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Run Screener
        </button>
      </div>
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Symbol</th>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Market Cap</th>
                <th className="px-4 py-2 border">EMA20</th>
                <th className="px-4 py-2 border">RSI</th>
                <th className="px-4 py-2 border">Patterns</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.coingecko_id}>
                  <td className="px-4 py-2 border">{i.symbol}</td>
                  <td className="px-4 py-2 border">{i.name}</td>
                  <td className="px-4 py-2 border">{Number(i.market_cap).toLocaleString()}</td>
                  <td className="px-4 py-2 border">{i.indicators.ema20?.toFixed(2)}</td>
                  <td className="px-4 py-2 border">{i.indicators.rsi?.toFixed(2)}</td>
                  <td className="px-4 py-2 border">
                    {i.indicators.patterns?.doji && 'Doji '}
                    {i.indicators.patterns?.hammer && 'Hammer'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <footer className="mt-6 text-center text-gray-600">
        Powered by Supabase, Railway, and Vercel
      </footer>
    </div>
  );
}
