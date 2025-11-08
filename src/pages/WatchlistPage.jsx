import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Search, ListFilter, Grid3x3, List } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState('grid');

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
    <main className="bg-[#1A1F2B]">
      {/* Header Section */}
      {watchlist.length > 0 && (
      <section className="bg-linear-to-b from-[#242938] to-[#1A1F2B] py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto"
          >
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h1)', lineHeight: 'var(--lh-h1)' }} className="font-semibold text-white mb-4">
              My Watchlist
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-body)' }} className="text-[#9CA3AF]">
              {watchlist.length === 0 
                ? "Your personal collection of movies to watch"
                : `You have ${watchlist.length} ${watchlist.length === 1 ? 'movie' : 'movies'} saved`
              }
            </p>
          </motion.div>
        </div>
      </section>
    )}

      {/* Controls Section */}
      {watchlist.length > 0 && (
        <section className="border-b border-white/5 bg-[#1A1F2B]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Count & Sort */}
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2 text-[#9CA3AF]">
                  <ListFilter className="w-5 h-5" />
                  <span style={{ fontFamily: 'var(--font-sans)' }} className="text-sm">
                    {watchlist.length} {watchlist.length === 1 ? 'movie' : 'movies'}
                  </span>
                </div>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ fontFamily: 'var(--font-sans)' }}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-[#242938] border border-white/10 text-white focus:outline-none focus:border-[#FF6B6B]/50 transition-colors duration-300 text-sm"
                >
                  <option value="date-added">Date Added</option>
                  <option value="title">Title (A-Z)</option>
                  <option value="rating">Rating (High-Low)</option>
                  <option value="year">Year (Newest)</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-[#242938] rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-[#FF6B6B] text-white' 
                      : 'text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-[#FF6B6B] text-white' 
                      : 'text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Content Section */}
      <section>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {watchlist.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-8 py-16 text-center"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#FF6B6B]/20 blur-3xl rounded-full" />
                    <Film className="relative w-32 h-32 text-[#FF6B6B]/40" strokeWidth={1.5} />
                  </div>
                </motion.div>
                
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h2)' }} className="font-semibold text-white mb-3">
                    Your Watchlist is Empty
                  </h2>
                  <p style={{ fontFamily: 'var(--font-sans)' }} className="text-[#9CA3AF] max-w-md mx-auto mb-8">
                    Start building your collection! Search for movies and add them to your watchlist to keep track of what you want to watch.
                  </p>
                </div>
                
                <Link 
                  to="/"
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-[#FF6B6B] hover:bg-[#FF5252] text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-[#FF6B6B]/30 hover:shadow-xl hover:shadow-[#FF6B6B]/40"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  <Search className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  Discover Movies
                </Link>
              </motion.div>
            ) : (
              <motion.div 
                key="watchlist"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-6"
                }
              >
                {getSortedWatchlist().map((movie, index) => (
                  <motion.div
                    key={movie.imdbID}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <MovieCard 
                      movie={movie}
                      onWatchlistToggle={handleRemoveFromWatchlist}
                      isInWatchlist={true}
                    />
                  </motion.div>
                ))}
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

export default WatchlistPage;