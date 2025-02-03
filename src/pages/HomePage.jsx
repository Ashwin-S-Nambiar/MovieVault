import React, { useState, useEffect, useRef } from 'react';
import { Film, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from 'use-debounce';
import Toast from '../components/Toast';
import SearchDropdown from '../components/SearchDropdown';
import MovieCard from '../components/MovieCard';

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
        const response = await fetch(`https://www.omdbapi.com/?apikey=e631858d&s=${debouncedSearch}`);
        const data = await response.json();
        
        if (data.Response === "True") {
          setSearchResults(data.Search.slice(0, 5));
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error(error);
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
      const response = await fetch(`https://www.omdbapi.com/?apikey=e631858d&i=${movie.imdbID}`);
      const detailedMovie = await response.json();
      
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
    <main className="container mx-auto px-4">
      <div ref={searchRef} className="relative w-full max-w-2xl mx-auto mb-12">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setDropdownVisible(true);
            }}
            onFocus={() => setDropdownVisible(true)}
            placeholder="Search for movies..."
            className="w-full px-6 py-4 pl-12 rounded-xl bg-gray-800/50 border border-gray-700/50 focus:border-red-500/50 text-gray-100 placeholder-gray-500 focus:outline-none transition-all duration-300 backdrop-blur-xl"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500 animate-spin" />
          )}
        </div>
        
        <SearchDropdown
          results={searchResults}
          loading={loading}
          onSelect={handleMovieSelect}
          visible={dropdownVisible && (loading || searchResults.length > 0)}
        />
      </div>

      <div className="space-y-6">
        <AnimatePresence>
          {selectedMovies.length === 0 && !loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 py-6"
            >
              <Film className="w-24 h-24 text-red-500/50" />
              <h2 className="text-2xl font-medium text-gray-400">
                Start exploring amazing films!
              </h2>
              <p className="text-gray-500 text-center max-w-md">
                Search for your favorite movies above and build your perfect watchlist.
              </p>
            </motion.div>
          )}

          {selectedMovies.map((movie) => (
            <MovieCard 
              key={movie.imdbID}
              movie={movie}
              onWatchlistToggle={handleWatchlistToggle}
              isInWatchlist={watchlist.some(m => m.imdbID === movie.imdbID)}
            />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {toast.show && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </main>
  );
};

export default HomePage;