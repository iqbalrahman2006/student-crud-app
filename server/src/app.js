require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

// Import routes
const studentsRouter = require('./routes/students');

// Start express app
const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// ROUTES
app.use('/api/v1/students', studentsRouter);
app.use('/api/v1/library', require('./routes/library'));

// Root Handler for API Check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Student DB API is running' });
});

// SCHEDULER
try {
  const { initScheduler } = require('./utils/scheduler');
  initScheduler();
} catch (e) {
  console.warn("Scheduler failed to start:", e.message);
}

// Health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.all('*', (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  err.status = 'fail';
  err.statusCode = 404;
  next(err);
});

// Global Error Handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  console.error('ERROR 💥:', err);

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;