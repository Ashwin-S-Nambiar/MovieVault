import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

const Toast = ({ message, type = 'success' }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 50, scale: 0.9 }}
    className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 ${
      type === 'error' ? 'bg-red-500' : 'bg-[#00C9A7]'
    } text-white px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 z-50 max-w-md`}
    style={{ fontFamily: 'var(--font-sans)' }}
  >
    {type === 'error' ? (
      <XCircle className="w-5 h-5 shrink-0" />
    ) : (
      <CheckCircle className="w-5 h-5 shrink-0" />
    )}
    <span className="font-medium">{message}</span>
  </motion.div>
);

export default Toast;
