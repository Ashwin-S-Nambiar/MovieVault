import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Film, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const Layout = () => {
  const location = useLocation();
  const isWatchlist = location.pathname === '/watchlist';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <header className="relative h-[40vh] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/0 via-gray-900/50 to-gray-900" />
        
        <nav className="absolute top-0 left-0 right-0 p-6">
          <div className="container mx-auto flex justify-between items-center">
            <Link 
              to="/"
              className="text-2xl font-bold text-white hover:text-red-500 transition-colors duration-300 flex items-center gap-2"
            >
              <Film className="w-6 h-6" />
              MovieVault
            </Link>
            
            <Link 
              to={isWatchlist ? "/" : "/watchlist"}
              className={`px-4 py-2 rounded-lg z-10 hover:-translate-y-2 transition-all duration-300 flex items-center gap-2 ${
                isWatchlist
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-800/50 hover:bg-gray-700/50 outline backdrop-blur-sm'
              }`}
            >
              {isWatchlist ? (
                <>
                  <Search className="w-4 h-4" />
                  Search Movies
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  My Watchlist
                </>
              )}
            </Link>
          </div>
        </nav>
        
        <div className="relative h-full flex flex-col items-center justify-center px-4">
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {isWatchlist ? "My Watchlist" : "Discover Amazing Films"}
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              {isWatchlist 
                ? "Keep track of all the movies you want to watch" 
                : "Search and explore thousands of movies to add to your collection"
              }
            </p>
          </motion.div>
        </div>
      </header>

      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-gray-900 to-transparent pointer-events-none" />
        <Outlet />
      </div>

      <footer className="mt-0 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>All Rights Reserved, Ashwin.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;