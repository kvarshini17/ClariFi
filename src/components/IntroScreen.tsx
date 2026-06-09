import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface IntroScreenProps {
  onComplete: () => void;
}

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const { t } = useTranslation();

  useEffect(() => {
    // Automatically transition out after 4 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
      className="fixed inset-0 z-[9999] bg-zinc-950 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Grid Background Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.2] pointer-events-none" 
        style={{ 
          backgroundImage: `linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} 
      />
      
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [0.8, 1.2, 1],
            x: [0, 30, 0],
            y: [0, 20, 0],
            opacity: [0, 0.4, 0.2] 
          }}
          transition={{ duration: 4, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-accent/30 blur-[100px] rounded-full"
        />
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [0.8, 1, 1.2],
            x: [0, -40, 0],
            y: [0, -30, 0],
            opacity: [0, 0.3, 0.15] 
          }}
          transition={{ duration: 4, ease: "easeInOut", delay: 0.2 }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/30 blur-[120px] rounded-full"
        />
      </div>

      {/* Floating Currency Icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['$', '€', '£', '¥', '?'].map((symbol, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 80 + 10 + '%', 
              y: '120%',
              opacity: 0,
              rotate: Math.random() * 90 - 45
            }}
            animate={{ 
              y: '-20%',
              opacity: [0, 0.6, 0],
              rotate: Math.random() * 180 - 90
            }}
            transition={{ 
              duration: 3 + Math.random() * 2, 
              ease: "easeOut",
              delay: Math.random() * 0.5 
            }}
            className="absolute text-accent/40 text-6xl font-serif select-none"
          >
            {symbol}
          </motion.div>
        ))}
      </div>

      {/* Central Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.div
          animate={{ rotateY: 360 }}
          transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
          className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/50 mb-8"
        >
          <Wallet className="text-white w-12 h-12" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/20 text-emerald-300 text-sm font-bold uppercase tracking-[0.2em] backdrop-blur-md mb-6"
        >
          <Sparkles size={16} className="animate-pulse" />
          {t('app.intelligent_wealth') || 'Intelligent Wealth'}
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="text-5xl sm:text-7xl font-black tracking-tighter text-white"
        >
          ClariFi
        </motion.h1>
      </motion.div>
    </motion.div>
  );
}
