const express = require('express');
const router = express.Router();
const { sendResponse } = require('../utils/response');
const { getAggregatedRecommendations } = require('../services/tmdb.service');

// POST /api/recommendations
// Body expects: { "items": [{ id: 123, type: 'movie' }, { id: 456, type: 'tv' }] }
// Query params: ?page=1&limit=20
router.post('/', async (req, res) => {
  try {
    const { items } = req.body;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendResponse(
        res,
        400,
        false,
        null,
        "An array of 'items' is required in the request body."
      );
    }

    if (items.length > 5) {
      return sendResponse(
        res,
        400,
        false,
        null,
        "Maximum of 5 items allowed for recommendations."
      );
    }

    // Basic validation of item structure
    for (const item of items) {
      if (!item.id || !item.type) {
        return sendResponse(
          res,
          400,
          false,
          null,
          "Each item must contain an 'id' and 'type' (e.g., 'movie' or 'tv')."
        );
      }
    }

    const recommendations = await getAggregatedRecommendations(items, page, limit);
    
    return sendResponse(res, 200, true, recommendations);
  } catch (error) {
    console.error('Error fetching aggregated recommendations:', error.message);
    return sendResponse(
      res,
      500,
      false,
      null,
      'Failed to fetch recommendations from TMDB'
    );
  }
});

module.exports = router;
