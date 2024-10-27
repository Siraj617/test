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
router.get('/messages', getMessages);

// Admin Routes
router.get('/admingetusers', getAllUsers);
router.post('/admincreateusers', createUser);
router.delete('/admindeleteusers/:id', deleteUser);

module.exports = router;
