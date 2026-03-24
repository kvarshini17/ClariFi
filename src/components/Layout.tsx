import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { UserProfile } from '../types';
import { LogOut, Wallet, Sparkles, Settings, Bell, User, History, ChevronDown, Info, ShieldCheck, FileText, Lock, LifeBuoy, RefreshCw, MessageCircle, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: ReactNode;
  user: FirebaseUser;
  profile?: UserProfile | null;
  onLogout: () => void;
  onConverterClick?: () => void;
  onSettingsClick?: () => void;
  onRecapClick?: () => void;
  onAboutClick?: () => void;
  onTermsClick?: () => void;
  onPoliciesClick?: () => void;
  onSecurityClick?: () => void;
  onSupportClick?: () => void;
  onNotificationsClick?: () => void;
  unreadNotifications?: number;
}

export default function Layout({ 
  children, 
  user, 
  profile,
  onLogout, 
  onConverterClick,
  onSettingsClick, 
  onRecapClick,
  onAboutClick,
  onTermsClick,
  onPoliciesClick,
  onSecurityClick,
  onSupportClick,
  onNotificationsClick,
  unreadNotifications = 0 
}: LayoutProps) {
  const { t } = useTranslation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white font-sans relative overflow-x-hidden transition-colors duration-300">
      {/* Global Grid Background */}
      <div 
        className="fixed inset-0 opacity-[0.05] dark:opacity-[0.05] light:opacity-[0.1] pointer-events-none z-0" 
        style={{ 
          backgroundImage: `linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} 
      />

      {/* Background Blobs & 3D Objects - Simplified on Mobile */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[80px] sm:blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-500/5 dark:bg-blue-500/10 blur-[80px] sm:blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '-4s' }} />
        
        {/* Floating 3D-like elements - Hidden on Mobile for Performance */}
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] right-[15%] w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-blue-500/20 rounded-3xl blur-xl hidden sm:block"
        />
        <motion.div 
          animate={{ 
            y: [0, 30, 0],
            rotate: [0, -15, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[20%] left-[10%] w-48 h-48 bg-gradient-to-tr from-purple-500/10 to-emerald-500/10 rounded-full blur-2xl hidden sm:block"
        />
        <div className="absolute top-[40%] left-[5%] w-24 h-24 border border-white/5 rounded-full animate-float hidden lg:block" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-[10%] right-[5%] w-40 h-40 border border-white/5 rounded-2xl rotate-12 animate-float hidden lg:block" style={{ animationDuration: '15s' }} />
      </div>

      <header className="border-b border-zinc-200 dark:border-white/5 sticky top-0 z-40 backdrop-blur-xl bg-white/50 dark:bg-zinc-950/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-1.5 rounded-lg shadow-lg shadow-emerald-500/20">
              <Wallet className="text-zinc-950" size={18} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tighter text-zinc-900 dark:text-white">ClariFi</span>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">
                <Sparkles size={10} /> Pro
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={onNotificationsClick}
              className="relative p-2 sm:p-2.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-zinc-200 dark:hover:border-white/10"
              title="Notifications"
            >
              <Bell size={18} className="sm:w-5 sm:h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950" />
              )}
            </button>

            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 sm:gap-3 hover:bg-zinc-100 dark:hover:bg-white/5 p-1 sm:p-1.5 rounded-xl transition-all border border-transparent hover:border-zinc-200 dark:hover:border-white/10 group"
              >
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white group-hover:text-emerald-400 transition-colors truncate max-w-[100px] lg:max-w-[150px]">
                    {t('dashboard.welcome')} {profile?.displayName || user.displayName || user.email?.split('@')[0] || 'Friend'}
                  </span>
                  <span className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider truncate max-w-[100px] lg:max-w-[150px]">
                    {user.email}
                  </span>
                </div>
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-zinc-200 dark:border-white/10 p-0.5 group-hover:border-emerald-500/50 transition-colors object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black border border-emerald-500/30 group-hover:bg-emerald-500/30 transition-colors text-xs sm:text-base">
                    {(user.displayName?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                  </div>
                )}
                <ChevronDown size={14} className={`text-zinc-400 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/5 sm:hidden">
                      <p className="text-sm font-black text-zinc-900 dark:text-white truncate">{t('dashboard.welcome')} {profile?.displayName || user.displayName || user.email?.split('@')[0] || 'Friend'}</p>
                      <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => { onSettingsClick?.(); setShowUserMenu(false); }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      <Settings size={18} />
                      <span className="text-[11px] font-black uppercase tracking-widest">{t('nav.settings')}</span>
                    </button>

                    <button
                      onClick={() => { onConverterClick?.(); setShowUserMenu(false); }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      <RefreshCw size={18} />
                      <span className="text-[11px] font-black uppercase tracking-widest">{t('settings.converter.title')}</span>
                    </button>

                    <button
                      onClick={() => { onRecapClick?.(); setShowUserMenu(false); }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      <BarChart3 size={18} />
                      <span className="text-[11px] font-black uppercase tracking-widest">{t('recap.title')}</span>
                    </button>

                    <button
                      onClick={() => { onAboutClick?.(); setShowUserMenu(false); }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      <Info size={18} />
                      <span className="text-[11px] font-black uppercase tracking-widest">{t('nav.about_app')}</span>
                    </button>

                    <button
                      onClick={() => { onSecurityClick?.(); setShowUserMenu(false); }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      <Lock size={18} />
                      <span className="text-[11px] font-black uppercase tracking-widest text-left">{t('settings.security')}</span>
                    </button>

                    <button
                      onClick={() => { onTermsClick?.(); setShowUserMenu(false); }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      <FileText size={18} />
                      <span className="text-[11px] font-black uppercase tracking-widest text-left">{t('nav.terms')}</span>
                    </button>

                    <button
                      onClick={() => { onPoliciesClick?.(); setShowUserMenu(false); }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      <ShieldCheck size={18} />
                      <span className="text-[11px] font-black uppercase tracking-widest text-left">{t('nav.policies')}</span>
                    </button>

                    <button
                      onClick={() => { onSupportClick?.(); setShowUserMenu(false); }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      <MessageCircle size={18} />
                      <span className="text-[11px] font-black uppercase tracking-widest text-left">{t('nav.support')}</span>
                    </button>

                    <div className="h-px bg-zinc-100 dark:bg-white/5 my-1" />

                    <button
                      onClick={() => { onLogout(); setShowUserMenu(false); }}
                      className="w-full px-4 py-3 flex items-center gap-3 text-rose-500 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut size={18} />
                      <span className="text-[11px] font-black uppercase tracking-widest">{t('nav.logout')}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>
      
      <main className="relative z-10">
        {children}
      </main>
      
      <footer className="py-20 text-center relative z-10">
        <div className="max-w-6xl mx-auto px-4 border-t border-zinc-200 dark:border-white/5 pt-10 space-y-4">
          <p className="text-zinc-700 dark:text-zinc-400 text-xs font-black uppercase tracking-[0.2em]">© 2026 ClariFi • Intelligent Finance</p>
          <div className="flex items-center justify-center gap-6">
            <button 
              onClick={() => onAboutClick?.()} 
              className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 text-xs font-black uppercase tracking-widest transition-colors"
            >
              {t('nav.about')}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
