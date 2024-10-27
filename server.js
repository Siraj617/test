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
const { Server } = require('socket.io');
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

app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ['Content-Type'],
}));

app.use(cookieParser());

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
        cookie: {
            secure: false,
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'Lax' : 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,  // 1 week
        },
    })
);

// Logging middleware for session details
app.use((req, res, next) => {
    console.log("Session Details:", req.session);
    next();
});

// Rate limiter middleware
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
