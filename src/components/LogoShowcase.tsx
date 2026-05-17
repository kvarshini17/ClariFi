import React, { useState } from 'react';
import { Download, Sparkles, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { generateLogo } from '../services/logoService';

export default function LogoShowcase() {
  const { t } = useTranslation();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = await generateLogo();
      setLogoUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate logo');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!logoUrl) return;
    const link = document.createElement('a');
    link.href = logoUrl;
    link.download = 'ClariFi_Logo_1024x1024.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-10 bg-white dark:bg-zinc-900 rounded-[48px] border border-zinc-100 dark:border-white/5 shadow-xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-[25px] font-black text-zinc-900 dark:text-white tracking-tight">
            {t('logo.title')}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            {t('logo.desc')}
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              {t('logo.generating')}
            </>
          ) : (
            <>
              <Sparkles size={14} />
              {t('logo.generate')}
            </>
          )}
        </button>
      </div>

      <div className="relative aspect-square w-full max-w-md mx-auto bg-zinc-50 dark:bg-zinc-950 rounded-[32px] border-2 border-dashed border-zinc-200 dark:border-white/10 flex items-center justify-center overflow-hidden group">
        <AnimatePresence mode="wait">
          {logoUrl ? (
            <motion.div
              key="logo"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full h-full"
            >
              <img 
                src={logoUrl} 
                alt="ClariFi Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <button
                  onClick={handleDownload}
                  className="p-4 bg-white text-zinc-900 rounded-full shadow-xl hover:scale-110 transition-transform"
                  title={t('logo.download')}
                >
                  <Download size={24} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 text-zinc-400"
            >
              <div className="w-20 h-20 bg-zinc-100 dark:bg-white/5 rounded-3xl flex items-center justify-center">
                <ImageIcon size={40} />
              </div>
              <p className="text-xs font-black uppercase tracking-widest opacity-60">
                {t('logo.placeholder')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="absolute bottom-4 left-4 right-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold text-center">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Resolution', value: '1024x1024' },
          { label: 'Format', value: 'PNG' },
          { label: 'Style', value: 'Minimalist' },
          { label: 'AI Model', value: 'Gemini 2.5' }
        ].map((spec, i) => (
          <div key={i} className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/10">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{spec.label}</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-white">{spec.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
