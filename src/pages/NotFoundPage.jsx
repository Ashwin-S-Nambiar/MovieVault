import { Link } from 'react-router-dom';
import { AlertOctagon } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1A1F2B] text-gray-100 px-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center"
      >
        <AlertOctagon className="w-24 h-24 text-red-500/50 mb-6" />
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-gray-400 mb-6 max-w-md">
          Oops! The page you’re looking for doesn’t exist. It might have been moved or deleted.
        </p>
        <Link 
          to="/" 
          className="px-6 py-3 rounded-lg bg-red-500 text-white text-lg font-medium hover:-translate-y-2 hover:bg-red-600 transition-all duration-300"
        >
          Go Back Home
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;