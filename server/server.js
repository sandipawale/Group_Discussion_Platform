const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const { initScheduler } = require('./utils/scheduler');
const { setIO } = require('./utils/socketManager');

require('dotenv').config();

// ─── Fail fast if critical env vars are missing ────────────
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
    process.stdout.write(`\n❌ STARTUP FAILED — missing required env vars: ${missing.join(', ')}\n`);
    process.stdout.write('Set them in the Render dashboard under Environment.\n\n');
    process.exit(1);
}

const authRoutes = require('./routes/auth');
const slotRoutes = require('./routes/slots');
const roomRoutes = require('./routes/rooms');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');
const feedbackRoutes = require('./routes/feedback');

const app = express();
const server = http.createServer(app);

// Socket.IO for real-time admin alerts
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
    },
});

// Make io accessible to routes
app.set('io', io);
setIO(io);

// ─── Middleware ─────────────────────────────────────────────
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ─── Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Global Error Handler ──────────────────────────────────
app.use((err, req, res, next) => {
    console.error('❌ Unhandled Error:', err.message);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

// ─── Socket.IO Connections ─────────────────────────────────
io.on('connection', (socket) => {
    socket.on('join-admin', () => socket.join('admin-room'));
    socket.on('disconnect', () => {});
});

// ─── Connect DB & Start Server ─────────────────────────────
const PORT = process.env.PORT || 5000;

console.log(`⏳ Connecting to MongoDB...`);
console.log(`   NODE_ENV : ${process.env.NODE_ENV}`);
console.log(`   PORT     : ${PORT}`);
console.log(`   MONGO_URI: ${process.env.MONGO_URI ? process.env.MONGO_URI.replace(/:\/\/[^@]+@/, '://<credentials>@') : 'NOT SET'}`);

mongoose
    .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
    .then(() => {
        console.log('✅ MongoDB connected');
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            initScheduler();
        });
    })
    .catch((err) => {
        console.error(`❌ MongoDB connection error: ${err.message}`);
        process.exit(1);
    });
