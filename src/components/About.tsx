import React from 'react';
import { Info, Sparkles, Shield, Zap, Target, Heart, ChevronLeft, Brain, Star, Globe, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface AboutProps {
  onBack: () => void;
}

export default function About({ onBack }: AboutProps) {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-24">
      {/* Navigation */}
      <motion.button 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all group px-4 py-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full w-fit"
      >
        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('about.back_to_dashboard')}</span>
      </motion.button>

      {/* Hero Section */}
      <div className="relative text-center space-y-8 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20 mb-4"
        >
          <Star size={14} className="fill-current" />
          <span className="text-[10px] font-black uppercase tracking-widest">{t('about.version')}</span>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h1 className="text-6xl sm:text-8xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">
            {t('about.title')}
          </h1>
          <p className="text-xl sm:text-2xl font-medium text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {t('about.description')}
          </p>
        </motion.div>

        {/* Decorative Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 blur-[120px] opacity-20 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-emerald-500 rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500 rounded-full" />
        </div>
      </div>

      {/* Bento Grid Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AI Insight - Large Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 p-10 bg-white dark:bg-zinc-900 rounded-[48px] border border-zinc-100 dark:border-white/5 shadow-xl relative overflow-hidden group"
        >
          <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500">
              <Brain size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-[25px] font-black text-zinc-900 dark:text-white tracking-tight">{t('about.features.ai_title')}</h3>
              <p className="text-[16px] text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-md">
                {t('about.features.ai_desc')}
              </p>
            </div>
          </div>
          {/* Decorative mesh */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-transparent blur-3xl -z-0 group-hover:scale-110 transition-transform duration-700" />
        </motion.div>

        {/* Gamification - Small Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-10 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-[48px] shadow-2xl flex flex-col justify-between group"
        >
          <div className="w-12 h-12 bg-white/10 dark:bg-zinc-900/10 rounded-xl flex items-center justify-center">
            <Zap size={24} className="text-amber-400 fill-amber-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tight">{t('about.features.game_title')}</h3>
            <p className="text-sm opacity-70 font-medium leading-relaxed">
              {t('about.features.game_desc')}
            </p>
          </div>
        </motion.div>

        {/* Privacy - Small Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-10 bg-emerald-500 text-white rounded-[48px] shadow-2xl flex flex-col justify-between group"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tight">{t('about.features.privacy_title')}</h3>
            <p className="text-sm opacity-90 font-medium leading-relaxed">
              {t('about.features.privacy_desc')}
            </p>
          </div>
        </motion.div>

        {/* Mission - Large Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="md:col-span-2 p-10 bg-zinc-100 dark:bg-white/5 rounded-[48px] border border-zinc-200 dark:border-white/10 flex flex-col justify-center space-y-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
              <Globe size={24} />
            </div>
            <h3 className="text-[25px] font-black text-zinc-900 dark:text-white tracking-tight">{t('about.mission_title')}</h3>
          </div>
          <p className="text-[15px] text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
            {t('about.mission_desc')}
          </p>
        </motion.div>
      </div>

      {/* Values & Passion Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-3 text-rose-500">
            <Target size={24} />
            <h3 className="text-[22px] font-black uppercase tracking-tight">{t('about.values.title')}</h3>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[t('about.values.v1'), t('about.values.v2'), t('about.values.v3'), t('about.values.v4')].map((value, i) => (
              <li key={i} className="flex items-start gap-3 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-white/5 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400 leading-tight">{value}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="p-10 bg-gradient-to-br from-zinc-900 to-zinc-950 dark:from-white dark:to-zinc-100 rounded-[48px] text-white dark:text-zinc-900 space-y-6 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <Heart size={24} className="text-rose-500 fill-rose-500" />
            <h3 className="text-2xl font-black tracking-tight">{t('about.passion_title')}</h3>
          </div>
          <p className="text-[16px] font-medium opacity-80 leading-relaxed">
            {t('about.passion_desc')}
          </p>
          <div className="pt-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 dark:bg-zinc-900/10 rounded-full w-[256px]">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{t('about.made_with')}</span>
              <Heart size={12} className="text-rose-500 fill-rose-500" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{t('about.by_team')}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center space-y-6 pt-12"
      >
        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.4em]">{t('about.thank_you')}</p>
        <div className="flex items-center justify-center gap-6">
          <div className="w-16 h-px bg-zinc-200 dark:bg-white/10" />
          <div className="w-12 h-12 bg-zinc-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-zinc-400">
            <Info size={24} />
          </div>
          <div className="w-16 h-px bg-zinc-200 dark:bg-white/10" />
        </div>
      </motion.div>
    </div>
  );
}
