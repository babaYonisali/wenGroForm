require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieSession = require('cookie-session');
const { TwitterApi } = require('twitter-api-v2');

const app = express();

// ---------- Config ----------
const {
  MONGODB_URI,
  X_CLIENT_ID,
  X_CLIENT_SECRET,
  X_CALLBACK_URL,
  SESSION_SECRET,
  FRONTEND_URL = 'https://community.wengro.com/',
  NODE_ENV
} = process.env;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

// ---------- Middleware ----------
app.use(cors({
  origin: [
    FRONTEND_URL,
    'https://wen-gro-form-git-dev-yonis-projects-dee17595.vercel.app',
    'https://community.wengro.com'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.static('./'));

// Secure, signed cookie session that works on Vercel
app.use(cookieSession({
  name: 'sess',
  secret: SESSION_SECRET || 'dev-secret',
  httpOnly: true,
  sameSite: 'lax',
  secure: NODE_ENV === 'production', // required on HTTPS
  // cookie-session stores data client-side so it is serverless friendly
}));

// ---------- Mongo ----------
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10
});

const db = mongoose.connection;
db.on('error', (error) => console.error('❌ MongoDB connection error:', error));
db.on('connected', () => console.log('✅ Connected to MongoDB'));
db.on('disconnected', () => console.log('❌ Disconnected from MongoDB'));
db.once('open', () => console.log('🚀 MongoDB connection established'));

// ---------- Models ----------
const userSchema = new mongoose.Schema({
  xHandle: { type: String, required: true, unique: true },
  telegramHandle: { type: String, required: false, unique: false },
  xHandleReferral: { type: String, required: false },
  hasKaitoYaps: { type: Boolean, default: false },
  joinTime: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Thread submission schema
const threadSubmissionSchema = new mongoose.Schema({
  xHandle: { type: String, required: true },
  tweetId: { type: String, required: true },
  tweetUrl: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now }
});

const ThreadSubmission = mongoose.model('ThreadSubmission', threadSubmissionSchema);

// ---------- Helpers ----------
function getTwitterClient() {
  return new TwitterApi({
    clientId: X_CLIENT_ID,
    clientSecret: X_CLIENT_SECRET,
  });
}

// ------------- NEW: X Login -------------
// 1) Start OAuth2 with PKCE
app.get('/auth/x/start', async (req, res) => {
  try {
    const client = getTwitterClient();

    // Ask for username and read scopes
    const scopes = ['users.read', 'tweet.read', 'offline.access'];

    // Determine callback URL based on the request origin
    const origin = req.get('origin') || req.get('referer') || FRONTEND_URL;
    const isProduction = origin.includes('community.wengro.com');
    const callbackUrl = isProduction 
      ? 'https://community.wengro.com/auth/x/callback'
      : 'https://wen-gro-form-git-dev-yonis-projects-dee17595.vercel.app/auth/x/callback';

    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
      callbackUrl,
      { scope: scopes }
    );

    // Save both in session to validate later, including the callback URL used
    req.session.oauth = { codeVerifier, state, callbackUrl };
    res.redirect(url);
  } catch (err) {
    console.error('Error starting X auth:', err);
    res.status(500).send('Auth init failed');
  }
});

// 2) Handle the callback from X (both domains)
app.get('/auth/x/callback', async (req, res) => {
  try {
    const { state, code } = req.query;
    if (!req.session.oauth || !state || !code) {
      return res.status(400).send('Missing state or code');
    }
    if (state !== req.session.oauth.state) {
      return res.status(400).send('State mismatch');
    }

    const client = getTwitterClient();

    // Use the callback URL that was stored in the session
    const redirectUri = req.session.oauth.callbackUrl || X_CALLBACK_URL;

    const {
      client: loggedClient,
      accessToken,
      refreshToken,
      expiresIn,
    } = await client.loginWithOAuth2({
      code: code.toString(),
      codeVerifier: req.session.oauth.codeVerifier,
      redirectUri: redirectUri,
    });

    // Fetch the user so we can get their handle
    const me = await loggedClient.v2.me({
      'user.fields': ['username', 'name', 'profile_image_url'],
    });

    const xHandle = me.data?.username?.toLowerCase();
    if (!xHandle) {
      return res.status(400).send('Could not read X handle');
    }

    // Save an auth session (serverless friendly cookie)
    req.session.user = {
      xHandle,
      accessToken,
      refreshToken,
      expiresAt: Date.now() + (expiresIn * 1000),
    };

    // Determine the frontend URL based on the callback URL used
    const isProduction = redirectUri.includes('community.wengro.com');
    const frontendUrl = isProduction 
      ? 'https://community.wengro.com'
      : 'https://wen-gro-form-git-dev-yonis-projects-dee17595.vercel.app';

    // Redirect back to the appropriate frontend
    const redirectUrl = new URL(frontendUrl);
    redirectUrl.searchParams.set('login', 'success');
    redirectUrl.searchParams.set('xHandle', xHandle);
    return res.redirect(redirectUrl.toString());
  } catch (err) {
    console.error('Error in X callback:', err);
    res.status(500).send('Auth callback failed');
  }
});

// 3) A tiny endpoint to get the logged-in user for your frontend
app.get('/api/me', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.json({ authenticated: false });
    }
    res.json({
      authenticated: true,
      xHandle: req.session.user.xHandle,
    });
  } catch (e) {
    res.status(500).json({ authenticated: false });
  }
});

