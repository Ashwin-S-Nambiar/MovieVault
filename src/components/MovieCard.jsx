import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Star, Plus, Minus, Calendar, Clock } from 'lucide-react';

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
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-xl bg-[#242938] border border-white/5 hover:border-[#FF6B6B]/30 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-[#FF6B6B]/10"
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
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg">
            <Star className="w-4 h-4 text-[#FFD700]" fill="currentColor" />
            <span style={{ fontFamily: 'var(--font-sans)' }} className="text-sm font-semibold text-white">
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
          className={`absolute bottom-3 right-3 p-3 rounded-full backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 ${
            isInWatchlist 
              ? 'bg-[#FF6B6B]/90 text-white hover:bg-[#FF6B6B]' 
              : 'bg-white/90 text-[#1A1F2B] hover:bg-white'
          }`}
        >
          {isInWatchlist ? (
            <Minus className="w-5 h-5" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </motion.button>
      </div>
      
      {/* Movie Info */}
      <div className="p-4">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)' }} className="font-semibold text-white mb-2 line-clamp-1 group-hover:text-[#FF6B6B] transition-colors duration-300">
          {movie.Title}
        </h3>
        
        <div className="flex flex-wrap items-center gap-3 text-sm text-[#9CA3AF] mb-3">
          {movie.Year && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span style={{ fontFamily: 'var(--font-sans)' }}>{movie.Year}</span>
            </div>
          )}
          {movie.Runtime && movie.Runtime !== 'N/A' && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span style={{ fontFamily: 'var(--font-sans)' }}>{movie.Runtime}</span>
            </div>
          )}
        </div>

        {/* Genre Tags */}
        {movie.Genre && movie.Genre !== 'N/A' && (
          <div className="flex flex-wrap gap-2">
            {movie.Genre.split(',').slice(0, 2).map((genre, index) => (
              <span 
                key={index}
                style={{ fontFamily: 'var(--font-sans)' }}
                className="px-2 py-1 text-xs font-medium bg-[#FF6B6B]/10 text-[#FF6B6B] rounded-md"
              >
                {genre.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Watchlist Status Indicator */}
      {isInWatchlist && (
        <div className="absolute top-3 left-3">
          <div className="bg-[#FF6B6B] text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
            <span style={{ fontFamily: 'var(--font-sans)' }}>In Watchlist</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MovieCard;