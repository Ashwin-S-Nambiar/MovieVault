import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Star, Plus, Minus, Calendar } from 'lucide-react';

const MovieCard = ({ movie, onWatchlistToggle, isInWatchlist }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (e) => {
    // Prevent navigation if clicking the watchlist toggle button
    if (e.target.closest('button')) return;
    
    navigate(`/movie/${movie.imdbID}`, {
      state: { from: location.pathname }
    });
  };

  return (
    <motion.div 
      onClick={handleClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-lg bg-[#242938] border border-white/5 hover:border-[#FF6B6B]/30 transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg hover:shadow-[#FF6B6B]/10"
    >
      {/* Movie Poster */}
      <div className="relative aspect-2/3 overflow-hidden bg-[#1A1F2B]">
        <img 
          src={movie.Poster !== 'N/A' ? movie.Poster : '/api/placeholder/400/600'}
          alt={movie.Title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Rating Badge */}
        {movie.imdbRating && movie.imdbRating !== 'N/A' && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 shadow-lg">
            <Star className="w-3 h-3 text-[#FFD700]" fill="currentColor" />
            <span style={{ fontFamily: 'var(--font-sans)' }} className="text-xs font-semibold text-white">
              {movie.imdbRating}
            </span>
          </div>
        )}

        {/* Quick Action Button - Shows on Hover */}
        <motion.button 
          onClick={() => onWatchlistToggle(movie)}
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`absolute bottom-2 right-2 p-2 rounded-full backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 ${
            isInWatchlist 
              ? 'bg-[#FF6B6B]/90 text-white hover:bg-[#FF6B6B]' 
              : 'bg-white/90 text-[#1A1F2B] hover:bg-white'
          }`}
        >
          {isInWatchlist ? (
            <Minus className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </motion.button>
      </div>
      
      {/* Movie Info */}
      <div className="p-2.5">
        <h3 style={{ fontFamily: 'var(--font-display)' }} className="text-sm font-semibold text-white mb-1.5 line-clamp-1 group-hover:text-[#FF6B6B] transition-colors duration-300">
          {movie.Title}
        </h3>
        
        <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
          {movie.Year && (
            <span style={{ fontFamily: 'var(--font-sans)' }}>{movie.Year}</span>
          )}
          {movie.Runtime && movie.Runtime !== 'N/A' && (
            <>
              <span>•</span>
              <span style={{ fontFamily: 'var(--font-sans)' }}>{movie.Runtime}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MovieCard;