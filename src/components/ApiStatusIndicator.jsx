import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkApiStatus } from '../utils/tmdbApi';

const ApiStatusIndicator = () => {
  const [apiStatus, setApiStatus] = useState('checking');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const isUp = await checkApiStatus();
        setApiStatus(isUp ? 'up' : 'down');
      } catch {
        setApiStatus('down');
      }
    };

    checkStatus();
    
    // Check API status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = () => {
    switch (apiStatus) {
      case 'up':
        return {
          color: 'bg-green-500',
          text: 'TMDB API is Up',
          textColor: 'text-green-400',
          borderColor: 'border-green-500/20'
        };
      case 'down':
        return {
          color: 'bg-red-500',
          text: 'TMDB API is Down',
          textColor: 'text-red-400',
          borderColor: 'border-red-500/20'
        };
      default:
        return {
          color: 'bg-yellow-500',
          text: 'Checking API...',
          textColor: 'text-yellow-400',
          borderColor: 'border-yellow-500/20'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-60 px-4 py-2 rounded-full backdrop-blur-md bg-gray-900/90 border ${config.borderColor} shadow-lg`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${config.color} ${apiStatus === 'up' ? 'animate-pulse' : ''}`} />
            <span className={`text-sm font-medium ${config.textColor}`}>
              {config.text}
            </span>
            <button
              onClick={() => setIsVisible(false)}
              className="cursor-pointer ml-2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ApiStatusIndicator; 