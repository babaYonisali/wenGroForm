# 🚀 Deploy WenGro Forum to Vercel

## Prerequisites
- Vercel account (free at vercel.com)
- MongoDB Atlas cluster set up
- Git repository with your code

## Step-by-Step Deployment

### 1. Install Vercel CLI (Optional)
```bash
npm i -g vercel
```

### 2. Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login** with your GitHub account
3. **Click "New Project"**
4. **Import your repository** from GitHub
5. **Configure the project:**
   - Framework Preset: `Node.js`
   - Root Directory: `./` (leave as default)
   - Build Command: `npm install` (or leave empty)
   - Output Directory: `./` (leave as default)

### 3. Set Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add the following variable:
   - **Name:** `MONGODB_URI`
   - **Value:** `mongodb+srv://your-username:your-password@your-cluster.mongodb.net/wengro_forum`
   - **Environment:** Production, Preview, Development
   
   **⚠️ Replace with your actual MongoDB Atlas connection string**

### 4. Deploy

1. Click **Deploy**
2. Wait for the build to complete
3. Your app will be live at: `https://your-project-name.vercel.app`

### 5. Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow the DNS configuration instructions

## File Structure for Vercel

```
wenGroForum/
├── app.js              # Express server
├── index.html          # Frontend
├── styles.css          # Styles
├── script.js           # Frontend logic
├── wengroLogo.jpg      # Logo
├── package.json        # Dependencies
├── vercel.json         # Vercel config
└── DEPLOYMENT.md       # This file
```

## Troubleshooting

### Common Issues:

1. **MongoDB Connection Error:**
   - Check your `MONGODB_URI` environment variable
   - Ensure your MongoDB Atlas IP whitelist includes `0.0.0.0/0`

2. **Build Errors:**
   - Check that all dependencies are in `package.json`
   - Ensure `vercel.json` is properly configured

3. **API Routes Not Working:**
   - Verify the routes in `vercel.json` are correct
   - Check that `app.js` exports the Express app

### Local Testing:

```bash
# Install dependencies
npm install

# Start locally
node app.js

# Visit http://localhost:3001
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify MongoDB Atlas connection
3. Test locally first
4. Check environment variables are set correctly 