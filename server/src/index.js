require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const gameRoutes = require('./routes/gameRoutes');
const { setupSocketHandlers } = require('./sockets/socketHandler');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// CORS configuration for both Express and Socket.IO
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    
    // In development or if explicitly matched
    if (
      process.env.NODE_ENV !== 'production' ||
      origin === CLIENT_URL ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com') ||
      origin.endsWith('.railway.app')
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for production game hosting
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'QuizPulse Server',
    time: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/games', gameRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Centralized error handling
app.use((err, req, res, next) => {
  console.error('[Express Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Setup Socket.IO
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Initialize socket handlers
setupSocketHandlers(io);

// Start server after DB connection
connectDB().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`🚀 QuizPulse Server running on port ${PORT}`);
    console.log(`📡 Socket.IO server ready for real-time traffic`);
    console.log(`🌐 Allowed Client URL: ${CLIENT_URL}`);
    console.log(`===============================================`);
  });
});
