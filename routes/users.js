const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { xHandle, telegramHandle, xHandleReferral } = req.body;

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
            xHandleReferral: xHandleReferral ? xHandleReferral.toLowerCase() : null
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    xHandle: user.xHandle,
                    telegramHandle: user.telegramHandle,
                    xHandleReferral: user.xHandleReferral,
                    joinTime: user.joinTime
                }
            }
        });

    } catch (error) {
        console.error('User registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// @route   GET /api/users
// @desc    Get all users
// @access  Public
router.get('/', async (req, res) => {
    try {
        const users = await User.find()
            .select('xHandle telegramHandle xHandleReferral joinTime')
            .sort({ joinTime: -1 });

        res.json({
            success: true,
            data: { users }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching users'
        });
    }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching user'
        });
    }
});

module.exports = router; 