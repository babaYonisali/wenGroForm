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
    'https://community.wengro.com',
    'http://localhost:3001'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.static('./'));
app.use('/assets', express.static(__dirname + '/assets'));

// Secure, signed cookie session that works on Vercel
app.use(cookieSession({
  name: 'sess',
  secret: SESSION_SECRET || 'dev-secret',
  httpOnly: true,
  sameSite: 'lax',
  secure: NODE_ENV === 'production', // required on HTTPS
  // cookie-session stores data client-side so it is serverless friendly
}));

// ---------- Database ----------
const connectDB = require('./config/database');
connectDB();

// ---------- Models ----------
const User = require('./models/User');
const Submission = require('./models/Submission');
const CotiSubmission = require('./models/CotiSubmission');

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
      : origin.includes('localhost')
        ? 'http://localhost:3001/auth/x/callback'
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

    const submission = await Submission.findOne({
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

    const existingSubmission = await Submission.findOne({
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
    const submission = new Submission({
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

// COTI submission endpoints
app.get('/api/coti-submissions/status', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const xHandle = req.session.user.xHandle;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const submission = await CotiSubmission.findOne({
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
    console.error('Error checking COTI submission status:', error);
    res.status(500).json({ success: false, message: 'Error checking COTI submission status' });
  }
});

app.post('/api/coti-submissions', async (req, res) => {
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

    const existingSubmission = await CotiSubmission.findOne({
      xHandle: xHandle,
      submittedAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (existingSubmission) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already submitted a COTI thread today. Come back tomorrow!' 
      });
    }

    // Create new submission
    const submission = new CotiSubmission({
      xHandle: xHandle,
      tweetId: tweetId,
      tweetUrl: tweetUrl
    });

    await submission.save();

    res.status(201).json({
      success: true,
      message: 'COTI thread submitted successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error submitting COTI thread:', error);
    res.status(500).json({ success: false, message: 'Error submitting COTI thread' });
  }
});

// ---------- Mavryk Leaderboard API ----------
app.get('/api/mavryk-leaderboard', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, readyState:', mongoose.connection.readyState);
      return res.status(503).json({
        success: false,
        message: 'Database not ready, please try again in a moment'
      });
    }

    // Check if database connection exists
    if (!mongoose.connection.db) {
      console.log('MongoDB database object not available');
      return res.status(503).json({
        success: false,
        message: 'Database not ready, please try again in a moment'
      });
    }

    // Connect to MongoDB and get the mavrykleaderboards collection
    const db = mongoose.connection.db;
    const collection = db.collection('mavrykleaderboards');
    
    // Fetch all documents, sorted by totalImpressions descending
    const leaderboardData = await collection
      .find({})
      .sort({ totalImpressions: -1 })
      .toArray();
    
    // Transform the data to match our frontend format
    const transformedData = leaderboardData.map((item, index) => ({
      rank: index + 1,
      name: item.xHandle || 'Unknown',
      mindshare: item.totalImpressions ? `${((item.totalImpressions / 180000)*100).toFixed(2)}K` : '0',
      avatar: getRandomAvatar(), // Fallback emoji avatar
      profileImageUrl: item.xHandle ? getProfilePictureFallbacks(item.xHandle)[0] : null,
      profileImageFallbacks: item.xHandle ? getProfilePictureFallbacks(item.xHandle) : [],
      isTopThree: index < 3,
      crownType: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : null,
      xHandle: item.xHandle,
      totalImpressions: item.totalImpressions,
      tweetCount: item.tweetCount,
      twitterUrl: item.xHandle ? `https://twitter.com/${item.xHandle}` : null
    }));
    
    res.json({
      success: true,
      data: transformedData
    });
  } catch (error) {
    console.error('Error fetching Mavryk leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard data'
    });
  }
});

// ---------- COTI Leaderboard API ----------
app.get('/api/coti-leaderboard', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, readyState:', mongoose.connection.readyState);
      return res.status(503).json({
        success: false,
        message: 'Database not ready, please try again in a moment'
      });
    }

    // Check if database connection exists
    if (!mongoose.connection.db) {
      console.log('MongoDB database object not available');
      return res.status(503).json({
        success: false,
        message: 'Database not ready, please try again in a moment'
      });
    }

    // Connect to MongoDB and get the cotiLeaderboard collection
    const db = mongoose.connection.db;
    const collection = db.collection('cotiLeaderboard');
    
    // Fetch all documents, sorted by totalImpressions descending
    const leaderboardData = await collection
      .find({})
      .sort({ totalImpressions: -1 })
      .toArray();
    
    // Transform the data to match our frontend format
    const transformedData = leaderboardData.map((item, index) => ({
      rank: index + 1,
      name: item.xHandle || 'Unknown',
      mindshare: item.totalImpressions ? `${((item.totalImpressions / 180000)*100).toFixed(2)}K` : '0',
      avatar: getRandomAvatar(), // Fallback emoji avatar
      profileImageUrl: item.xHandle ? getProfilePictureFallbacks(item.xHandle)[0] : null,
      profileImageFallbacks: item.xHandle ? getProfilePictureFallbacks(item.xHandle) : [],
      isTopThree: index < 3,
      crownType: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : null,
      xHandle: item.xHandle,
      totalImpressions: item.totalImpressions,
      tweetCount: item.tweetCount,
      twitterUrl: item.xHandle ? `https://twitter.com/${item.xHandle}` : null
    }));
    
    res.json({
      success: true,
      data: transformedData
    });
  } catch (error) {
    console.error('Error fetching COTI leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch COTI leaderboard data'
    });
  }
});

// Helper function to get random avatars
function getRandomAvatar() {
  const avatars = ['👾', '👨', '🐧', '🎭', '🤖', '🎨', '🎪', '🎯', '🎲', '🎮', '🎵', '🎸', '🚀', '💎', '⚡', '🌙', '🔥'];
  return avatars[Math.floor(Math.random() * avatars.length)];
}

// Helper function to get profile picture fallbacks
function getProfilePictureFallbacks(xHandle) {
  return [
    `https://unavatar.io/twitter/${xHandle}`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${xHandle}`,
    `https://robohash.org/${xHandle}?set=set1&size=100x100`,
    `https://ui-avatars.com/api/?name=${encodeURIComponent(xHandle)}&background=ffd700&color=000&size=100`
  ];
}

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Frontend at ${PORT}`);
  });
}

module.exports = app;
