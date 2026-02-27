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
 * Fetches multiple pages from TMDB, sorts by rating, caps at 50, and returns paginated results.
 *
 * @param {Object} params - Filter and pagination params
 * @param {number} page   - The page number for the frontend paginator (default 1)
 * @param {number} limit  - Results per page (default 20)
 */
const discoverContent = async (params, page = 1, limit = 20) => {
  const client = getTmdbClient();
  const { type, genre, rating, sort_by, mood, duration, country, language } = params;

  let endpoint = '/discover/movie'; // default
  let queryOptions = {
    // Always sort by rating for the results page
    sort_by: sort_by || 'vote_average.desc',
    // Require a minimum vote count so low-vote obscure entries don't flood top results
    'vote_count.gte': 50,
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
    queryOptions.with_genres = queryOptions.with_genres ? `${queryOptions.with_genres},16` : '16';
    queryOptions.with_original_language = queryOptions.with_original_language || 'ja';
  } else if (type === 'documentary') {
    endpoint = '/discover/movie';
    queryOptions.with_genres = queryOptions.with_genres ? `${queryOptions.with_genres},99` : '99';
  }

  // 4. Fetch 3 pages from TMDB to build a pool of up to ~60 results,
  //    which we then trim and re-paginate client-side for the top-50 guarantee.
  const pageRequests = [1, 2, 3].map(p =>
    client.get(endpoint, { params: { ...queryOptions, page: p } }).catch(() => null)
  );

  const responses = await Promise.all(pageRequests);
  let allResults = responses
    .filter(Boolean)
    .flatMap(res => res.data.results || []);

  // 5. Deduplicate by TMDB id
  const seen = new Set();
  allResults = allResults.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  // 6. Sort by vote_average descending (highest rated first)
  allResults.sort((a, b) => b.vote_average - a.vote_average);

  // 7. Cap at top 50
  const top50 = allResults.slice(0, 50);

  // 8. Paginate the top-50 pool
  const totalResults = top50.length;
  const totalPages = Math.ceil(totalResults / limit);
  const validPage = Math.max(1, Math.min(page, totalPages || 1));
  const start = (validPage - 1) * limit;

  return {
    page: validPage,
    results: top50.slice(start, start + limit),
    total_pages: totalPages,
    total_results: totalResults,
  };
};

/**
 * Searches for movies and TV shows using TMDB multi-search.
 *
 * @param {string} query - The search string
 * @param {number} page - Page number
 */
const searchMedia = async (query, page = 1) => {
  const client = getTmdbClient();
  const response = await client.get('/search/multi', {
    params: {
      query,
      page,
      include_adult: false,
    },
  });
  
  // Filter out 'person' results from multi-search as we only want media
  const mediaResults = response.data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
  
  return {
    ...response.data,
    results: mediaResults,
  };
};

/**
 * Takes up to 5 TMDB media items, fetches individual recommendations, and aggregates them.
 *
 * @param {Array} items - Array of objects like { id: 123, type: 'movie' }
 * @param {number} page - The page number to fetch (defaults to 1)
 * @param {number} limit - The number of results per page (defaults to 20)
 */
