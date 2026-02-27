const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./src/routes/api.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow all origins for flexibility during development
app.use(morgan('dev')); // Request logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', apiRoutes);

// Catch-all route for any unhandled API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: 'API endpoint not found',
  });
});

// Fallback to serving the frontend's index.html for any non-API routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Frontend accessible at http://localhost:${PORT}`);
  console.log(`API accessible at http://localhost:${PORT}/api`);
});
