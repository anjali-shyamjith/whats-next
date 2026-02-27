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
 * Fetches list of available languages.
 */
const getLanguages = async () => {
  const client = getTmdbClient();
  const response = await client.get('/configuration/languages');
  return response.data;
};

/**
 * Fetches list of available countries.
 */
const getCountries = async () => {
  const client = getTmdbClient();
  const response = await client.get('/configuration/countries');
  return response.data;
};

/**
 * Maps frontend mood strings to TMDB genres/keywords.
 */
const getMoodModifiers = (mood) => {
  const moodMap = {
    happy: { genres: '35,10751' }, // Comedy, Family
    dark: { genres: '53,27,80' }, // Thriller, Horror, Crime
    relaxing: { genres: '10749' }, // Romance (and slice of life)
    exciting: { genres: '28,12' }, // Action, Adventure
    thoughtful: { genres: '18,36' }, // Drama, History
  };
  return moodMap[mood.toLowerCase()] || {};
};

/**
 * Maps duration strings to runtime brackets (in minutes).
 */
const getDurationModifiers = (duration) => {
  const durationMap = {
    short: { lte: 90 },
    medium: { gte: 90, lte: 120 },
    long: { gte: 120 },
  };
  return durationMap[duration.toLowerCase()];
};

/**
 * Discovers content based on filters.
 *
 * @param {Object} queryParams
 */
const discoverContent = async (params) => {
  const client = getTmdbClient();
  const { type, genre, rating, page, sort_by, mood, duration, country, language } = params;

  let endpoint = '/discover/movie'; // default
  let queryOptions = {
    page: page || 1,
    sort_by: sort_by || 'popularity.desc',
  };

  // 1. Apply basic filters
  if (genre) {
    queryOptions.with_genres = genre;
  }
  if (rating) {
    queryOptions['vote_average.gte'] = rating;
  }

  // 2. Apply advanced filters
  if (mood) {
    const moodMods = getMoodModifiers(mood);
    if (moodMods.genres) {
      // Append to existing genres if any, else set
      queryOptions.with_genres = queryOptions.with_genres 
        ? `${queryOptions.with_genres},${moodMods.genres}`
        : moodMods.genres;
    }
  }

  if (duration) {
    const durationMods = getDurationModifiers(duration);
    if (durationMods) {
      if (durationMods.lte) queryOptions['with_runtime.lte'] = durationMods.lte;
      if (durationMods.gte) queryOptions['with_runtime.gte'] = durationMods.gte;
    }
  }

  if (country) {
    queryOptions.with_origin_country = country;
  }

  if (language) {
    queryOptions.with_original_language = language;
  }

  // 3. Apply type-specific overrides
  if (type === 'tv') {
    endpoint = '/discover/tv';
  } else if (type === 'anime') {
    endpoint = '/discover/tv';
    queryOptions.with_genres = queryOptions.with_genres ? `${queryOptions.with_genres},16` : '16'; // 16 is Animation genre for TV
    // Fallback/override to Japanese if not explicitly set by the language filter
    queryOptions.with_original_language = queryOptions.with_original_language || 'ja'; 
  } else if (type === 'documentary') {
    endpoint = '/discover/movie';
    queryOptions.with_genres = queryOptions.with_genres ? `${queryOptions.with_genres},99` : '99'; // 99 is Documentary genre for movies
  }
  
  const response = await client.get(endpoint, { params: queryOptions });
  return response.data;
};

module.exports = {
  getConfig,
  getGenres,
  getLanguages,
  getCountries,
  discoverContent,
};
