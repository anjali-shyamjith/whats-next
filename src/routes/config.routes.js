const express = require('express');
const router = express.Router();
const { sendResponse } = require('../utils/response');
const { getConfig } = require('../services/tmdb.service');

// GET /api/config
router.get('/', async (req, res) => {
  try {
    const configData = await getConfig();
    return sendResponse(res, 200, true, configData);
  } catch (error) {
    console.error('Error fetching TMDB config:', error.message);
    return sendResponse(
      res,
      500,
      false,
      null,
      'Failed to fetch configuration from TMDB'
    );
  }
});

module.exports = router;
