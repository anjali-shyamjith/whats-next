const express = require('express');
const router = express.Router();
const suggestionRoutes = require('./suggestion.routes');
const configRoutes = require('./config.routes');
const genreRoutes = require('./genre.routes');

// Mount sub-routers
router.use('/suggestions', suggestionRoutes);
router.use('/config', configRoutes);
router.use('/genres', genreRoutes);

module.exports = router;
