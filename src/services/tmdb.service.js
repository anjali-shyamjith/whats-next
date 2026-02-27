const axios = require('axios');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

/**
 * Creates an Axios instance with base URL and default params.
 */
const getTmdbClient = () => {
  if (!API_KEY) {
    console.warn('WARNING: TMDB_API_KEY is not set in environment variables.');
  }
  return axios.create({
    baseURL: TMDB_BASE_URL,
    params: {
      api_key: process.env.TMDB_API_KEY,
    },
  });
};

/**
 * Fetches TMDB configuration data (like image base URLs).
 */
const getConfig = async () => {
  const client = getTmdbClient();
  const response = await client.get('/configuration');
  return response.data;
};

/**
 * Fetches list of genres.
 *
 * @param {string} type - 'movie' or 'tv'
 */
const getGenres = async (type = 'movie') => {
  const client = getTmdbClient();
  // Valid types for genre fetching are 'movie' and 'tv'
  const targetType = type === 'tv' ? 'tv' : 'movie';
  const response = await client.get(`/genre/${targetType}/list`);
  return response.data;
};

/**
 * Discovers content based on filters.
 *
 * @param {Object} queryParams
 */
const discoverContent = async (params) => {
  const client = getTmdbClient();
  const { type, genre, rating, page, sort_by } = params;

  let endpoint = '/discover/movie'; // default
  let queryOptions = {
    page: page || 1,
    sort_by: sort_by || 'popularity.desc',
  };

  if (genre) {
    queryOptions.with_genres = genre;
  }
  if (rating) {
    queryOptions['vote_average.gte'] = rating;
  }

  if (type === 'tv') {
    endpoint = '/discover/tv';
  } else if (type === 'anime') {
    endpoint = '/discover/tv';
    queryOptions.with_genres = genre ? `${genre},16` : '16'; // 16 is Animation genre for TV
    queryOptions.with_original_language = 'ja'; // Japanese original language
  } else if (type === 'documentary') {
    endpoint = '/discover/movie';
    queryOptions.with_genres = genre ? `${genre},99` : '99'; // 99 is Documentary genre for movies
  }
  
  const response = await client.get(endpoint, { params: queryOptions });
  return response.data;
};

module.exports = {
  getConfig,
  getGenres,
  discoverContent,
};
