import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Search, ListFilter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Toast  from '../components/Toast';
import MovieCard from '../components/MovieCard';

const WatchlistPage = () => {
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem('movie-watchlist');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [sortBy, setSortBy] = useState('date-added');

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleRemoveFromWatchlist = (movie) => {
    const newWatchlist = watchlist.filter(m => m.imdbID !== movie.imdbID);
    setWatchlist(newWatchlist);
    localStorage.setItem('movie-watchlist', JSON.stringify(newWatchlist));
    showToast('Removed from watchlist');
  };

  const getSortedWatchlist = () => {
    switch (sortBy) {
      case 'title':
        return [...watchlist].sort((a, b) => a.Title.localeCompare(b.Title));
      case 'rating':
        return [...watchlist].sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0));
      case 'year':
        return [...watchlist].sort((a, b) => b.Year - a.Year);
      default:
        return watchlist;
    }
  };

  return (
    <main className="container mx-auto px-4">
      {watchlist.length > 0 && (
        <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <ListFilter className="w-5 h-5" />
            <span>{watchlist.length} {watchlist.length === 1 ? 'movie' : 'movies'} in watchlist</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-100 focus:outline-none focus:border-red-500/50 transition-colors duration-300"
          >
            <option value="date-added">Sort by: Date Added</option>
            <option value="title">Sort by: Title</option>
            <option value="rating">Sort by: Rating</option>
            <option value="year">Sort by: Year</option>
          </select>
        </div>
      )}

      <div className="space-y-6">
        <AnimatePresence>
          {watchlist.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 py-6"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                <Film className="w-32 h-32 text-red-500/30" />
              </motion.div>
              <h2 className="text-3xl font-medium text-gray-400 text-center">
                Your Watchlist is Empty
              </h2>
              <p className="text-gray-500 text-center max-w-md">
                Start exploring and add movies you want to watch later!
              </p>
              <Link 
                to="/"
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-all duration-300 flex items-center gap-2 hover:scale-105"
              >
                <Search className="w-5 h-5" />
                Discover Movies
              </Link>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 gap-6"
            >
              {getSortedWatchlist().map((movie) => (
                <MovieCard 
                  key={movie.imdbID}
                  movie={movie}
                  onWatchlistToggle={handleRemoveFromWatchlist}
                  isInWatchlist={true}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {toast.show && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </main>
  );
};

export default WatchlistPage;