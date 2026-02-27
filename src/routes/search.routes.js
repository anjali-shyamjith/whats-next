const express = require('express');
const router = express.Router();
const { sendResponse } = require('../utils/response');
const { searchMedia } = require('../services/tmdb.service');

// GET /api/search?query=spiderman&page=1
router.get('/', async (req, res) => {
  try {
    const { query, page } = req.query;

    if (!query) {
      return sendResponse(res, 400, false, null, "Query parameter 'query' is required.");
    }

    const data = await searchMedia(query, page || 1);
    return sendResponse(res, 200, true, data);
  } catch (error) {
    console.error('Error searching media:', error.message);
    return sendResponse(res, 500, false, null, 'Failed to perform search');
  }
});

module.exports = router;
