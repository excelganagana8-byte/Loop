# LOOP Deployment Guide

This guide covers deploying the **LOOP** platform to production using **MongoDB Atlas**, **Render/Railway** (Backend API), and **Vercel/Netlify** (Frontend Single Page App).

---

## Architecture Overview

```
                      ┌──────────────────────┐
                      │   Vercel / Netlify   │
                      │  (React 18 + Vite)   │
                      └──────────┬───────────┘
                                 │ HTTPS / API Requests
                                 ▼
                      ┌──────────────────────┐
                      │   Render / Railway   │
                      │ (Express Node.js ESM)│
                      └──────────┬───────────┘
                                 │ Mongoose TLS
                                 ▼
                      ┌──────────────────────┐
                      │    MongoDB Atlas     │
                      │   Database Cluster   │
                      └──────────────────────┘
```

---

## 1. Database: MongoDB Atlas

1. **Create an Atlas Cluster**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create an M0 (Free Tier) or dedicated cluster.
2. **Database Access**:
   - Create a database user (e.g. `loop-app-user`) with `Read and write to any database` privileges.
3. **Network Access**:
   - Add `0.0.0.0/0` (Allow access from anywhere) or whitelist the outbound IP addresses of your backend host.
4. **Retrieve Connection String**:
   - Click **Connect** → **Drivers** (Node.js) and copy the URI:
     ```
     mongodb+srv://loop-app-user:<password>@cluster0.abcde.mongodb.net/loop?retryWrites=true&w=majority
     ```

---

## 2. Backend API: Render or Railway

### Deploying on Render:
1. Create a **New Web Service** connected to your Git repository.
2. Set configuration:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Configure Environment Variables in Render Dashboard:
   | Variable | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production optimizations & error masking |
   | `PORT` | `5000` | Port assigned by Render |
   | `MONGODB_URI` | `mongodb+srv://...` | Connection URI from MongoDB Atlas |
   | `CLIENT_URL` | `https://your-loop-app.vercel.app` | Frontend production origin (enforces CORS) |
   | `JWT_SECRET` | `minimum-32-char-random-production-secret` | Cryptographic secret for signing JWTs |
   | `JWT_EXPIRES_IN` | `7d` | Token lifespan |
   | `ANTHROPIC_API_KEY` | `sk-ant-...` | Anthropic Claude API Key |
   | `ANTHROPIC_MODEL` | `claude-3-5-sonnet-20241022` | Model target |

---

## 3. Frontend App: Vercel or Netlify

### Deploying on Vercel:
1. Import your Git repository into Vercel.
2. Select **Root Directory**: `client`
3. Framework Preset: **Vite**
4. Configure Build and Output Settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Configure Environment Variables:
   | Variable | Value | Description |
   |---|---|---|
   | `VITE_API_URL` | `https://your-loop-api.onrender.com/api` | Full URL to the Express backend API |
6. **SPA Routing**:
   - Add a `vercel.json` in `/client` (or use Vercel's Vite auto-rewrite) for single page application routing:
     ```json
     {
       "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
     }
     ```

---

## 4. Production Security Checklist

- [x] **CORS Origin Locked**: Express `cors` origin is restricted to `CLIENT_URL` in production mode.
- [x] **Security Headers**: `helmet` is enabled with standard protective headers.
- [x] **No Stack Traces**: `errorHandler` suppresses internal error stacks when `NODE_ENV=production`.
- [x] **Rate Limiting**: Auth endpoints and `/api/ask` endpoints enforce windowed rate limits via `express-rate-limit`.
- [x] **Secrets Isolation**: Anthropic API keys and JWT secrets are stored exclusively server-side and never exposed to the client bundle.
- [x] **Multi-Tenant Scoping**: All queries are scoped strictly to `req.workspaceId` derived from the verified JWT token.
