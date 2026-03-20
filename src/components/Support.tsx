import React from 'react';
import { motion } from 'motion/react';
import { X, MessageSquare, Mail, HelpCircle, ExternalLink, Shield, Book, LifeBuoy } from 'lucide-react';

interface SupportProps {
  onBack: () => void;
}

export default function Support({ onBack }: SupportProps) {
  const supportCategories = [
    {
      icon: <MessageSquare className="text-emerald-500" size={24} />,
      title: "Live Chat",
      description: "Chat with our financial experts for immediate assistance.",
      action: "Start Chat",
      available: true
    },
    {
      icon: <Mail className="text-blue-500" size={24} />,
      title: "Email Support",
      description: "Send us a detailed message and we'll get back within 24 hours.",
      action: "Send Email",
      available: true
    },
    {
      icon: <HelpCircle className="text-purple-500" size={24} />,
      title: "Help Center",
      description: "Browse our extensive documentation and FAQs.",
      action: "Visit Docs",
      available: true
    }
  ];

  const faqs = [
    {
      question: "How secure is my financial data?",
      answer: "We use bank-grade encryption and strict Firestore security rules. Your data is only accessible by you."
    },
    {
      question: "Can I export my transaction history?",
      answer: "Yes, you can export your data in CSV or PDF format from the Settings > General tab."
    },
    {
      question: "How does the AI receipt scanner work?",
      answer: "Our AI uses advanced OCR and natural language processing to extract amounts, categories, and dates from your photos."
    }
  ];

  return (
    <div className="space-y-12 pb-20">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <LifeBuoy className="text-emerald-500" size={32} />
            Support & Help
          </h2>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">We're here to help you succeed</p>
        </div>
        <button 
          onClick={onBack}
          className="px-6 py-3 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-zinc-200 dark:border-white/10"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {supportCategories.map((cat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-8 rounded-[32px] space-y-6 hover:border-emerald-500/30 transition-all group"
          >
            <div className="w-14 h-14 bg-zinc-50 dark:bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              {cat.icon}
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white">{cat.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{cat.description}</p>
            </div>
            <button className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-all">
              {cat.action}
              <ExternalLink size={14} />
            </button>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Frequently Asked Questions</h3>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Quick answers to common queries</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-6 rounded-2xl space-y-2">
                <p className="font-black text-zinc-900 dark:text-white">{faq.question}</p>
                <p className="text-sm text-zinc-500 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Resources</h3>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Learn more about ClariFi</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-6 rounded-2xl flex items-center gap-4 hover:border-blue-500/30 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <Book size={20} />
              </div>
              <div>
                <p className="font-black text-zinc-900 dark:text-white text-sm">User Guide</p>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Master ClariFi</p>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-6 rounded-2xl flex items-center gap-4 hover:border-emerald-500/30 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                <Shield size={20} />
              </div>
              <div>
                <p className="font-black text-zinc-900 dark:text-white text-sm">Security Whitepaper</p>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Data Privacy</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-blue-600 p-8 rounded-[32px] text-zinc-950 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 space-y-4">
              <h4 className="text-2xl font-black tracking-tight leading-none">Need Priority Support?</h4>
              <p className="text-sm font-medium opacity-80">Upgrade to ClariFi Platinum for 24/7 dedicated support and personalized financial coaching.</p>
              <button className="px-6 py-3 bg-zinc-950 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
