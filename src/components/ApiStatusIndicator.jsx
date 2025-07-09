import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ApiStatusIndicator = () => {
  const [apiStatus, setApiStatus] = useState('checking');
  const [isVisible, setIsVisible] = useState(true);
  
  const API_KEY = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=test`, {
          method: 'GET',
          timeout: 5000
        });
        
        if (response.ok) {
          const data = await response.json();
          // Check if API returned valid response structure
          if (data.Response !== undefined) {
            setApiStatus('up');
          } else {
            setApiStatus('down');
          }
        } else {
          setApiStatus('down');
        }
      } catch {
        setApiStatus('down');
      }
    };

    checkApiStatus();
    
    // Check API status every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);
    
    return () => clearInterval(interval);
  }, [API_KEY]);

  const getStatusConfig = () => {
    switch (apiStatus) {
      case 'up':
        return {
          color: 'bg-green-500',
          text: 'OMDB API is Up',
          textColor: 'text-green-400',
          borderColor: 'border-green-500/20'
        };
      case 'down':
        return {
          color: 'bg-red-500',
          text: 'OMDB API is Down',
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
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-full backdrop-blur-md bg-gray-900/80 border ${config.borderColor} shadow-lg`}
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