const express = require('express');
const router = express.Router();
const { sendResponse } = require('../utils/response');
const { getMediaDetail } = require('../services/tmdb.service');

// GET /api/details/:type/:id
// :type  -> 'movie' or 'tv'
// :id    -> TMDB numeric ID
router.get('/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;

    const validTypes = ['movie', 'tv'];
    if (!validTypes.includes(type)) {
      return sendResponse(
        res,
        400,
        false,
        null,
        "Invalid 'type' parameter. Must be 'movie' or 'tv'."
      );
    }

    if (!id || isNaN(Number(id))) {
      return sendResponse(res, 400, false, null, "A valid numeric 'id' is required.");
    }

    const detail = await getMediaDetail(type, id);
    return sendResponse(res, 200, true, detail);
  } catch (error) {
    const status = error.response?.status;
    if (status === 404) {
      return sendResponse(res, 404, false, null, 'Media item not found on TMDB.');
    }
    console.error('Error fetching media details:', error.message);
    return sendResponse(res, 500, false, null, 'Failed to fetch media details from TMDB');
  }
});

module.exports = router;
