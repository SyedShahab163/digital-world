# Deploying Digital World on Vercel (one project, one domain)

`vercel.json` (repo root) defines two services in ONE Vercel project:

| Service | Folder | Public route |
|---|---|---|
| `frontend` (Next.js) | `frontend/` | everything except `/api/*` |
| `backend` (Express)  | `backend/`  | `/api/*` (the `/api` prefix is kept; Express routes are already mounted under `/api`) |

The browser calls same-origin `/api/...`. Server-side Next.js code reaches the API through `frontend/lib/backend-url.ts`
(`BACKEND_URL` -> production domain -> deployment URL -> `http://localhost:4000`). Vercel Services is a Beta feature.

## 1. Accounts / services to create (one-time)
1. **Postgres** (Neon, Supabase, Vercel Marketplace, ...). Copy the connection string (use the *pooled* one if offered, with `sslmode=require`).
2. **Cloudinary** account: cloud name, API key, API secret. Required in production.
3. **Upstash Redis** (free tier is fine; or the Vercel Marketplace integration): REST URL + REST token.

## 2. Environment variables (Vercel > Project > Settings > Environment Variables, scope: Production, and Preview if you use previews)

| Variable | Value | Required |
|---|---|---|
| `DATABASE_URL` | your hosted Postgres URL | yes |
| `JWT_SECRET` | NEW random string, 48+ bytes: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` | yes |
| `JWT_EXPIRES_IN` | `7d` | optional |
| `NODE_ENV` | `production` | yes |
| `CORS_ORIGINS` | `https://your-domain.com` (comma-separate extra origins) | yes |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | NEW admin credentials (only needed when you run the seed; see step 4) | for seeding |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | from Cloudinary | yes |
| `CLOUDINARY_FOLDER` | e.g. `digital-world` (keep your existing value if you already have uploads) | optional |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | from Upstash (the Marketplace pair `KV_REST_API_URL` / `KV_REST_API_TOKEN` also works) | yes (login protection) |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` | yes |
| `BUSINESS_TIMEZONE` | `Asia/Karachi` | optional |
| `BACKEND_URL` | leave UNSET (auto-derived). Only set `https://your-domain.com` if you see server-side fetch errors. | no |
| `PUBLIC_API_URL` | not needed in production (only for local-disk uploads in dev) | no |

Never commit real values. `*.env.example` files contain placeholders only.

## 3. Database migration (run from your own computer, once, and after every future schema change)
```bash
cd backend
npm install
# PowerShell:  $env:DATABASE_URL="<your hosted Postgres URL>"      bash: export DATABASE_URL="..."
npx prisma migrate deploy
```
`migrate deploy` applies the SQL files in `backend/prisma/migrations` in order. It is safe to re-run.

## 4. Create the admin (once)
Still in `backend/`, with `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (10+ chars) and `ADMIN_NAME` set in the same terminal:
```bash
npm run seed            # creates the admin + starter data
# later, to change the admin password:  npm run admin:reset
```
Then remove those ADMIN_* values from your terminal history/session. The seed does NOT overwrite an existing admin; use `admin:reset`.

## 5. Deploy
1. Push this code to GitHub (you must do this yourself; I could not push).
2. Vercel > Add New > Project > import the repo. Set **Framework Preset = "Services"** (Vercel Services Beta) and leave Root Directory at the repo root.
3. Add the environment variables from step 2, then Deploy.
4. Add your custom domain under Settings > Domains and set `CORS_ORIGINS` / `NEXT_PUBLIC_SITE_URL` to it, then redeploy.

## 6. After the first deploy, check
- `https://your-domain.com/api/health` returns `{"success":true,...}`
- Storefront loads, `/admin/login` works with the new admin, and a product image **and** a video upload in the admin succeed (they upload straight to Cloudinary).
- 11 wrong logins in 15 minutes gives HTTP 429 (proves Upstash is connected).

## Notes
- Uploads go browser -> Cloudinary (signed by `POST /api/admin/upload/sign`), then the API verifies the asset with Cloudinary before saving. Limits: images 8 MB, videos 60 MB (Cloudinary plan limits may be lower).
- Local development is unchanged: `cd backend && npm run dev`, `cd frontend && npm run dev`; without Cloudinary keys uploads use `backend/uploads` as before.
- `vercel dev --local` from the repo root runs both services on one port. Set `BACKEND_URL=http://localhost:3000` for it, and configure Cloudinary (local-disk uploads are disabled when `VERCEL` is set).
- Rotate anything that was ever in the old `backend/.env.example` (old `JWT_SECRET`, old admin password): it was public in Git history.
