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
