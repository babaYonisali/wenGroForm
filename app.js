const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (frontend)
app.use(express.static('./'));

// Connect to MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is required');
    process.exit(1);
}

// Add connection timeout and better error handling
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // 5 second timeout
    socketTimeoutMS: 45000, // 45 second timeout
    connectTimeoutMS: 10000, // 10 second timeout
    maxPoolSize: 10
});

const db = mongoose.connection;
db.on('error', (error) => {
    console.error('❌ MongoDB connection error:', error);
});
db.on('connected', () => {
    console.log('✅ Connected to MongoDB');
});
db.on('disconnected', () => {
    console.log('❌ Disconnected from MongoDB');
});
db.once('open', () => {
    console.log('🚀 MongoDB connection established');
});

// User Schema
const userSchema = new mongoose.Schema({
    xHandle: {
        type: String,
        required: true,
        unique: true
    },
    telegramHandle: {
        type: String,
        required: true,
        unique: true
    },
    xHandleReferral: {
        type: String,
        required: false
    },
    hasKaitoYaps: {
        type: Boolean,
        default: false
    },
    joinTime: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

// Submission Schema
const submissionSchema = new mongoose.Schema({
    link: {
        type: String,
        required: true,
        unique: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

const Submission = mongoose.model('Submission', submissionSchema);

// Create unique index on link field
submissionSchema.index({ link: 1 }, { unique: true });

// Routes

// GET - Retrieve all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().sort({ joinTime: -1 });
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
});

// POST - Add a new user
app.post('/api/users', async (req, res) => {
    try {
        const { xHandle, telegramHandle, xHandleReferral, kaitoYaps } = req.body;

        // Validate required fields
        if (!xHandle || !telegramHandle) {
            return res.status(400).json({
                success: false,
                message: 'X Handle and Telegram Handle are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { xHandle: xHandle.toLowerCase() },
                { telegramHandle: telegramHandle.toLowerCase() }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this X Handle or Telegram Handle already exists'
            });
        }

        // Create new user
        const user = new User({
            xHandle: xHandle.toLowerCase(),
            telegramHandle: telegramHandle.toLowerCase(),
            xHandleReferral: xHandleReferral ? xHandleReferral.toLowerCase() : null,
            hasKaitoYaps: kaitoYaps === true
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'User added successfully',
            data: user
        });

    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding user'
        });
    }
});

// GET - Retrieve all submissions
app.get('/api/submissions', async (req, res) => {
    try {
        const submissions = await Submission.find().sort({ submittedAt: -1 });
        res.json({
            success: true,
            data: submissions
        });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching submissions'
        });
    }
});

// POST - Add a new submission
app.post('/api/submissions', async (req, res) => {
    try {
        const { link, submittedAt } = req.body;

        // Validate required fields
        if (!link) {
            return res.status(400).json({
                success: false,
                message: 'Link is required'
            });
        }

        // Validate URL format
        try {
            new URL(link);
        } catch {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid URL'
            });
        }

        // Check if link already exists
        const existingSubmission = await Submission.findOne({ link: link });
        if (existingSubmission) {
            return res.status(400).json({
                success: false,
                message: 'This link has already been submitted. Please submit a different link.'
            });
        }

        // Create new submission
        const submission = new Submission({
            link: link,
            submittedAt: submittedAt || new Date()
        });

        await submission.save();

        res.status(201).json({
            success: true,
            message: 'Submission added successfully',
            data: submission
        });

    } catch (error) {
        console.error('Error adding submission:', error);
        
        // Handle duplicate link error (fallback for race conditions)
        if (error.code === 11000 && error.keyPattern && error.keyPattern.link) {
            return res.status(400).json({
                success: false,
                message: 'This link has already been submitted. Please submit a different link.'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error adding submission'
        });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// API info route
app.get('/api', (req, res) => {
    res.json({
        message: 'WenGro Forum API',
        endpoints: {
            'GET /api/users': 'Get all users',
            'POST /api/users': 'Add new user',
            'GET /api/submissions': 'Get all submissions',
            'POST /api/submissions': 'Add new submission'
        }
    });
});

const PORT = process.env.PORT || 3001;

// For Vercel deployment
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🌐 Frontend available at http://localhost:${PORT}`);
        console.log(`📡 API available at http://localhost:${PORT}/api`);
    });
}

// Export for Vercel
module.exports = app; 