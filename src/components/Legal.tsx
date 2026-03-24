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
      subtitle: "Last updated: March 24, 2026",
      icon: <FileText className="text-blue-500" />,
      sections: [
        {
          title: "1. Acceptance of Terms",
          body: "By accessing and using ClariFi, you agree to be bound by these Terms and Conditions and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site."
        },
        {
          title: "2. Use License",
          body: "Permission is granted to temporarily download one copy of the materials (information or software) on ClariFi's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title."
        },
        {
          title: "3. User Accounts",
          body: "You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account or password."
        },
        {
          title: "4. Financial Data & AI",
          body: "ClariFi provides financial tracking and AI-powered insights. We are not a financial institution, and our insights should not be taken as professional financial advice. Always consult with a qualified financial advisor for serious financial decisions."
        },
        {
          title: "5. Termination",
          body: "We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms."
        }
      ]
    },
    policies: {
      title: "Privacy Policy",
      subtitle: "Your privacy is our priority",
      icon: <Shield className="text-emerald-500" />,
      sections: [
        {
          title: "1. Information Collection",
          body: "We collect information you provide directly to us, such as when you create or modify your account, request customer support, or otherwise communicate with us. This includes your name, email address, and financial transaction data."
        },
        {
          title: "2. Use of Information",
          body: "We use the information we collect to provide, maintain, and improve our services, such as to process transactions, send you technical notices, and personalize your experience with AI-driven insights."
        },
        {
          title: "3. Data Sharing",
          body: "We do not sell, trade, or otherwise transfer to outside parties your personally identifiable information. This does not include trusted third parties who assist us in operating our website or servicing you, so long as those parties agree to keep this information confidential."
        },
        {
          title: "4. Data Security",
          body: "We implement a variety of security measures to maintain the safety of your personal information. Your data is encrypted and stored securely using industry-standard protocols."
        },
        {
          title: "5. Your Rights",
          body: "You have the right to access, correct, or delete your personal information at any time. You can manage your data directly through your profile settings or by contacting our support team."
        }
      ]
    },
    security: {
      title: "Security & Privacy",
      subtitle: "Bank-grade protection for your data",
      icon: <Lock className="text-amber-500" />,
      sections: [
        {
          title: "1. End-to-End Encryption",
          body: "All data transmitted between your device and our servers is encrypted using industry-standard SSL/TLS protocols. Your data is also encrypted at rest in our secure databases."
        },
        {
          title: "2. Secure Authentication",
          body: "We use Firebase Authentication for secure sign-in processes. This includes support for multi-factor authentication and secure token-based sessions to prevent unauthorized access."
        },
        {
          title: "3. Infrastructure Security",
          body: "Our application is hosted on Google Cloud Platform, which adheres to the highest security standards (SOC 2, ISO 27001, etc.). We leverage their world-class security infrastructure to protect your data."
        },
        {
          title: "4. Regular Audits",
          body: "We perform regular security audits and vulnerability scans to ensure our systems remain secure against emerging threats. Our code is reviewed for security best practices."
        },
        {
          title: "5. Data Isolation",
          body: "Each user's data is strictly isolated using Firestore Security Rules. This ensures that only you can access your financial information, even within our multi-tenant architecture."
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
        <span className="text-[13px] font-black uppercase tracking-widest">Back to Dashboard</span>
      </button>

      <div className="space-y-8">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-white/5 shadow-xl">
            {active.icon}
          </div>
          <div className="space-y-1">
            <h3 className="text-[25px] font-black text-zinc-900 dark:text-white tracking-tight">{active.title}</h3>
            <p className="text-[12px] text-zinc-500 font-bold uppercase tracking-widest">{active.subtitle}</p>
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
              <h3 className="text-[19px] font-black text-zinc-900 dark:text-white flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-500" />
                {section.title}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium text-[15px]">
                {section.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-10 bg-emerald-500/5 border border-emerald-500/10 rounded-[40px] text-center space-y-4">
        <Shield className="mx-auto text-emerald-500" size={32} />
        <p className="text-[14px] font-bold text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
          Built on Google Cloud infrastructure — the same platform trusted by millions of applications worldwide.
        </p>
      </div>
    </div>
  );
}
