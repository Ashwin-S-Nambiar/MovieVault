import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronRight } from 'lucide-react';

const SearchDropdown = ({ results, loading, onSelect, visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-full left-0 right-0 mt-2 bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700/50 max-h-[400px] overflow-y-auto z-50 
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-track]:bg-gray-800/50
          [&::-webkit-scrollbar-track]:rounded-r-xl
          [&::-webkit-scrollbar-thumb]:bg-gray-600
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:border-2
          [&::-webkit-scrollbar-thumb]:border-gray-800/50
          [&::-webkit-scrollbar-thumb:hover]:bg-gray-500
          hover:[&::-webkit-scrollbar-thumb]:bg-gray-500
          scrollbar-thin
          scrollbar-track-gray-800/50
          scrollbar-thumb-gray-600"
      >
        {loading ? (
          <div className="p-4 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-500" />
          </div>
        ) : results.length > 0 ? (
          <div className="p-2">
            {results.map((movie) => (
              <button
                key={movie.imdbID}
                onClick={() => onSelect(movie)}
                className="w-full p-2 flex items-center gap-3 hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
              >
                <img 
                  src={movie.Poster !== 'N/A' ? movie.Poster : '/api/placeholder/50/75'}
                  alt={movie.Title}
                  className="w-12 h-16 object-cover rounded-md"
                />
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-gray-200">{movie.Title}</h3>
                  <p className="text-sm text-gray-400">{movie.Year}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-400">
            No results found
          </div>
        )}
      </motion.div>
    )}
  </AnimatePresence>
);

export default SearchDropdown;