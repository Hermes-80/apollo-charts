require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const { Pool } = require('pg');
const cron = require('node-cron');
const { SMA, EMA, RSI, MACD } = require('technicalindicators');
const bb = require('bollinger-bands');
const stochastic = require('stochastic');
const Redis = require('redis');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const redisClient = Redis.createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });
redisClient.connect().catch(console.error);

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tokens (
      id SERIAL PRIMARY KEY,
      coingecko_id TEXT UNIQUE,
      symbol TEXT,
      name TEXT,
      market_cap BIGINT
    );
    CREATE TABLE IF NOT EXISTS ohlcv (
      id SERIAL PRIMARY KEY,
      token_id INT REFERENCES tokens(id),
      ts TIMESTAMP,
      open NUMERIC, high NUMERIC, low NUMERIC, close NUMERIC, volume NUMERIC
    );
    CREATE TABLE IF NOT EXISTS indicators (
      token_id INT REFERENCES tokens(id),
      ts TIMESTAMP,
      ema20 NUMERIC, sma50 NUMERIC, rsi NUMERIC, macd JSONB, bb JSONB, stochastic JSONB,
      PRIMARY KEY (token_id, ts)
    );
  `);
}

async function fetchCoinsList() {
  const url = `${process.env.COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1`;
  const rsp = await fetch(url);
  const data = await rsp.json();
  for (const c of data) {
    await pool.query(
      `INSERT INTO tokens (coingecko_id, symbol, name, market_cap)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (coingecko_id) DO UPDATE SET market_cap = EXCLUDED.market_cap`,
      [c.id, c.symbol, c.name, c.market_cap || 0]
    );
  }
}

async function fetchOHLCAndStore(coingecko_id) {
  const url = `${process.env.COINGECKO_BASE}/coins/${coingecko_id}/market_chart?vs_currency=usd&days=30`;
  const rsp = await fetch(url);
  if (!rsp.ok) return;
  const d = await rsp.json();
  const prices = d.prices || [];
  const volumes = d.total_volumes || [];
  const token = await pool.query('SELECT id FROM tokens WHERE coingecko_id=$1', [coingecko_id]);
  if (!token.rowCount) return;
  const token_id = token.rows[0].id;
  for (let i = 0; i < prices.length; i++) {
    const ts = new Date(prices[i][0]);
    const close = prices[i][1];
    const volume = volumes[i] ? volumes[i][1] : null;
    await pool.query(
      `INSERT INTO ohlcv (token_id, ts, open, high, low, close, volume)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT DO NOTHING`,
      [token_id, ts, close, close, close, close, volume]
    );
  }
}

async function detectCandlestickPatterns(ohlcv) {
  const lastTwo = ohlcv.slice(-2);
  if (lastTwo.length < 2) return null;
  const [prev, curr] = lastTwo;
  const body = Math.abs(curr.close - curr.open);
  const range = curr.high - curr.low;
  const isDoji = body < range * 0.1;
  const isHammer = curr.close > curr.open && (curr.high - curr.close) > body * 2 && (curr.close - curr.low) < body * 0.5;
  return { doji: isDoji, hammer: isHammer };
}

async function computeIndicators(token_id) {
  const cacheKey = `indicators:${token_id}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const r = await pool.query('SELECT ts, open, high, low, close, volume FROM ohlcv WHERE token_id=$1 ORDER BY ts ASC', [token_id]);
  const rows = r.rows;
  if (rows.length < 20) return null;

  const closes = rows.map(r => Number(r.close));
  const highs = rows.map(r => Number(r.high));
  const lows = rows.map(r => Number(r.low));
  const volumes = rows.map(r => Number(r.volume || 0));

  const ema20 = EMA.calculate({ period: 20, values: closes }).slice(-1)[0] || null;
  const sma50 = SMA.calculate({ period: 50, values: closes }).slice(-1)[0] || null;
  const rsi = RSI.calculate({ period: 14, values: closes }).slice(-1)[0] || null;
  const macd = MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 }).slice(-1)[0] || null;
  const bbResult = bb(closes, 20, 2).slice(-1)[0] || null;
  const stochasticResult = stochastic.calculate({ high: highs, low: lows, close: closes, period: 14, signalPeriod: 3 }).slice(-1)[0] || null;
  const patterns = await detectCandlestickPatterns(rows);

  let obv = 0;
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) obv += volumes[i];
    else if (closes[i] < closes[i - 1]) obv -= volumes[i];
  }

  const indicators = { ema20, sma50, rsi, macd, bb: bbResult, stochastic: stochasticResult, obv, patterns };
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(indicators));
  await pool.query(
    `INSERT INTO indicators (token_id, ts, ema20, sma50, rsi, macd, bb, stochastic)
     VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7)`,
    [token_id, ema20, sma50, rsi, macd, bbResult, stochasticResult]
  );
  return indicators;
}

cron.schedule('*/30 * * * *', async () => {
  try {
    await fetchCoinsList();
    const tokens = await pool.query('SELECT coingecko_id, id FROM tokens');
    for (const t of tokens.rows) {
      await fetchOHLCAndStore(t.coingecko_id);
      await computeIndicators(t.id);
    }
  } catch (e) { console.error('cron', e); }
});

app.get('/api/screener', async (req, res) => {
  const { max_mcap = 200000000, min_rsi = 0, max_rsi = 100, pattern = '' } = req.query;
  const tokens = await pool.query(
    'SELECT t.coingecko_id, t.symbol, t.name, t.market_cap, i.ema20, i.sma50, i.rsi, i.macd, i.bb, i.stochastic, i.patterns ' +
    'FROM tokens t LEFT JOIN indicators i ON t.id = i.token_id ' +
    'WHERE t.market_cap <= $1 AND i.rsi BETWEEN $2 AND $3 ' +
    'ORDER BY t.market_cap ASC LIMIT 500',
    [max_mcap, min_rsi, max_rsi]
  );
  const out = tokens.rows
    .filter(t => !pattern || (t.patterns && t.patterns[pattern]))
    .map(t => ({ ...t, indicators: { ema20: t.ema20, sma50: t.sma50, rsi: t.rsi, macd: t.macd, bb: t.bb, stochastic: t.stochastic, patterns: t.patterns } }));
  res.json(out);
});

app.listen(process.env.PORT || 4000, async () => {
  await initDB();
  console.log('API running on port 4000');
});
