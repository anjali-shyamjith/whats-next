const express = require('express');
const router = express.Router();
const { sendResponse } = require('../utils/response');
const { discoverContent } = require('../services/tmdb.service');

// GET /api/suggestions?type=movie&mood=dark&duration=short&page=1&limit=20
router.get('/', async (req, res) => {
  try {
    const { type, genre, rating, page, limit, sort_by, mood, duration, country, language } = req.query;

    const requestedType = type || 'movie';
    const validTypes = ['movie', 'tv', 'anime', 'documentary'];
    if (!validTypes.includes(requestedType)) {
      return sendResponse(
        res,
        400,
        false,
        null,
        "Invalid 'type' parameter. Must be one of: movie, tv, anime, documentary."
      );
    }

    const discoverParams = {
      type: requestedType,
      genre,
      rating,
      sort_by,
      mood,
      duration,
      country,
      language,
    };

    const suggestions = await discoverContent(
      discoverParams,
      parseInt(page) || 1,
      parseInt(limit) || 20
    );

    return sendResponse(res, 200, true, suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error.message);
    return sendResponse(
      res,
      500,
      false,
      null,
      'Failed to fetch suggestions from TMDB'
    );
  }
});

module.exports = router;
