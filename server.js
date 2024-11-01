const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const xss = require('xss-clean');
const csurf = require('csurf');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const limiter = require('./middlewares/rateLimiter');

dotenv.config();
connectDB();
const app = express();

// Security middlewares
app.use(helmet());
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'https://apis.google.com'],
            styleSrc: ["'self'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
        },
    })
);
app.use(hpp());
app.use(xss());

// Configure CORS to allow frontend access
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['http://localhost:3000'] 
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ['Content-Type', 'csrf-token'],
}));

app.use(express.json());
app.use(cookieParser());

// Session middleware with MongoStore and secure cookie settings
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
        cookie: {
            secure: process.env.NODE_ENV === 'production', // Only secure in production
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,  // 1 week
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        },
    })
);

// Logging middleware for session details
app.use((req, res, next) => {
    console.log("Session Details:", req.session); // Log the session details
    next();
});

// CSRF protection middleware
app.use(csurf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    }
}));

// Rate limiter middleware
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/', authRoutes);
app.use('/api/protected', protectedRoutes);

// CSRF token route
app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Custom error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
