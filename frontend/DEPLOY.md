# ProShop 24/7 Frontend - Vercel Deployment

## Quick Deploy to Vercel

### Method 1: Deploy from GitHub (Recommended)

1. **Create GitHub Repository**
   ```bash
   cd /Users/isr/Desktop/THISISTHE1/frontend
   git init
   git add .
   git commit -m "Initial commit - ProShop 24/7 Frontend"

   # Create repo on GitHub, then:
   git remote add origin https://github.com/YOUR_USERNAME/proshop247-frontend.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel auto-detects Vite settings
   - Add environment variable:
     - `VITE_API_URL` = Your Railway backend URL
   - Click "Deploy"

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Set Environment Variable**
   ```bash
   vercel env add VITE_API_URL production
   # Paste your Railway URL when prompted
   ```

## Environment Variables

Production requires:
- `VITE_API_URL` - Backend API URL from Railway (e.g., https://proshop247-backend.up.railway.app)

## Build Settings (Auto-detected by Vercel)

- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

## Custom Domain (Optional)

After deployment:
1. Go to your Vercel project settings
2. Add custom domain (e.g., proshop247.com)
3. Update DNS records as instructed

## Production URL

After deployment, your frontend will be at:
- Vercel URL: `https://your-project.vercel.app`
- Custom domain: `https://proshop247.com` (if configured)
