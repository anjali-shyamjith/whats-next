const express = require('express');
const router = express.Router();
const suggestionRoutes = require('./suggestion.routes');
const configRoutes = require('./config.routes');
const genreRoutes = require('./genre.routes');
const metadataRoutes = require('./metadata.routes');
const searchRoutes = require('./search.routes');
const recommendationsRoutes = require('./recommendations.routes');

// Mount sub-routers
router.use('/suggestions', suggestionRoutes);
router.use('/config', configRoutes);
router.use('/genres', genreRoutes);
router.use('/metadata', metadataRoutes);
router.use('/search', searchRoutes);
router.use('/recommendations', recommendationsRoutes);

module.exports = router;
