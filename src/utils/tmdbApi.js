// TMDB API Configuration and Helper Functions
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Image sizes available from TMDB
export const IMAGE_SIZES = {
  poster: {
    small: 'w185',
    medium: 'w342',
    large: 'w500',
    original: 'original'
  },
  backdrop: {
    small: 'w300',
    medium: 'w780',
    large: 'w1280',
    original: 'original'
  }
};

/**
 * Get full image URL for TMDB images
 * @param {string} path - Image path from TMDB API response
 * @param {string} size - Size from IMAGE_SIZES
 * @returns {string} Full image URL
 */
export const getImageUrl = (path, size = IMAGE_SIZES.poster.medium) => {
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

/**
 * Search for movies by title
 * @param {string} query - Search query
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<Object>} Search results
 */
export const searchMovies = async (query, page = 1) => {
  const response = await fetch(
    `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`
  );
  
  if (!response.ok) {
    throw new Error('Failed to search movies');
  }
  
  return await response.json();
};

/**
 * Get detailed movie information by ID
 * @param {number} movieId - TMDB movie ID
 * @returns {Promise<Object>} Movie details
 */
export const getMovieDetails = async (movieId) => {
  const response = await fetch(
    `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch movie details');
  }
  
  return await response.json();
};

/**
 * Convert TMDB movie object to match OMDB structure
 * This helps minimize changes to existing components
 * @param {Object} tmdbMovie - Movie object from TMDB API
 * @param {boolean} isDetailed - Whether this is from movie details endpoint
 * @returns {Object} Movie object in OMDB-like format
 */
export const convertTmdbToOmdbFormat = (tmdbMovie, isDetailed = false) => {
  if (!tmdbMovie) return null;

  const baseMovie = {
    Title: tmdbMovie.title || tmdbMovie.original_title,
    Year: tmdbMovie.release_date ? tmdbMovie.release_date.split('-')[0] : 'N/A',
    imdbID: tmdbMovie.id?.toString(), // Using TMDB ID as identifier
    Type: 'movie',
    Poster: getImageUrl(tmdbMovie.poster_path, IMAGE_SIZES.poster.medium),
  };

  if (isDetailed) {
    // For detailed movie information
    const director = tmdbMovie.credits?.crew?.find(person => person.job === 'Director');
    const writers = tmdbMovie.credits?.crew?.filter(person => 
      person.job === 'Writer' || person.job === 'Screenplay' || person.job === 'Story'
    ).slice(0, 3);
    const actors = tmdbMovie.credits?.cast?.slice(0, 5);

    return {
      ...baseMovie,
      Rated: tmdbMovie.adult ? 'R' : 'PG-13', // TMDB doesn't provide exact rating
      Released: tmdbMovie.release_date || 'N/A',
      Runtime: tmdbMovie.runtime ? `${tmdbMovie.runtime} min` : 'N/A',
      Genre: tmdbMovie.genres?.map(g => g.name).join(', ') || 'N/A',
      Director: director?.name || 'N/A',
      Writer: writers?.map(w => w.name).join(', ') || 'N/A',
      Actors: actors?.map(a => a.name).join(', ') || 'N/A',
      Plot: tmdbMovie.overview || 'No plot available.',
      Language: tmdbMovie.original_language?.toUpperCase() || 'N/A',
      Country: tmdbMovie.production_countries?.map(c => c.name).join(', ') || 'N/A',
      Awards: 'N/A', // TMDB doesn't provide this directly
      imdbRating: tmdbMovie.vote_average ? tmdbMovie.vote_average.toFixed(1) : 'N/A',
      imdbVotes: tmdbMovie.vote_count?.toLocaleString() || 'N/A',
      Ratings: [
        {
          Source: 'TMDB',
          Value: tmdbMovie.vote_average ? `${tmdbMovie.vote_average.toFixed(1)}/10` : 'N/A'
        }
      ],
      Metascore: 'N/A', // Not available in TMDB
      Type: 'movie',
      DVD: 'N/A',
      BoxOffice: tmdbMovie.revenue ? `$${(tmdbMovie.revenue / 1000000).toFixed(1)}M` : 'N/A',
      Production: tmdbMovie.production_companies?.map(c => c.name).join(', ') || 'N/A',
      Website: tmdbMovie.homepage || 'N/A',
      Response: 'True'
    };
  }

  return baseMovie;
};

/**
 * Check if TMDB API is accessible
 * @returns {Promise<boolean>} API status
 */
export const checkApiStatus = async () => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=1`
    );
    return response.ok;
  } catch {
    return false;
  }
};