const getAggregatedRecommendations = async (items, page = 1, limit = 20) => {
  const client = getTmdbClient();

  // 1. Fetch recommendations for each individual item concurrently
  const fetchPromises = items.map(async (item) => {
    try {
      // TMDB native recommendations endpoint: /movie/{id}/recommendations or /tv/{id}/recommendations
      const type = item.type === 'tv' ? 'tv' : 'movie';
      // Fetch more pages from TMDB to ensure we have enough unique pool items
      // (TMDB returns 20 per page, fetching page 1 and 2 normally provides enough unique IDs)
      const res1 = client.get(`/${type}/${item.id}/recommendations`, { params: { page: 1 } });
      const res2 = client.get(`/${type}/${item.id}/recommendations`, { params: { page: 2 } });
      
      const [data1, data2] = await Promise.all([res1, res2]);
      
      return [...(data1.data.results || []), ...(data2.data.results || [])];
    } catch (error) {
      console.warn(`Failed to fetch recommendations for ${item.type} ${item.id}`);
      return [];
    }
  });

  const resultsArrays = await Promise.all(fetchPromises);

  // 2. Flatten the arrays and keep track of frequencies & deduplicate
  const frequencyMap = new Map();

  resultsArrays.flat().forEach(media => {
    // Only process valid movie/tv responses
    if (!media.id) return;
    
    // Create a unique key using type and id to handle ID collisions between movies/tv
    const mediaType = media.media_type || (media.title ? 'movie' : 'tv');
    const uniqueKey = `${mediaType}_${media.id}`;

    // Filter out the items that were passed as input (we don't want to recommend what they just selected)
    if (items.some(inputItem => inputItem.id === media.id)) {
      return;
    }

    if (frequencyMap.has(uniqueKey)) {
      const existing = frequencyMap.get(uniqueKey);
      existing.score += 1; // Appears in multiple source recommendations
    } else {
      frequencyMap.set(uniqueKey, {
        ...media,
        media_type: mediaType,
        score: 1,
      });
    }
  });

  // 3. Sort by 'score' (how many selected items recommended this), then fall back to TMDB popularity
  let sortedRecommendations = Array.from(frequencyMap.values()).sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.popularity - a.popularity;
  });

  // Cap top results at 50, per requirements
  sortedRecommendations = sortedRecommendations.slice(0, 50);

  // 4. Handle pagination of the final top-50 array
  const totalResults = sortedRecommendations.length;
  const totalPages = Math.ceil(totalResults / limit);
  
  // Ensure valid page bounds
  const validPage = Math.max(1, Math.min(page, totalPages || 1));
  const startIndex = (validPage - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedResults = sortedRecommendations.slice(startIndex, endIndex);

  return {
    page: validPage,
    results: paginatedResults,
    total_pages: totalPages,
    total_results: totalResults
  };
};

/**
 * Fetches full detail for a single movie or TV item.
 * Returns a normalized object ready for the detail page:
 *   poster_url, title, synopsis, rating, plus the raw TMDB data.
 *
 * @param {'movie'|'tv'} type
 * @param {number|string} id
 */
const getMediaDetail = async (type, id) => {
  const client = getTmdbClient();
  const endpoint = type === 'tv' ? `/tv/${id}` : `/movie/${id}`;

  const response = await client.get(endpoint);
  const raw = response.data;

  // Build a normalised shape for the frontend detail page
  const detail = {
    id: raw.id,
    media_type: type,
    // Title: movies use 'title', TV uses 'name'
    title: raw.title || raw.name,
    original_title: raw.original_title || raw.original_name,
    // Synopsis
    synopsis: raw.overview,
    // Poster – full URL using the standard TMDB image base
    poster_path: raw.poster_path,
    poster_url: raw.poster_path
      ? `https://image.tmdb.org/t/p/w500${raw.poster_path}`
      : null,
    // Rating
    rating: raw.vote_average,
    vote_count: raw.vote_count,
    // Release info
    release_date: raw.release_date || raw.first_air_date,
    // Genres array [{id, name}]
    genres: raw.genres || [],
    // Runtime (minutes for movies, episode_run_time[0] for TV)
    runtime: raw.runtime || (raw.episode_run_time && raw.episode_run_time[0]) || null,
    // Language / country
    original_language: raw.original_language,
    origin_country: raw.origin_country || [],
    // Status (Released, Ended, etc.)
    status: raw.status,
    // Raw TMDB data for any additional fields the frontend may need
    _raw: raw,
  };

  return detail;
};

module.exports = {
  getConfig,
  getGenres,
  getLanguages,
  getCountries,
  discoverContent,
  searchMedia,
  getAggregatedRecommendations,
  getMediaDetail,
};
