import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Star, Plus, Minus, Calendar, Clock, Tag } from 'lucide-react';

const MovieCard = ({ movie, onWatchlistToggle, isInWatchlist }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (e) => {
    // Prevent navigation if clicking the watchlist toggle button
    if (e.target.closest('button')) return;
    
    // Navigate to movie page with current location information
    navigate(`/movie/${movie.imdbID}`, {
      state: { from: location.pathname }
    });
  };

  return (
    <motion.div 
      onClick={handleClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-lg border border-gray-700/50 hover:border-red-500/50 transition-all duration-500 hover:shadow-xl hover:shadow-red-500/10"
    >
      <div className="flex flex-col md:flex-row gap-6 p-6 cursor-pointer">
        <div className="relative">
          <img 
            src={movie.Poster !== 'N/A' ? movie.Poster : '/api/placeholder/200/300'}
            alt={movie.Title}
            className="w-full md:w-[200px] h-[300px] object-cover rounded-lg shadow-lg transform group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
            <span className="text-sm font-medium">{movie.imdbRating || 'N/A'}</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-4 flex-1">
          <div>
            <h2 className="text-2xl font-bold mb-2 group-hover:text-red-500 transition-colors duration-300">
              {movie.Title}
            </h2>
            <div className="flex flex-wrap gap-3 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{movie.Year}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{movie.Runtime}</span>
              </div>
              <div className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                <span>{movie.Genre}</span>
              </div>
            </div>
          </div>
          
          <p className="text-gray-300 line-clamp-3">{movie.Plot}</p>
          
          <div className="mt-auto">
            <button 
              onClick={() => onWatchlistToggle(movie)}
              className={`inline-flex items-center hover:cursor-pointer gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isInWatchlist 
                  ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {isInWatchlist ? (
                <><Minus className="w-4 h-4" /> Remove from Watchlist</>
              ) : (
                <><Plus className="w-4 h-4" /> Add to Watchlist</>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MovieCard;