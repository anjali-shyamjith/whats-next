const express = require('express');
const router = express.Router();
const { sendResponse } = require('../utils/response');
const { getGenres } = require('../services/tmdb.service');

// GET /api/genres?type=(movie|tv)
router.get('/', async (req, res) => {
  try {
    const { type } = req.query; // 'movie' or 'tv'
    
    // Default to downloading both if type isn't specifically provided
    // For simplicity, if a generic request is made, we fetch 'movie' genres
    // The frontend dev can specify `?type=tv` if they need TV genres specifically
    const genreData = await getGenres(type || 'movie');
    
    return sendResponse(res, 200, true, genreData);
  } catch (error) {
    console.error('Error fetching genres:', error.message);
    return sendResponse(res, 500, false, null, 'Failed to fetch genres from TMDB');
  }
});

module.exports = router;
