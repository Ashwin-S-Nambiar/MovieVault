import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star,
  Plus,
  Minus,
  Calendar,
  Clock,
  Tag,
  Users,
  Award,
  Globe,
  PlayCircle,
  Pencil
} from 'lucide-react';
import Toast  from '../components/Toast';

const MoviePage = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem('movie-watchlist');
    return saved ? JSON.parse(saved) : [];
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const response = await fetch(`https://www.omdbapi.com/?apikey=e631858d&i=${id}&plot=full`);
        const data = await response.json();
        setMovie(data);
      } catch (error) {
        console.error('Error fetching movie details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [id]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleWatchlistToggle = () => {
    const isInWatchlist = watchlist.some(m => m.imdbID === movie.imdbID);
    if (isInWatchlist) {
      const newWatchlist = watchlist.filter(m => m.imdbID !== movie.imdbID);
      setWatchlist(newWatchlist);
      localStorage.setItem('movie-watchlist', JSON.stringify(newWatchlist));
      showToast('Removed from watchlist');
    } else {
      const newWatchlist = [...watchlist, movie];
      setWatchlist(newWatchlist);
      localStorage.setItem('movie-watchlist', JSON.stringify(newWatchlist));
      showToast('Added to watchlist');
    }
  };

  const isInWatchlist = movie && watchlist.some(m => m.imdbID === movie.imdbID);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section with Backdrop */}
      <div className="relative h-[60vh] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center blur-sm"
          style={{
            backgroundImage: `url(${movie.Poster !== 'N/A' ? movie.Poster : '/api/placeholder/1920/1080'})`,
            opacity: 0.3
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 via-gray-900/80 to-gray-900" />

        {/* Movie Basic Info */}
        <div className="relative h-full container mx-auto px-4 flex items-end pb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row gap-8 items-start"
          >
            {/* Poster */}
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={movie.Poster !== 'N/A' ? movie.Poster : '/api/placeholder/300/450'}
              alt={movie.Title}
              className="-mt-5 w-64 rounded-xl shadow-2xl shadow-red-500/10 border-2 border-gray-700/50"
            />

            {/* Basic Info */}
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {movie.Title}
              </h1>
              <div className="flex flex-col flex-wrap gap-4 text-gray-300 mb-6">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
                  <span>{movie.imdbRating}/10</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{movie.Year}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{movie.Runtime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  <span>{movie.Genre}</span>
                </div>
              </div>

              <button 
                onClick={handleWatchlistToggle}
                className={`inline-flex hover:cursor-pointer items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  isInWatchlist 
                    ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {isInWatchlist ? (
                  <><Minus className="w-5 h-5" /> Remove from Watchlist</>
                ) : (
                  <><Plus className="w-5 h-5" /> Add to Watchlist</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Detailed Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Plot */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-xl"
            >
              <h2 className="text-xl font-bold mb-4">Plot</h2>
              <p className="text-gray-300 leading-relaxed">{movie.Plot}</p>
            </motion.div>

            {/* Cast & Crew */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-xl"
            >
              <h2 className="text-xl font-bold mb-4">Cast & Crew</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <Users className="w-5 h-5 text-red-500 mt-1" />
                  <div>
                    <h3 className="font-medium">Cast</h3>
                    <p className="text-gray-300">{movie.Actors}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Pencil className="w-5 h-5 text-red-500 mt-1" />
                  <div>
                    <h3 className="font-medium">Director</h3>
                    <p className="text-gray-300">{movie.Director}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <PlayCircle className="w-5 h-5 text-red-500 mt-1" />
                  <div>
                    <h3 className="font-medium">Writer</h3>
                    <p className="text-gray-300">{movie.Writer}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Side Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Additional Info */}
            <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="font-medium">Language</h3>
                  <p className="text-gray-300">{movie.Language}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="font-medium">Awards</h3>
                  <p className="text-gray-300">{movie.Awards}</p>
                </div>
              </div>
            </div>

            {/* Ratings */}
            {movie.Ratings && movie.Ratings.length > 0 && (
              <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-xl">
                <h2 className="text-xl font-bold mb-4">Ratings</h2>
                <div className="space-y-4">
                  {movie.Ratings.map((rating, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-300">{rating.Source}</span>
                      <span className="font-medium">{rating.Value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {toast.show && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
};

export default MoviePage;