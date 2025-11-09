import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Search, SortAsc, Trash2 } from 'lucide-react';
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
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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

  const handleClearWatchlist = () => {
    setWatchlist([]);
    localStorage.setItem('movie-watchlist', JSON.stringify([]));
    setShowClearConfirm(false);
    showToast('Watchlist cleared');
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
      {/* Compact Header Section */}
      {watchlist.length > 0 && (
        <section className="bg-linear-to-b from-[#242938] to-[#1A1F2B] py-8 border-b border-white/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-4"
            >
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h2)', lineHeight: 'var(--lh-h2)' }} className="font-semibold text-white mb-1">
                  My Watchlist
                </h1>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-label)' }} className="text-[#9CA3AF]">
                  {watchlist.length} {watchlist.length === 1 ? 'movie' : 'movies'} saved
                </p>
              </div>
              
              {/* Clear All Button */}
              <button
                onClick={() => setShowClearConfirm(true)}
                className="cursor-pointer group flex items-center gap-2 px-4 py-2 bg-[#242938] hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 text-[#9CA3AF] hover:text-red-400 rounded-lg transition-all duration-300 text-sm font-medium"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </motion.div>
          </div>
        </section>
      )}

      {/* Compact Controls Section */}
      {watchlist.length > 0 && (
        <section className="sticky top-0 z-10 bg-[#1A1F2B]/95 backdrop-blur-md border-b border-white/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2">
              {/* Sort Dropdown */}
              <SortAsc className="w-4 h-4 text-[#9CA3AF]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ fontFamily: 'var(--font-sans)' }}
                className="px-3 py-1.5 rounded-lg bg-[#242938] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6B6B]/50 transition-colors duration-300 cursor-pointer hover:border-white/20"
              >
                <option value="date-added">Date Added</option>
                <option value="title">Title (A-Z)</option>
                <option value="rating">Rating</option>
                <option value="year">Year</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {/* Content Section */}
      <section className="py-2">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {watchlist.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-6 py-20 text-center"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#FF6B6B]/20 blur-3xl rounded-full" />
                    <Film className="relative w-24 h-24 text-[#FF6B6B]/40" strokeWidth={1.5} />
                  </div>
                </motion.div>
                
                <div className="max-w-md">
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h2)' }} className="font-semibold text-white mb-2">
                    Your Watchlist is Empty
                  </h2>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)' }} className="text-[#9CA3AF] mb-6">
                    Start building your collection! Search for movies and add them to your watchlist.
                  </p>
                </div>
                
                <Link 
                  to="/"
                  className="group inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B6B] hover:bg-[#FF5252] text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-[#FF6B6B]/30 hover:shadow-xl hover:shadow-[#FF6B6B]/40 hover:scale-105"
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
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4"
              >
                {getSortedWatchlist().map((movie, index) => (
                  <motion.div
                    key={movie.imdbID}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03 }}
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

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setShowClearConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#242938] border border-white/10 rounded-xl p-6 shadow-2xl max-w-md w-full mx-4"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-red-500/10 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)' }} className="font-semibold text-white mb-2">
                    Clear Watchlist?
                  </h3>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-label)' }} className="text-[#9CA3AF]">
                    Are you sure you want to remove all {watchlist.length} movies from your watchlist? This action cannot be undone.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="cursor-pointer px-4 py-2 bg-[#1A1F2B] hover:bg-[#2D3446] text-white rounded-lg transition-colors duration-300 text-sm font-medium"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearWatchlist}
                  className="cursor-pointer px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-300 text-sm font-medium"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast.show && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </main>
  );
};

export default WatchlistPage;