const express = require('express');
const router = express.Router();
const { sendResponse } = require('../utils/response');
const { getLanguages, getCountries } = require('../services/tmdb.service');

// GET /api/metadata/languages
router.get('/languages', async (req, res) => {
  try {
    const data = await getLanguages();
    // Sort alphabetically for frontend convenience
    const sorted = data.sort((a, b) => a.english_name.localeCompare(b.english_name));
    return sendResponse(res, 200, true, sorted);
  } catch (error) {
    console.error('Error fetching languages:', error.message);
    return sendResponse(res, 500, false, null, 'Failed to fetch languages');
  }
});

// GET /api/metadata/countries
router.get('/countries', async (req, res) => {
  try {
    const data = await getCountries();
    // Sort alphabetically for frontend convenience
    const sorted = data.sort((a, b) => a.english_name.localeCompare(b.english_name));
    return sendResponse(res, 200, true, sorted);
  } catch (error) {
    console.error('Error fetching countries:', error.message);
    return sendResponse(res, 500, false, null, 'Failed to fetch countries');
  }
});

module.exports = router;
