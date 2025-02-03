import React from 'react';
import { motion } from 'framer-motion';
import { X, Award } from 'lucide-react';

const Toast = ({ message, type = 'success' }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 ${
      type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
    } text-white px-6 py-3 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-2`}
  >
    {type === 'error' ? <X className="w-4 h-4" /> : <Award className="w-4 h-4" />}
    {message}
  </motion.div>
);

export default Toast;
