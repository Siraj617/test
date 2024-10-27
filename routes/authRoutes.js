// routes/authRoutes.js
const express = require('express');
const {
    registerUser, verifyOTP, authUser, logoutUser,
    getAllTasks, StoreTask, updateDescription, updateGitrepo,
    getUsers, sendMessage, getMessages, getAllUsers,
    createUser, deleteUser
} = require('../controller/authcontroller');
const { validateRegister, validateLogin } = require('../middlewares/validation');
const limiter = require('../middlewares/rateLimiter');
const upload = require('../middlewares/Upload');

const router = express.Router();

// CSRF Protection Middleware - Apply once at the router level
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });
router.use(csrfProtection);

// CSRF Token Route (for frontend to retrieve CSRF token)
router.get('/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Register Route with file upload middleware
router.post('/register', limiter, upload.single('profileImage'), validateRegister, registerUser);

// Verify OTP Route
router.post('/verify-otp', limiter, verifyOTP);

// Login Route
router.post('/login', limiter, validateLogin, authUser);

// Logout Route
router.post('/logout', limiter, logoutUser);

// Test Route
router.get('/test', (req, res) => {
    res.send('Test route');
});

// Task Routes
router.get('/tasks', getAllTasks);
router.post('/tasks', StoreTask);
router.post('/updatedescription', updateDescription);
router.post('/updateGitrepo', updateGitrepo);

// Chat Routes
router.get('/chatusers', getUsers);
router.post('/messages', sendMessage);
router.get('/messages', getMessages); // Use GET for fetching messages

// Admin Routes
router.get('/admingetusers', getAllUsers);
router.post('/admincreateusers', createUser);
router.delete('/admindeleteusers/:id', deleteUser); // CSRF protection is handled globally

module.exports = router;
