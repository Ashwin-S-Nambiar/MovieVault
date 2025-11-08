import { Link, useLocation, Outlet } from 'react-router-dom';
import { Film, Bookmark, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import ApiStatusIndicator from './components/ApiStatusIndicator';

const Layout = () => {
  const location = useLocation();
  const isWatchlist = location.pathname === '/watchlist';
  const [watchlistCount, setWatchlistCount] = useState(0);

  useEffect(() => {
    const updateWatchlistCount = () => {
      const saved = localStorage.getItem('movie-watchlist');
      const watchlist = saved ? JSON.parse(saved) : [];
      setWatchlistCount(watchlist.length);
    };

    updateWatchlistCount();
    window.addEventListener('storage', updateWatchlistCount);
    
    // Poll for changes since localStorage events don't fire in same tab
    const interval = setInterval(updateWatchlistCount, 500);
    
    return () => {
      window.removeEventListener('storage', updateWatchlistCount);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#1A1F2B] text-[#F5F6FA] flex flex-col">
      <ApiStatusIndicator />
      
      {/* Minimal Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1A1F2B]/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <Link 
              to="/"
              className="flex items-center gap-2 group"
            >
              <Film className="w-6 h-6 text-[#FF6B6B] transition-transform duration-300 group-hover:scale-110" />
              <span style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-semibold text-white">
                MovieVault
              </span>
            </Link>
            
            {/* Navigation Links */}
            <div className="flex items-center gap-4">
              <Link 
                to="/"
                className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  !isWatchlist
                    ? 'text-[#FF6B6B] bg-[#FF6B6B]/10'
                    : 'text-[#9CA3AF] hover:text-white hover:bg-white/5'
                }`}
              >
                <Search className="w-4 h-4" />
                <span style={{ fontFamily: 'var(--font-sans)' }} className="text-sm font-medium">Search</span>
              </Link>
              
              <Link 
                to="/watchlist"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 relative ${
                  isWatchlist
                    ? 'text-[#FF6B6B] bg-[#FF6B6B]/10'
                    : 'text-[#9CA3AF] hover:text-white hover:bg-white/5'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span style={{ fontFamily: 'var(--font-sans)' }} className="text-sm font-medium">Watchlist</span>
                {watchlistCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-[#FF6B6B] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    {watchlistCount > 99 ? '99+' : watchlistCount}
                  </motion.span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="pt-16 grow">
        <Outlet />
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-white/5">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-[#9CA3AF]">
            &copy; {new Date().getFullYear()} All Rights Reserved,{' '}
            <a 
              className="text-[#FF6B6B] hover:text-[#FF5252] transition-colors duration-300 font-medium" 
              href="https://ashwin.co.in"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ashwin S Nambiar
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;