import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Pencil,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import Toast  from '../components/Toast';
import { getMovieDetails, convertTmdbToOmdbFormat } from '../utils/tmdbApi';

const MoviePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
        const tmdbMovie = await getMovieDetails(id);
        const formattedMovie = convertTmdbToOmdbFormat(tmdbMovie, true);
        setMovie(formattedMovie);
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
        <div className="w-16 h-16 border-4 border-[#FF6B6B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[#9CA3AF]">Movie not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1F2B]">
      {/* Hero Section with Backdrop */}
      <div className="relative min-h-[70vh] overflow-hidden">
        {/* Backdrop Image */}
        <div className="absolute inset-0">
          <img
            src={movie.Poster !== 'N/A' ? movie.Poster : '/api/placeholder/1920/1080'}
            alt={movie.Title}
            className="w-full h-full object-cover blur-2xl scale-110 opacity-20"
          />
          <div className="absolute inset-0 bg-linear-to-b from-[#1A1F2B]/50 via-[#1A1F2B]/80 to-[#1A1F2B]" />
        </div>

        {/* Content */}
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="cursor-pointer inline-flex items-center gap-2 text-[#9CA3AF] hover:text-white transition-colors duration-300 mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span style={{ fontFamily: 'var(--font-sans)' }} className="text-sm font-medium">Back</span>
          </button>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Poster */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="shrink-0"
            >
              <img
                src={movie.Poster !== 'N/A' ? movie.Poster : '/api/placeholder/400/600'}
                alt={movie.Title}
                className="w-full lg:w-80 rounded-2xl shadow-2xl border border-white/10"
              />
            </motion.div>

            {/* Movie Info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 flex flex-col"
            >
              {/* Title & Year */}
              <div className="mb-6">
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h1)', lineHeight: 'var(--lh-h1)' }} className="font-semibold text-white mb-3">
                  {movie.Title}
                </h1>
                {movie.Tagline && movie.Tagline !== 'N/A' && (
                  <p style={{ fontFamily: 'var(--font-sans)' }} className="text-lg text-[#9CA3AF] italic flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF6B6B]" />
                    {movie.Tagline}
                  </p>
                )}
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 mb-6">
                {movie.imdbRating && movie.imdbRating !== 'N/A' && (
                  <div className="flex items-center gap-2 bg-[#242938] px-4 py-2 rounded-lg border border-white/5">
                    <Star className="w-5 h-5 text-[#FFD700]" fill="currentColor" />
                    <span style={{ fontFamily: 'var(--font-sans)' }} className="font-semibold text-white">{movie.imdbRating}</span>
                    <span className="text-[#6B7280]">/10</span>
                  </div>
                )}
                {movie.Year && (
                  <div className="flex items-center gap-2 bg-[#242938] px-4 py-2 rounded-lg border border-white/5">
                    <Calendar className="w-4 h-4 text-[#9CA3AF]" />
                    <span style={{ fontFamily: 'var(--font-sans)' }} className="text-[#F5F6FA]">{movie.Year}</span>
                  </div>
                )}
                {movie.Runtime && movie.Runtime !== 'N/A' && (
                  <div className="flex items-center gap-2 bg-[#242938] px-4 py-2 rounded-lg border border-white/5">
                    <Clock className="w-4 h-4 text-[#9CA3AF]" />
                    <span style={{ fontFamily: 'var(--font-sans)' }} className="text-[#F5F6FA]">{movie.Runtime}</span>
                  </div>
                )}
              </div>

              {/* Genres */}
              {movie.Genre && movie.Genre !== 'N/A' && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {movie.Genre.split(',').map((genre, index) => (
                    <span 
                      key={index}
                      style={{ fontFamily: 'var(--font-sans)' }}
                      className="px-3 py-1.5 text-sm font-medium bg-[#FF6B6B]/10 text-[#FF6B6B] rounded-lg border border-[#FF6B6B]/20"
                    >
                      {genre.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* Plot */}
              {movie.Plot && movie.Plot !== 'N/A' && (
                <div className="mb-8">
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)' }} className="font-semibold text-white mb-3">
                    Overview
                  </h2>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-body)' }} className="text-[#9CA3AF]">
                    {movie.Plot}
                  </p>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-auto">
                <motion.button 
                  onClick={handleWatchlistToggle}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`cursor-pointer inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg ${
                    isInWatchlist 
                      ? 'bg-[#242938] text-[#FF6B6B] border-2 border-[#FF6B6B] hover:bg-[#FF6B6B]/10' 
                      : 'bg-[#FF6B6B] text-white hover:bg-[#FF5252] shadow-[#FF6B6B]/30'
                  }`}
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {isInWatchlist ? (
                    <><Minus className="w-5 h-5" /> Remove from Watchlist</>
                  ) : (
                    <><Plus className="w-5 h-5" /> Add to Watchlist</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Detailed Information Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cast & Crew */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#242938] rounded-2xl p-6 border border-white/5"
            >
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)' }} className="font-semibold text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#FF6B6B]" />
                Cast & Crew
              </h2>
              <div className="space-y-4">
                {movie.Actors && movie.Actors !== 'N/A' && (
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-sans)' }} className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
                      Cast
                    </h3>
                    <p style={{ fontFamily: 'var(--font-sans)' }} className="text-white">
                      {movie.Actors}
                    </p>
                  </div>
                )}
                {movie.Director && movie.Director !== 'N/A' && (
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-sans)' }} className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Pencil className="w-4 h-4" />
                      Director
                    </h3>
                    <p style={{ fontFamily: 'var(--font-sans)' }} className="text-white">
                      {movie.Director}
                    </p>
                  </div>
                )}
                {movie.Writer && movie.Writer !== 'N/A' && (
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-sans)' }} className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
                      Writer
                    </h3>
                    <p style={{ fontFamily: 'var(--font-sans)' }} className="text-white">
                      {movie.Writer}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Additional Info */}
            <div className="bg-[#242938] rounded-2xl p-6 border border-white/5 space-y-4">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)' }} className="font-semibold text-white mb-4">
                Details
              </h3>
              
              {movie.Language && movie.Language !== 'N/A' && (
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-[#FF6B6B] mt-0.5 shrink-0" />
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-sans)' }} className="text-sm font-semibold text-[#9CA3AF] mb-1">
                      Language
                    </h4>
                    <p style={{ fontFamily: 'var(--font-sans)' }} className="text-white">
                      {movie.Language}
                    </p>
                  </div>
                </div>
              )}
              
              {movie.Country && movie.Country !== 'N/A' && (
                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-[#FF6B6B] mt-0.5 shrink-0" />
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-sans)' }} className="text-sm font-semibold text-[#9CA3AF] mb-1">
                      Country
                    </h4>
                    <p style={{ fontFamily: 'var(--font-sans)' }} className="text-white">
                      {movie.Country}
                    </p>
                  </div>
                </div>
              )}
              
              {movie.Awards && movie.Awards !== 'N/A' && (
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-[#FF6B6B] mt-0.5 shrink-0" />
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-sans)' }} className="text-sm font-semibold text-[#9CA3AF] mb-1">
                      Awards
                    </h4>
                    <p style={{ fontFamily: 'var(--font-sans)' }} className="text-white">
                      {movie.Awards}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Ratings */}
            {movie.Ratings && movie.Ratings.length > 0 && (
              <div className="bg-[#242938] rounded-2xl p-6 border border-white/5">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)' }} className="font-semibold text-white mb-4">
                  Ratings
                </h3>
                <div className="space-y-3">
                  {movie.Ratings.map((rating, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span style={{ fontFamily: 'var(--font-sans)' }} className="text-[#9CA3AF] text-sm">
                        {rating.Source}
                      </span>
                      <span style={{ fontFamily: 'var(--font-sans)' }} className="font-semibold text-white">
                        {rating.Value}
                      </span>
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