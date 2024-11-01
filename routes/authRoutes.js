const express = require('express');
const {
    registerUser, verifyOTP, authUser, logoutUser,
    getAllTasks, StoreTask, updateDescription, updateGitrepo,
    getUsers, sendMessage, getMessages, getAllUsers,
    createUser, deleteUser
} = require('../controller/authcontroller');
const { validateRegister, validateLogin } = require('../middlewares/validation');
const limiter = require('../middlewares/rateLimiter');
const { protect } = require('../middlewares/authMiddleware');
const csurf = require('csurf'); 
const upload = require('../middlewares/Upload'); 

const router = express.Router();

// CSRF protection setup
const csrfProtection = csurf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    }
});

// Route to fetch CSRF token
router.get('/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Register Route with file upload middleware
router.post('/register', limiter, upload.single('profileImage'), validateRegister,  registerUser);

// Verify OTP Route
router.post('/verify-otp', limiter, csrfProtection, verifyOTP);

// Login Route
router.post('/login', limiter, validateLogin, authUser);

// Logout Route
router.post('/logout', limiter, csrfProtection, logoutUser);

// Test Route (for basic connection testing)
router.get('/test', (req, res) => {
    res.send('Test route');
});

// Protected routes (tasks, description updates, etc.)
router.get('/tasks', csrfProtection, getAllTasks);
router.post('/tasks', csrfProtection, StoreTask);
router.post('/updatedescription', csrfProtection, updateDescription);
router.post('/updateGitrepo', csrfProtection, updateGitrepo);

// Chat routes
router.get('/chatusers', csrfProtection, getUsers);
router.post('/messages', csrfProtection, sendMessage);
router.get('/messages', csrfProtection, getMessages);

// Admin routes for user management
router.get('/admingetusers', csrfProtection, getAllUsers);
router.post('/admincreateusers', csrfProtection, createUser);
router.delete('/admindeleteusers/:id', csrfProtection, deleteUser);

module.exports = router;
