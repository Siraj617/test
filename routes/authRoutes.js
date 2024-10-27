// routes/authRoutes.js
const express = require('express');
const { registerUser, verifyOTP, authUser, logoutUser, getAllTasks , StoreTask, updateDescription, updateGitrepo, getUsers,  sendMessage, getMessages , getAllUsers, createUser, deleteUser} = require('../controller/authcontroller');
const { validateRegister, validateLogin } = require('../middlewares/validation');
const limiter = require('../middlewares/rateLimiter');
const { protect } = require('../middlewares/authMiddleware');
const csurf = require('csurf');  // Import csurf middleware
const upload = require('../middlewares/Upload'); // Import multer middleware

// chatapp module get users
const router = express.Router();

// Log CSRF token for debugging
router.use((req, res, next) => {
    console.log('CSRF Token:', req.csrfToken());
    next();
});

const csrfProtection = csurf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });
router.use(csrfProtection);

// Register Route with file upload middleware
router.post('/register', limiter, upload.single('profileImage'), validateRegister, registerUser);

// Verify OTP Route
router.post('/verify-otp', limiter, verifyOTP);

// Login Route
router.post('/login', limiter, csurf({ cookie: true }), validateLogin, authUser);

// Logout Route
router.post('/logout', limiter, logoutUser);

// Test Route
router.get('/test', (req, res) => {
    res.send('Test route');
});

router.get('/tasks', getAllTasks);

router.post('/tasks', StoreTask);

// routes/authRoutes.js
router.post('/updatedescription', updateDescription);

router.post('/updateGitrepo', updateGitrepo);

router.get('/chatusers', getUsers);

router.post('/messages', sendMessage);

router.get('/messages', getMessages); // Use GET for fetching messages

router.get('/admingetusers', getAllUsers)

router.post('/admincreateusers', createUser)

router.delete('/admindeleteusers/:id', csrfProtection, deleteUser);



module.exports = router;
