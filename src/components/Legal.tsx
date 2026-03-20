import React from 'react';
import { Shield, FileText, Lock, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface LegalProps {
  type: 'terms' | 'policies' | 'security';
  onBack: () => void;
}

export default function Legal({ type, onBack }: LegalProps) {
  const content = {
    terms: {
      title: "Terms & Conditions",
      subtitle: "Last updated: March 20, 2026",
      icon: <FileText className="text-blue-500" />,
      sections: [
        {
          title: "1. Acceptance of Terms",
          body: "By accessing and using ClariFi, you agree to be bound by these Terms and Conditions. If you do not agree, please refrain from using our services."
        },
        {
          title: "2. User Accounts",
          body: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account."
        },
        {
          title: "3. Financial Data",
          body: "ClariFi provides financial tracking and AI-powered insights. We are not a financial institution, and our insights should not be taken as professional financial advice."
        }
      ]
    },
    policies: {
      title: "Privacy Policy",
      subtitle: "How we protect your data",
      icon: <Shield className="text-emerald-500" />,
      sections: [
        {
          title: "Data Collection",
          body: "We collect transaction data and profile information to provide personalized insights. Your data is encrypted and stored securely using Firebase."
        },
        {
          title: "AI Processing",
          body: "We use Gemini AI to analyze your spending habits. This processing is done securely, and your personal identity is protected during analysis."
        },
        {
          title: "Third-Party Services",
          body: "We do not sell your data to third parties. We only use trusted infrastructure providers like Google Cloud and Firebase."
        }
      ]
    },
    security: {
      title: "Security & Privacy",
      subtitle: "Your data, protected",
      icon: <Lock className="text-amber-500" />,
      sections: [
        {
          title: "Authentication",
          body: "Your account is protected by Firebase Authentication with secure token-based sessions and Google Sign-In."
        },
        {
          title: "Data Protection",
          body: "All data is encrypted in transit (SSL/TLS) and at rest by Google's Firestore infrastructure."
        },
        {
          title: "Access Control",
          body: "Strict Firestore Security Rules ensure only you can access your financial data."
        }
      ]
    }
  };

  const active = content[type];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors group"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-black uppercase tracking-widest">Back to Dashboard</span>
      </button>

      <div className="space-y-8">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-white/5 shadow-xl">
            {active.icon}
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{active.title}</h2>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">{active.subtitle}</p>
          </div>
        </div>

        <div className="grid gap-6">
          {active.sections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-white/5 shadow-sm space-y-4"
            >
              <h3 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-500" />
                {section.title}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                {section.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-10 bg-emerald-500/5 border border-emerald-500/10 rounded-[40px] text-center space-y-4">
        <Shield className="mx-auto text-emerald-500" size={32} />
        <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
          Built on Google Cloud infrastructure — the same platform trusted by millions of applications worldwide.
        </p>
      </div>
    </div>
  );
}