// 4) Logout
app.post('/auth/logout', (req, res) => {
  req.session = null;
  res.json({ success: true });
});

// ---------- Your existing routes ----------
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ joinTime: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// Create or update user once Telegram handle is submitted by the logged-in user
app.post('/api/users', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { telegramHandle, xHandleReferral, kaitoYaps } = req.body;
    const xHandle = req.session.user.xHandle;

    if (!telegramHandle) {
      return res.status(400).json({ success: false, message: 'Telegram Handle is required' });
    }

    // Upsert by xHandle
    const user = await User.findOneAndUpdate(
      { xHandle },
      {
        xHandle,
        telegramHandle: telegramHandle.toLowerCase(),
        xHandleReferral: xHandleReferral ? xHandleReferral.toLowerCase() : null,
        hasKaitoYaps: kaitoYaps === true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      success: true,
      message: 'User saved',
      data: user
    });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ success: false, message: 'Error adding user' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/api', (req, res) => {
  res.json({
    message: 'WenGro Forum API',
    endpoints: {
      'GET /api/users': 'Get all users',
      'POST /api/users': 'Create or update user for logged-in X account',
      'GET /api/me': 'Get the current logged-in X user',
      'GET /auth/x/start': 'Begin X login',
      'GET /auth/x/callback': 'X login callback',
      'POST /auth/logout': 'Log out'
    }
  });
});
app.get('/api/users/:xHandle', async (req, res) => {
    try {
        const user = await User.findOne({ xHandle: req.params.xHandle });
        if (user) {
            res.json({ success: true, data: user });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
app.post('/auth/logout', (req, res) => {
    req.session = null;
    res.json({ success: true, message: 'Logged out successfully' });
});

// Thread submission endpoints
app.get('/api/thread-submissions/status', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const xHandle = req.session.user.xHandle;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const submission = await ThreadSubmission.findOne({
      xHandle: xHandle,
      submittedAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

    res.json({
      success: true,
      hasSubmittedToday: !!submission
    });
  } catch (error) {
    console.error('Error checking submission status:', error);
    res.status(500).json({ success: false, message: 'Error checking submission status' });
  }
});

app.post('/api/thread-submissions', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { tweetUrl, tweetId } = req.body;
    const xHandle = req.session.user.xHandle;

    if (!tweetUrl || !tweetId) {
      return res.status(400).json({ success: false, message: 'Tweet URL and ID are required' });
    }

    // Check if user has already submitted today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingSubmission = await ThreadSubmission.findOne({
      xHandle: xHandle,
      submittedAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (existingSubmission) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already submitted a thread today. Come back tomorrow!' 
      });
    }

    // Create new submission
    const submission = new ThreadSubmission({
      xHandle: xHandle,
      tweetId: tweetId,
      tweetUrl: tweetUrl
    });

    await submission.save();

    res.status(201).json({
      success: true,
      message: 'Thread submitted successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error submitting thread:', error);
    res.status(500).json({ success: false, message: 'Error submitting thread' });
  }
});
const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Frontend at ${PORT}`);
  });
}

module.exports = app;
