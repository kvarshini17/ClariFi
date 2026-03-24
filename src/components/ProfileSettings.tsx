import React, { useState, useEffect, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, Theme, Transaction, FontSize } from '../types';
import { COUNTRIES, LANGUAGES } from '../constants';
import { User, Globe, CreditCard, Save, CheckCircle2, Phone, Moon, Sun, Monitor, Sparkles, Lock, ShieldCheck, Mail, ShieldAlert, Languages, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import FinancialRecap from './FinancialRecap';
import { User as FirebaseUser } from 'firebase/auth';

interface ProfileSettingsProps {
  user: FirebaseUser;
  profile: UserProfile;
  transactions: Transaction[];
  currencySymbol: string;
  onViewRecap: () => void;
  initialTab?: 'general' | 'recap' | 'security';
}

// Memoized General Settings Form
const GeneralSettingsForm = memo(({ 
  profile, 
  onSave, 
  isSaving, 
  showSuccess 
}: { 
  profile: UserProfile; 
  onSave: (updates: any) => Promise<void>;
  isSaving: boolean;
  showSuccess: boolean;
}) => {
  const { t, i18n } = useTranslation();
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [selectedCountry, setSelectedCountry] = useState(profile.country || '');
  const [selectedLanguage, setSelectedLanguage] = useState(profile.language || 'en');
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber || '');
  const [theme, setTheme] = useState<Theme>(profile.theme || 'dark');
  const [fontSize, setFontSize] = useState<FontSize>(profile.fontSize || 'medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const countryData = COUNTRIES.find(c => c.name === selectedCountry);
    const updates: any = {
      displayName,
      country: selectedCountry,
      language: selectedLanguage,
      phoneNumber,
      theme,
      fontSize,
    };

    if (countryData) {
      updates.currency = countryData.currency;
    }
    
    onSave(updates);
  };

  const currentCountry = COUNTRIES.find(c => c.name === selectedCountry);

  return (
    <motion.div
      key="general"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 sm:p-12 rounded-[40px] border border-zinc-200 dark:border-white/10 shadow-2xl space-y-10 transition-colors duration-300"
    >
      <div className="space-y-2">
        <h3 className="text-[29px] font-black text-zinc-900 dark:text-white tracking-tight">{t('settings.profile')}</h3>
        <p className="text-[#ceceda] text-[12px] font-bold uppercase tracking-widest">{t('settings.manage_preferences')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Display Name */}
        <div className="space-y-3">
          <label className="text-[12px] font-black text-[#ceceda] uppercase tracking-[0.2em] flex items-center gap-2">
            <User size={12} className="text-emerald-500" />
            {t('settings.full_name')}
          </label>
          <input 
            type="text" 
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t('settings.full_name')}
            className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-6 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
          />
        </div>

        {/* Phone Number */}
        <div className="space-y-3">
          <label className="text-[12px] font-black text-[#ceceda] uppercase tracking-[0.2em] flex items-center gap-2">
            <Phone size={12} className="text-amber-500" />
            {t('settings.phone_optional')}
          </label>
          <input 
            type="tel" 
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-6 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
          />
        </div>

        {/* Theme Selection */}
        <div className="space-y-3">
          <label className="text-[12px] font-black text-[#ceceda] uppercase tracking-[0.2em] flex items-center gap-2">
            <Moon size={12} className="text-violet-500" />
            {t('settings.appearance')}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: t('settings.themes.light'), icon: <Sun size={16} /> },
              { id: 'dark', label: t('settings.themes.dark'), icon: <Moon size={16} /> },
              { id: 'system', label: t('settings.themes.system'), icon: <Monitor size={16} /> },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id as Theme)}
                className={`px-4 py-4 rounded-2xl text-center border transition-all flex flex-col items-center gap-2 ${
                  theme === t.id 
                    ? 'bg-violet-500/20 border-violet-500 text-violet-400' 
                    : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-500 hover:border-zinc-300 dark:hover:border-white/20'
                }`}
              >
                {t.icon}
                <span className="font-bold text-[11px] uppercase tracking-widest">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Font Size Selection */}
        <div className="space-y-3">
          <label className="text-[12px] font-black text-[#ceceda] uppercase tracking-[0.2em] flex items-center gap-2">
            <Sparkles size={12} className="text-emerald-500" />
            {t('settings.font_size')}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'small', label: t('settings.font_sizes.small'), size: 'text-xs' },
              { id: 'medium', label: t('settings.font_sizes.medium'), size: 'text-sm' },
              { id: 'large', label: t('settings.font_sizes.large'), size: 'text-lg' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFontSize(f.id as FontSize)}
                className={`px-4 py-4 rounded-2xl text-center border transition-all flex flex-col items-center gap-2 ${
                  fontSize === f.id 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                    : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-500 hover:border-zinc-300 dark:hover:border-white/20'
                }`}
              >
                <span className={`font-black ${f.size}`}>Aa</span>
                <span className="font-bold text-[11px] uppercase tracking-widest">{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div className="space-y-3">
          <label className="text-[12px] font-black text-[#ceceda] uppercase tracking-[0.2em] flex items-center gap-2">
            <Languages size={12} className="text-blue-500" />
            {t('settings.language')}
          </label>
          <select 
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-6 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold appearance-none cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-white dark:bg-zinc-900">
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Currency & Region Selection */}
        <div className="space-y-3">
          <label className="text-[12px] font-black text-[#ceceda] uppercase tracking-[0.2em] flex items-center gap-2">
            <Coins size={12} className="text-amber-500" />
            {t('settings.currency')}
          </label>
          <select 
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-6 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold appearance-none cursor-pointer"
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.name} className="bg-white dark:bg-zinc-900">
                {country.name} ({country.currency.code} - {country.currency.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Currency Preview */}
        {currentCountry && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-zinc-50 dark:bg-white/5 rounded-3xl border border-zinc-200 dark:border-white/10 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <CreditCard className="text-emerald-400" size={24} />
            </div>
            <div>
              <p className="text-[11px] font-black text-[#ceceda] uppercase tracking-widest">{t('settings.active_currency')}</p>
              <p className="text-zinc-900 dark:text-white font-black text-lg">
                {currentCountry.currency.name} ({currentCountry.currency.symbol})
              </p>
            </div>
          </motion.div>
        )}

        <div className="pt-4 flex items-center gap-4">
          <button 
            type="submit"
            disabled={isSaving}
            className="flex-1 group relative px-8 py-5 bg-emerald-500 text-zinc-950 rounded-2xl font-black text-xl transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3 overflow-hidden shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {isSaving ? t('settings.saving_changes') : t('settings.save_settings')}
          </button>

          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 text-emerald-400 font-black text-sm uppercase tracking-widest"
              >
                <CheckCircle2 size={18} />
                {t('settings.saved')}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
    </motion.div>
  );
});

