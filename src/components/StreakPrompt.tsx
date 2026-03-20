import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface StreakPromptProps {
  streakCount: number;
  onClose: () => void;
  onAddTransaction: () => void;
}

export default function StreakPrompt({ streakCount, onClose, onAddTransaction }: StreakPromptProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1] 
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -top-24 -left-24 w-64 h-64 bg-orange-500/20 blur-[80px] rounded-full"
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.15, 0.1] 
          }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full"
        />
      </div>

      <div className="relative z-10 p-8 sm:p-12 text-center space-y-10">
        <div className="relative inline-block">
          {/* Particle Effects */}
          <AnimatePresence>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  x: (Math.random() - 0.5) * 100,
                  y: (Math.random() - 0.5) * 100,
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  delay: i * 0.3,
                  ease: "easeOut"
                }}
                className="absolute top-1/2 left-1/2 text-orange-500/40"
              >
                <Sparkles size={16} />
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 12 }}
            className="relative z-10"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-28 h-28 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[32px] flex items-center justify-center shadow-[0_20px_50px_rgba(249,115,22,0.3)] border border-white/20"
            >
              <Flame className="text-white" size={56} />
            </motion.div>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute -top-3 -right-3 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white w-12 h-12 rounded-full flex items-center justify-center font-black text-xl border-4 border-zinc-900 dark:border-white/10 shadow-2xl transition-colors"
            >
              {streakCount}
            </motion.div>
          </motion.div>
        </div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter leading-tight transition-colors">
              You're on <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                Fire!
              </span>
            </h2>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-zinc-500 dark:text-zinc-400 text-lg font-medium max-w-xs mx-auto transition-colors"
          >
            That's <span className="text-zinc-900 dark:text-white font-black">{streakCount} days</span> in a row. 
            Did you receive or spend any money today?
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddTransaction}
            className="group relative px-8 py-5 bg-emerald-500 text-zinc-950 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3 overflow-hidden shadow-[0_10px_30px_rgba(16,185,129,0.3)]"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            <CheckCircle2 size={24} />
            Record Transaction
          </motion.button>
          <button
            onClick={onClose}
            className="px-8 py-4 text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold text-sm uppercase tracking-[0.2em] transition-all"
          >
            Nothing to report today
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">
          <AlertCircle size={12} />
          Consistency is the key to wealth
        </div>
      </div>
    </div>
  );
}
