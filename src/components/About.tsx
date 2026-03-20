import React from 'react';
import { Info, Sparkles, Shield, Zap, Target, Heart, ChevronLeft, Wallet, Brain, History } from 'lucide-react';
import { motion } from 'motion/react';

interface AboutProps {
  onBack: () => void;
}

export default function About({ onBack }: AboutProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors group"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-black uppercase tracking-widest">Back to Dashboard</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: <Brain className="text-purple-500" />,
            title: "AI Insights",
            desc: "Smart analysis of your spending habits using advanced Gemini AI models."
          },
          {
            icon: <Zap className="text-amber-500" />,
            title: "Gamification",
            desc: "Turn savings into quests. Earn XP, build streaks, and level up your finances."
          },
          {
            icon: <Shield className="text-emerald-500" />,
            title: "Privacy First",
            desc: "Your data is yours. Securely stored and encrypted with Firebase."
          }
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-white/5 shadow-sm"
          >
            <div className="p-3 bg-zinc-50 dark:bg-white/5 w-fit rounded-2xl mb-6">
              {feature.icon}
            </div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-2 uppercase tracking-tight">{feature.title}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">{feature.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[40px] border border-zinc-100 dark:border-white/5 p-10 sm:p-16 space-y-12">
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Our Mission</h2>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
            We believe that financial management shouldn't be a chore. ClariFi was built to bridge the gap between complex banking tools and intuitive, engaging experiences. We're here to help you understand your money, not just track it.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h3 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
              <Target className="text-rose-500" />
              Core Values
            </h3>
            <ul className="space-y-4">
              {[
                "Transparency in every calculation",
                "User empowerment through data",
                "Continuous innovation in AI",
                "Uncompromising security standards"
              ].map((value, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-bold text-zinc-600 dark:text-zinc-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {value}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
              <Heart className="text-emerald-500" />
              Built with Passion
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
              ClariFi is a labor of love, combining the latest in web technology with a deep understanding of personal finance. We're constantly evolving based on your feedback.
            </p>
            <div className="pt-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 dark:bg-white/5 rounded-full w-fit">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Made with</span>
                <Heart size={12} className="text-rose-500 fill-rose-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">by the ClariFi Team</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center space-y-4">
        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em]">Thank you for choosing ClariFi</p>
        <div className="flex items-center justify-center gap-4">
          <div className="w-12 h-px bg-zinc-200 dark:bg-white/10" />
          <Info size={20} className="text-zinc-300" />
          <div className="w-12 h-px bg-zinc-200 dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}
