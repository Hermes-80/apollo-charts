# Crypto Screener MVP

A crypto screener that outperforms altFINS with advanced technical indicators, a modern UI, and one-click deployment. Built with Supabase (Postgres), Railway (Node.js API), and Vercel (React + Vite + Tailwind).

## Prerequisites

- GitHub account ([github.com](https://github.com))
- Supabase account ([supabase.com](https://supabase.com))
- Railway account ([railway.app](https://railway.app))
- Vercel account ([vercel.com](https://vercel.com))
- Basic familiarity with copying/pasting (no coding experience needed)

## Deployment Steps

### 1. Create a GitHub Repository

1. Go to [github.com](https://github.com) and sign in.
2. Click **New Repository** (top-right `+` icon).
3. Name it `crypto-screener`, set to **Public**, check **Add a README file**, and click **Create repository**.
4. Copy all files below into your repository:
   - Create folders (`api`, `web`, `.github/workflows`) by clicking **Add file** → **Create new file**.
   - Copy-paste each file’s content, name it exactly as shown, and commit with a message like “Add file”.

### 2. Set Up Supabase (Database)

1. Sign up at [supabase.com](https://supabase.com) and click **New Project**.
2. Name it `crypto-screener`, choose a strong **Database Password** (save it!), select the **Free Plan**, and pick a region close to you. Click **Create new project** (wait 2-3 minutes).
3. Go to **Settings** → **Database**. Copy the **Connection String** (URI format, e.g., `postgres://user:pass@host:5432/dbname`) as `DATABASE_URL`.
4. Go to **SQL Editor**, paste the contents of `api/scripts/db_init.sql`, and click **Run** to create tables.

### 3. Deploy API to Railway

1. Sign up at [railway.app](https://railway.app) and click **New Project**.
2. Choose **Deploy from GitHub Repo**, link your `crypto-screener` repo, and select the `api` folder as the root.
3. Add environment variables in Railway’s **Variables** tab:
   - `DATABASE_URL`: Paste from Supabase.
   - `COINGECKO_BASE`: `https://api.coingecko.com/api/v3`
   - `REDIS_URL`: (Optional) Create a Railway Redis service and copy its URL, or use [upstash.com](https://upstash.com) for a free Redis instance.
   - `PORT`: `4000`
4. Click **Deploy**. Once deployed, copy the public URL (e.g., `https://your-api.up.railway.app`).

### 4. Deploy Frontend to Vercel

1. Sign up at [vercel.com](https://vercel.com) and click **Add New** → **Project**.
2. Import your `crypto-screener` repo, set the **Root Directory** to `web`.
3. In **Environment Variables**, add:
   - `VITE_API_BASE`: Railway API URL from step 3 (e.g., `https://your-api.up.railway.app/api`).
4. Click **Deploy**. Vercel will provide a public URL (e.g., `https://crypto-screener.vercel.app`).

### 5. Automate with GitHub Actions

1. Ensure `.github/workflows/deploy-api.yml` and `deploy-frontend.yml` are in your repo.
2. In GitHub, go to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:
   - Add `RAILWAY_TOKEN` (from Railway **Account Settings** → **Tokens**).
   - Add `VERCEL_TOKEN` (from Vercel **Account Settings** → **Tokens**).
   - Add `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` (from Vercel project **Settings**).
3. Push any code change to trigger automatic redeployment.

### 6. Test Your Screener

- Visit your Vercel URL (e.g., `https://crypto-screener.vercel.app`).
- Use the filters (e.g., max market cap, RSI) to screen coins.
- If you see “Loading…” for too long, check Railway logs for API errors or Supabase for DB connectivity.

## Troubleshooting

- **API errors**: Ensure `DATABASE_URL` is correct and Supabase tables are created.
- **Rate limits**: CoinGecko free API has a 50 requests/minute limit. Redis caching helps; consider a paid plan for production.
- **Frontend blank**: Verify `VITE_API_BASE` in Vercel matches Railway’s API URL.
- **Need help?**: Check [Supabase Docs](https://supabase.com/docs), [Railway Docs](https://docs.railway.app), or [Vercel Docs](https://vercel.com/docs).

## Next Steps

- Add WebSocket for real-time updates (e.g., Binance WebSocket API).
- Integrate LunarCrush for social metrics (paid API).
- Enable user accounts with Supabase Auth.
- Add candlestick pattern visuals in the UI.

## License

MIT License
