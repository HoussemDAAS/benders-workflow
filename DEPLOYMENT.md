# Deployment Guide - Vercel

This guide explains how to properly deploy the Benders Workflow application to Vercel.

## Environment Configuration

### Frontend Environment Variables

For production deployment on Vercel, make sure to set the following environment variables in the Vercel dashboard:

#### Required for Frontend
- `VITE_APP_NAME=Benders Workflow`
- `VITE_GOOGLE_CLIENT_ID=1046832881811-g4pjtbco8bt44pn36d6m43fqv5kv2udg.apps.googleusercontent.com`
- `VITE_GITHUB_CLIENT_ID=Ov23liopqpEkbvNjxJBF`

#### Important: API URL Configuration
- **DO NOT** set `VITE_API_URL` in production
- When `VITE_API_URL` is not set, the app automatically uses relative URLs (`/api`) which works with Vercel's routing

### Backend Environment Variables

Set these in the Vercel dashboard for the API functions:

- `NODE_ENV=production`
- `JWT_SECRET=your-secure-jwt-secret`
- `GOOGLE_CLIENT_SECRET=your-google-oauth-secret`
- `GITHUB_CLIENT_SECRET=your-github-oauth-secret`
- `DATABASE_URL=your-database-connection-string`
- `FRONTEND_URL=https://your-vercel-domain.vercel.app`

## API Routing

The application uses Vercel's file-based API routing:

- Frontend: Serves static files from `/dist`
- API: All `/api/*` requests are routed to `api/index.js`
- SPA: All other routes serve `index.html` for client-side routing

## Common Deployment Issues

### Mixed Content Errors
- **Problem**: Frontend on HTTPS trying to call `http://localhost:3001`
- **Solution**: Ensure `VITE_API_URL` is not set in production environment

### OAuth Callback URLs
Make sure to configure the correct callback URLs in your OAuth providers:
- Google: `https://your-domain.vercel.app/api/auth/google/callback`
- GitHub: `https://your-domain.vercel.app/api/auth/github/callback`

### CORS Configuration
The backend should allow requests from your Vercel domain. Update `FRONTEND_URL` environment variable.

## Development vs Production

### Development (localhost)
```bash
# .env
VITE_API_URL=http://localhost:3001/api
```

### Production (Vercel)
```bash
# Environment variables in Vercel dashboard
# VITE_API_URL=  # Leave empty!
```

## Deployment Steps

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy (automatic on git push)

## Verification

After deployment, verify:

1. Frontend loads correctly
2. API endpoints respond (check `/api/health`)
3. OAuth login works
4. No mixed content errors in browser console