// Memoized Security Settings
const SecuritySettings = memo(({ user }: { user: FirebaseUser }) => {
  const { t } = useTranslation();
  return (
    <motion.div
      key="security"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 sm:p-12 rounded-[40px] border border-zinc-200 dark:border-white/10 shadow-2xl space-y-10 transition-colors duration-300"
    >
      <div className="space-y-2">
        <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{t('settings.security_title')}</h3>
        <p className="text-[#ceceda] text-[11px] font-bold uppercase tracking-widest">{t('settings.security_desc')}</p>
      </div>

      <div className="space-y-6">
        <div className="p-6 bg-zinc-50 dark:bg-white/5 rounded-3xl border border-zinc-200 dark:border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
            <Mail className="text-blue-400" size={24} />
          </div>
          <div>
            <p className="text-[11px] font-black text-[#ceceda] uppercase tracking-widest">{t('settings.email_address')}</p>
            <p className="text-zinc-900 dark:text-white font-black text-lg">{user.email}</p>
          </div>
          {user.emailVerified && (
            <div className="ml-auto px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
              {t('settings.verified')}
            </div>
          )}
        </div>

        <div className="p-6 bg-zinc-50 dark:bg-white/5 rounded-3xl border border-zinc-200 dark:border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
            <ShieldCheck className="text-purple-400" size={24} />
          </div>
          <div>
            <p className="text-[11px] font-black text-[#ceceda] uppercase tracking-widest">{t('settings.auth_method')}</p>
            <p className="text-zinc-900 dark:text-white font-black text-lg">
              {user.providerData[0]?.providerId === 'google.com' ? 'Google Account' : 'Email & Password'}
            </p>
          </div>
        </div>

        <div className="p-6 bg-rose-500/5 rounded-3xl border border-rose-500/10 flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20">
            <ShieldAlert className="text-rose-400" size={24} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-black text-[#ceceda] uppercase tracking-widest">{t('settings.security_status')}</p>
            <p className="text-zinc-900 dark:text-white font-black text-lg">{t('settings.account_protected')}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default function ProfileSettings({ user, profile, transactions, currencySymbol, onViewRecap, initialTab = 'general' }: ProfileSettingsProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'general' | 'recap' | 'security'>(initialTab);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleSave = async (updates: any) => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), updates);
      
      // Update local language immediately if it changed
      if (updates.language) {
        i18n.changeLanguage(updates.language);
      }
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${profile.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <AnimatePresence mode="wait">
        {activeTab === 'general' ? (
          <GeneralSettingsForm 
            profile={profile} 
            onSave={handleSave} 
            isSaving={isSaving} 
            showSuccess={showSuccess} 
          />
        ) : activeTab === 'security' ? (
          <SecuritySettings user={user} />
        ) : (
          <motion.div
            key="recap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <FinancialRecap transactions={transactions} currencySymbol={currencySymbol} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
