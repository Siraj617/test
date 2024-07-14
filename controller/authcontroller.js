// controllers/authController.js
const session = require('express-session');
// controllers/authController.js
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const cloudinary = require('../config/Cloudinary');
exports.registerUser = async (req, res, next) => {
    try {
        const { username, email, password, role } = req.body;
        const profileImageFile = req.file; // Assuming you're using multer to handle file upload

        // Check if the username already exists
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        // Check if the email already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Upload profile image to Cloudinary
        let profileImageUrl = '';
        if (profileImageFile) {
            const result = await cloudinary.uploader.upload(profileImageFile.path, {
                folder: 'UserProfiles',
            });
            profileImageUrl = result.secure_url;
        }

        // Generate a unique API Key
        const apiKey = crypto.randomBytes(32).toString('hex');

        const user = await User.create({ username, email, password, profileImage: profileImageUrl, role, apikey: apiKey });

        if (user) {
            const otp = crypto.randomBytes(3).toString('hex');
            const hashedOtp = await bcrypt.hash(otp, 10);
            user.otp = hashedOtp;
            await user.save();

            // Send email with OTP
            await sendEmail({
                email: user.email,
                subject: 'OTP for Email Verification',
                message: `Your OTP is: ${otp}`,
            });

            res.status(201).json({ message: 'User registered, OTP sent to email' });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        next(error);
    }
};


exports.verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            res.status(400);
            throw new Error('Invalid email');
        }
        const isMatch = await bcrypt.compare(otp, user.otp);
        if (!isMatch) {
            res.status(400);
            throw new Error('Invalid OTP');
        }
        user.isVerified = true;
        user.otp = undefined;
        await user.save();

        res.status(200).json({
            message: 'OTP verified, user is now verified',
            token: generateToken(user._id),
        });
    } catch (error) {
        next(error);
    }
};

exports.authUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log('Incoming login request:', { email, password }); // Add this line for logging
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            req.session.userId = user._id;
            req.session.username = user.username;
            console.log('Session Details:', req.session);

            res.json({
                message: 'Login successful',
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                },
            });
        } else {
            res.status(401);
            throw new Error('Invalid email or password');
        }
    } catch (error) {
        next(error);
    }
};

// controllers/authController.js
exports.logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
        res.clearCookie('connect.sid', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        });
        res.status(200).json({ message: 'Logout successful' });
    });
};

