import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SearchDropdown = ({ results, loading, visible }) => {
  const navigate = useNavigate();

  const handleSelect = (movie) => {
    navigate(`/movie/${movie.imdbID}`);
  };

  return (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-full left-0 right-0 mt-2 bg-[#2D3446] backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 z-50 overflow-hidden"
        style={{
          maxHeight: 'min(60vh, 380px)',
        }}
      >
        <div 
          className="overflow-y-auto max-h-full search-dropdown-content"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 107, 107, 0.5) rgba(45, 52, 70, 0.5)'
          }}
        >
          {loading ? (
            <div className="p-4 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#FF6B6B]" />
            </div>
          ) : results.length > 0 ? (
            <div className="p-1.5">
              {results.map((movie) => (
                <button
                  key={movie.imdbID}
                  onClick={() => handleSelect(movie)}
                  className="cursor-pointer w-full p-1 flex items-center gap-2 hover:bg-white/5 rounded-lg transition-colors duration-200 group"
                >
                  <img 
                    src={movie.Poster !== 'N/A' ? movie.Poster : '/api/placeholder/50/75'}
                    alt={movie.Title}
                    className="w-10 h-14 object-cover rounded-md shadow-md shrink-0"
                  />
                  <div className="flex-1 text-left min-w-0">
                    <h3 style={{ fontFamily: 'var(--font-sans)' }} className="font-semibold text-white text-sm truncate group-hover:text-[#FF6B6B] transition-colors">
                      {movie.Title}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-sans)' }} className="text-xs text-[#9CA3AF]">
                      {movie.Year}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#FF6B6B] transition-colors shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p style={{ fontFamily: 'var(--font-sans)' }} className="text-sm text-[#9CA3AF]">
                No results found
              </p>
            </div>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
  );
};

export default SearchDropdown;