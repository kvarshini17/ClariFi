import React from 'react';
import { motion } from 'motion/react';
import { FileText, ShieldCheck, ChevronLeft, Scale, Eye, Lock } from 'lucide-react';

interface LegalContentProps {
  type: 'terms' | 'policies';
  onBack: () => void;
}

export default function LegalContent({ type, onBack }: LegalContentProps) {
  const content = type === 'terms' ? {
    title: 'Terms & Conditions',
    icon: <FileText className="text-emerald-400" size={32} />,
    sections: [
      {
        title: '1. Acceptance of Terms',
        text: 'By accessing and using ClariFi, you agree to be bound by these Terms and Conditions and all applicable laws and regulations.'
      },
      {
        title: '2. Use License',
        text: 'Permission is granted to temporarily use ClariFi for personal, non-commercial financial tracking and analysis only.'
      },
      {
        title: '3. Disclaimer',
        text: 'The materials on ClariFi are provided on an "as is" basis. ClariFi makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.'
      },
      {
        title: '4. Limitations',
        text: 'In no event shall ClariFi or its suppliers be liable for any damages arising out of the use or inability to use the materials on ClariFi.'
      }
    ]
  } : {
    title: 'Privacy Policy',
    icon: <ShieldCheck className="text-blue-400" size={32} />,
    sections: [
      {
        title: '1. Data Collection',
        text: 'We collect information you provide directly to us, such as when you create an account, add transactions, or contact support.'
      },
      {
        title: '2. Use of Information',
        text: 'We use the information we collect to provide, maintain, and improve our services, and to develop new features.'
      },
      {
        title: '3. Data Security',
        text: 'We implement a variety of security measures to maintain the safety of your personal information when you enter, submit, or access your personal information.'
      },
      {
        title: '4. Third-Party Disclosure',
        text: 'We do not sell, trade, or otherwise transfer to outside parties your personally identifiable information.'
      }
    ]
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors group"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-black uppercase tracking-widest">Back to Dashboard</span>
      </button>

      <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 sm:p-12 rounded-[40px] border border-zinc-200 dark:border-white/10 shadow-2xl space-y-12 transition-colors duration-300">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-zinc-50 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-zinc-200 dark:border-white/10 shadow-xl">
            {content.icon}
          </div>
          <div className="space-y-1">
            <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{content.title}</h3>
            <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest">Last Updated: March 20, 2026</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {content.sections.map((section, index) => (
            <div key={index} className="space-y-4 p-6 bg-zinc-50 dark:bg-white/5 rounded-3xl border border-zinc-200 dark:border-white/5 hover:border-emerald-500/30 transition-colors group">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full group-hover:scale-150 transition-transform" />
                {section.title}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed font-medium">
                {section.text}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-zinc-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[Scale, Eye, Lock].map((Icon, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-zinc-500">
                  <Icon size={14} />
                </div>
              ))}
            </div>
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Compliance Verified</p>
          </div>
          <button 
            onClick={onBack}
            className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
          >
            I Understand
          </button>
        </div>
      </div>
    </motion.div>
  );
}
