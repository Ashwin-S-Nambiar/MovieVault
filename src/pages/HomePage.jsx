import { useState, useEffect, useRef } from 'react';
import { Film, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from 'use-debounce';
import Toast from '../components/Toast';
import SearchDropdown from '../components/SearchDropdown';
import MovieCard from '../components/MovieCard';
import { searchMovies, getMovieDetails, convertTmdbToOmdbFormat } from '../utils/tmdbApi';

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const searchRef = useRef(null);
  
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem('movie-watchlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setDropdownVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!debouncedSearch.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await searchMovies(debouncedSearch);
        
        if (data.results && data.results.length > 0) {
          const formattedResults = data.results
            .slice(0, 5)
            .map(movie => convertTmdbToOmdbFormat(movie));
          setSearchResults(formattedResults);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error(error);
        showToast('Failed to search movies', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [debouncedSearch]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleMovieSelect = async (movie) => {
    setLoading(true);
    try {
      const tmdbDetails = await getMovieDetails(movie.imdbID);
      const detailedMovie = convertTmdbToOmdbFormat(tmdbDetails, true);
      
      setSelectedMovies(prev => [detailedMovie, ...prev]);
      setSearchTerm('');
      setDropdownVisible(false);
    } catch (error) {
      console.error(error);
      showToast('Failed to fetch movie details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWatchlistToggle = (movie) => {
    const isInWatchlist = watchlist.some(m => m.imdbID === movie.imdbID);
    if (isInWatchlist) {
      const newWatchlist = watchlist.filter(m => m.imdbID !== movie.imdbID);
      setWatchlist(newWatchlist);
      localStorage.setItem('movie-watchlist', JSON.stringify(newWatchlist));
      showToast('Movie removed from watchlist');
    } else {
      const newWatchlist = [...watchlist, movie];
      setWatchlist(newWatchlist);
      localStorage.setItem('movie-watchlist', JSON.stringify(newWatchlist));
      showToast('Added to watchlist');
    }
  };

  return (
    <main>
      {/* Hero Section with Search */}
      <section className="relative bg-linear-to-b from-[#242938] to-[#1A1F2B] py-10 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <span style={{ fontFamily: 'var(--font-sans)' }} className="text-sm font-medium text-[#9CA3AF] uppercase tracking-wider">
                Discover Your Next Favorite
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h1)', lineHeight: 'var(--lh-h1)' }} className="font-semibold text-white mb-6">
              Find Your Next Movie
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-body)' }} className="text-[#9CA3AF] max-w-2xl mx-auto">
              Search and explore thousands of movies. Build your perfect watchlist and never forget what you want to watch.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div 
            ref={searchRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative w-full max-w-3xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setDropdownVisible(true);
                }}
                onFocus={() => setDropdownVisible(true)}
                placeholder="Search for movies..."
                style={{ fontFamily: 'var(--font-sans)' }}
                className="w-full px-6 py-5 pl-14 pr-14 rounded-2xl bg-[#2D3446] border border-white/10 focus:border-[#FF6B6B]/50 text-white placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/20 transition-all duration-300 text-lg shadow-xl"
              />
              {loading && (
                <Loader2 className="absolute right-6 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#FF6B6B] animate-spin" />
              )}
            </div>
            
            <SearchDropdown
              results={searchResults}
              loading={loading}
              onSelect={handleMovieSelect}
              visible={dropdownVisible && (loading || searchResults.length > 0)}
            />
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <section>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {selectedMovies.length === 0 && !loading ? (
          <></>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {selectedMovies.length > 0 && (
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h2)' }} className="font-semibold text-white mb-8">
                    Search Results
                  </h2>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {selectedMovies.map((movie) => (
                    <MovieCard 
                      key={movie.imdbID}
                      movie={movie}
                      onWatchlistToggle={handleWatchlistToggle}
                      isInWatchlist={watchlist.some(m => m.imdbID === movie.imdbID)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <AnimatePresence>
        {toast.show && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </main>
  );
};

export default HomePage;