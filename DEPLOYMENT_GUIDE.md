# Deployment Guide

## Quick Deployment Options

### 1. Railway (Recommended - Free tier available)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO
   git push -u origin main
   ```

2. **Deploy on Railway:**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub"
   - Select your repository
   - Railway will auto-detect Node.js and deploy
   - Your app will be live at `yourapp.railway.app`

### 2. Render (Free tier with spin-down)

1. **Push to GitHub** (same as above)

2. **Deploy on Render:**
   - Go to [render.com](https://render.com)
   - Create new "Web Service"
   - Connect GitHub account
   - Select repository
   - Settings:
     - Build Command: `npm install`
     - Start Command: `npm start`
   - Click "Create Web Service"

### 3. Heroku (Paid only now)

1. **Install Heroku CLI**

2. **Deploy:**
   ```bash
   heroku create your-app-name
   git push heroku main
   heroku open
   ```

### 4. DigitalOcean App Platform

1. **Push to GitHub**

2. **Create App:**
   - Go to [digitalocean.com](https://digitalocean.com)
   - Apps → Create App
   - Connect GitHub
   - Auto-deploy on push

## Adding Real Ads

### Google AdSense Setup

1. **Apply for AdSense:**
   - Go to [google.com/adsense](https://google.com/adsense)
   - Sign up with your Google account
   - Add your deployed website URL
   - Wait for approval (2-14 days)

2. **Create Ad Units:**
   - Dashboard → Ads → By ad unit
   - Create "Display ads" (728x90 for desktop, 320x50 for mobile)
   - Copy the ad code

3. **Replace placeholders in `index.html`:**
   ```html
   <!-- Replace the ad-placeholder divs with your AdSense code -->
   <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-YOUR-ID"
        data-ad-slot="YOUR-SLOT-ID"
        data-ad-format="auto"></ins>
   <script>
        (adsbygoogle = window.adsbygoogle || []).push({});
   </script>
   ```

### Alternative Ad Networks

**Media.net** (Yahoo/Bing network)
- Good for US/UK/Canada traffic
- Similar approval process to AdSense

**PropellerAds**
- Easier approval
- Various ad formats
- Lower rates than AdSense

**Carbon Ads** (for developer audiences)
- High-quality, relevant ads
- Manual approval required

## Environment Variables

For production, create a `.env` file:
```
PORT=3000
NODE_ENV=production
```

## Domain Setup

1. **Buy a domain** (Namecheap, GoDaddy, etc.)
2. **Point to your host:**
   - Railway: Add custom domain in settings
   - Render: Add custom domain in settings
   - Update DNS records

## Monitoring

1. **Add analytics:**
   ```html
   <!-- Google Analytics -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA-YOUR-ID"></script>
   ```

2. **Error tracking** (optional):
   - Sentry.io
   - LogRocket
   - Rollbar

## Scaling Considerations

- **Socket.io scaling**: Use Redis adapter for multiple servers
- **Database**: Add MongoDB/PostgreSQL for persistent rooms
- **CDN**: Use Cloudflare for static assets
- **Rate limiting**: Prevent spam room creation

## Security Checklist

- [ ] Enable CORS properly
- [ ] Add rate limiting
- [ ] Validate all inputs
- [ ] Use HTTPS only
- [ ] Add helmet.js for security headers
- [ ] Implement room passwords (optional)

## Cost Estimates

- **Railway**: Free tier (500 hours/month)
- **Render**: Free tier (spins down after 15 min)
- **DigitalOcean**: $5/month minimum
- **Domain**: $10-15/year
- **Ad Revenue**: $0.50-5.00 per 1000 views (varies widely)

Good luck with your deployment! 🚀