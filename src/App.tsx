import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  getDoc,
  limit
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { Transaction, UserProfile, Theme, Budget, AppNotification, FontSize } from './types';

import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import SmartInsights from './components/SmartInsights';
import CurrencySetup from './components/CurrencySetup';
import AuthModal from './components/AuthModal';
import ProfileSettings from './components/ProfileSettings';
import StreakPrompt from './components/StreakPrompt';
import BudgetManager from './components/BudgetManager';
import BudgetForm from './components/BudgetForm';
import ReceiptScanner from './components/ReceiptScanner';
import NotificationCenter from './components/NotificationCenter';
import GoalTracker from './components/GoalTracker';
import GoalForm from './components/GoalForm';
import FinancialPersonality from './components/FinancialPersonality';
import FinancialRecap from './components/FinancialRecap';
import SavingChallenges from './components/SavingChallenges';
import About from './components/About';
import Legal from './components/Legal';
import Support from './components/Support';
import CurrencyConverter from './components/CurrencyConverter';
import { LogIn, PieChart, Plus, List, Lightbulb, Sparkles, Wallet, TrendingUp, TrendingDown, Settings, Flame, Target, Camera, Bell, Brain, History, Trophy, Info, ShieldCheck, FileText, Lock, LifeBuoy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React from 'react';
import { format, differenceInDays } from 'date-fns';
import { Goal } from './types';
import { useWindowSize } from './hooks/useWindowSize';
import { useTranslation } from 'react-i18next';

export default function App() {
  const { t, i18n } = useTranslation();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'insights' | 'budgets' | 'goals' | 'challenges' | 'settings' | 'about' | 'terms' | 'policies' | 'security' | 'support'>('dashboard');
  const [settingsTab, setSettingsTab] = useState<'general' | 'recap'>('general');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showStreakPrompt, setShowStreakPrompt] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false);
  const [scanData, setScanData] = useState<{ amount: number; category: string; note: string } | null>(null);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let unsubTransactions: (() => void) | null = null;
    let unsubNotifications: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Cleanup previous listeners
      if (unsubProfile) unsubProfile();
      if (unsubTransactions) unsubTransactions();
      if (unsubNotifications) unsubNotifications();
      
      setUser(currentUser);
      
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        
        // Listen to profile changes
        unsubProfile = onSnapshot(userRef, async (snapshot) => {
          if (snapshot.exists()) {
            const profileData = snapshot.data() as UserProfile;
            setProfile(profileData);

            // Ensure displayName is synced if missing in profile but present in user
            if (!profileData.displayName && currentUser.displayName) {
              try {
                await updateDoc(userRef, { displayName: currentUser.displayName });
              } catch (error) {
                handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
              }
            }

            // Streak Logic
            const today = format(new Date(), 'yyyy-MM-dd');
            const lastLogin = profileData.streak?.lastLoginDate;
            
            if (lastLogin !== today) {
              let newCount = 1;
              if (lastLogin) {
                const daysDiff = differenceInDays(new Date(today), new Date(lastLogin));
                if (daysDiff === 1) {
                  newCount = (profileData.streak?.count || 0) + 1;
                }
              }
              
              try {
                await setDoc(userRef, {
                  streak: {
                    count: newCount,
                    lastLoginDate: today
                  }
                }, { merge: true });
              } catch (error) {
                handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
              }
              
              setShowStreakPrompt(true);
            }
          } else {
            try {
              await setDoc(userRef, {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                createdAt: serverTimestamp()
              }, { merge: true });
            } catch (error) {
                handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
            }
          }
          setLoading(false);
        }, (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
          setLoading(false);
        });

        // Listen to transactions
        const q = query(
          collection(db, 'expenses'),
          where('uid', '==', currentUser.uid),
          orderBy('date', 'desc')
        );

        unsubTransactions = onSnapshot(q, (snapshot) => {
          const transactionData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          })) as Transaction[];
          setTransactions(transactionData);
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, 'expenses');
        });

        // Listen to notifications
        const notifQ = query(
          collection(db, 'notifications'),
          where('uid', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(20)
        );

        unsubNotifications = onSnapshot(notifQ, (snapshot) => {
          const notifData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          })) as AppNotification[];
          setNotifications(notifData);
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, 'notifications');
        });

      } else {
        setProfile(null);
        setTransactions([]);
        setNotifications([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubProfile) unsubProfile();
      if (unsubTransactions) unsubTransactions();
      if (unsubNotifications) unsubNotifications();
    };
  }, []);

  // Font Size Management
  useEffect(() => {
    const applyFontSize = (size: FontSize) => {
      const root = window.document.documentElement;
      root.classList.remove('text-small', 'text-medium', 'text-large');
      root.classList.add(`text-${size}`);
      
      // Also set the base font size for rem scaling
      if (size === 'small') {
        root.style.fontSize = '14px';
      } else if (size === 'large') {
        root.style.fontSize = '18px';
      } else {
        root.style.fontSize = '16px';
      }
    };

    if (profile?.fontSize) {
      applyFontSize(profile.fontSize);
    } else {
      applyFontSize('medium');
    }
  }, [profile?.fontSize]);

  // Theme Management
  useEffect(() => {
    const applyTheme = (theme: Theme) => {
      const root = window.document.documentElement;
      
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        if (systemTheme === 'dark') {
          root.classList.add('dark');
          root.classList.remove('light');
        } else {
          root.classList.add('light');
          root.classList.remove('dark');
        }
      } else {
        if (theme === 'dark') {
          root.classList.add('dark');
          root.classList.remove('light');
        } else {
          root.classList.add('light');
          root.classList.remove('dark');
        }
      }
    };

    if (profile?.theme) {
      applyTheme(profile.theme);
    } else {
      applyTheme('dark'); // Default to dark for this app's aesthetic
    }
  }, [profile?.theme]);

  // Language Management
  useEffect(() => {
    if (profile?.language) {
      i18n.changeLanguage(profile.language);
    }
  }, [profile?.language, i18n]);

  const handleCurrencyComplete = async (country: string, currency: { code: string; symbol: string; name: string }) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { country, currency }, { merge: true });
  };

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleLogout = () => signOut(auth);

  const handleAddBudget = async (budgetData: Omit<Budget, 'id' | 'uid' | 'createdAt'>) => {
    if (!user) return;
    const newBudget: Budget = {
      id: Math.random().toString(36).substr(2, 9),
      uid: user.uid,
      ...budgetData,
      createdAt: new Date().toISOString()
    };

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        budgets: arrayUnion(newBudget)
      });
      setShowAddBudget(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleAddGoal = async (goalData: Omit<Goal, 'id' | 'uid' | 'createdAt' | 'currentAmount'>) => {
    if (!user) return;
    const newGoal: Goal = {
      id: Math.random().toString(36).substr(2, 9),
      uid: user.uid,
      ...goalData,
      currentAmount: 0,
      createdAt: new Date().toISOString()
    };

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        goals: arrayUnion(newGoal)
      });
      setShowAddGoal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  // Scroll Lock for Modals
  useEffect(() => {
    const isModalOpen = showAddForm || showAddBudget || showAddGoal || showAuthModal || showScanner || showNotifications || showStreakPrompt || showCurrencyConverter;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddForm, showAddBudget, showAddGoal, showAuthModal, showScanner, showNotifications, showStreakPrompt]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 overflow-hidden relative">
        {/* Grid Background Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.15] pointer-events-none" 
          style={{ 
            backgroundImage: `linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} 
        />
        
        {/* Animated Background Blobs - Simplified on Mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={isMobile ? {} : { 
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
              y: [0, 20, 0],
              opacity: [0.05, 0.1, 0.05] 
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1/4 -left-1/4 w-[300px] sm:w-[800px] h-[300px] sm:h-[800px] bg-emerald-500/10 sm:bg-emerald-500/30 blur-[60px] sm:blur-[140px] rounded-full"
          />
          <motion.div 
            animate={isMobile ? {} : { 
              scale: [1.2, 1, 1.2],
              x: [0, -40, 0],
              y: [0, -30, 0],
              opacity: [0.05, 0.08, 0.05] 
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-1/4 -right-1/4 w-[300px] sm:w-[800px] h-[300px] sm:h-[800px] bg-blue-500/10 sm:bg-blue-500/30 blur-[60px] sm:blur-[140px] rounded-full"
          />
        </div>

        {/* Floating Currency Icons - Hidden on Mobile for Performance */}
        {!isMobile && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
              key={i}
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: Math.random() * 100 + '%',
                opacity: 0 
              }}
              animate={{ 
                y: [null, '-20px', '20px'],
                opacity: [0, 0.4, 0],
                scale: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 5 + Math.random() * 5, 
                repeat: Infinity, 
                delay: Math.random() * 5 
              }}
              className="absolute text-emerald-500/20 text-4xl font-serif select-none"
            >
              {['$', '€', '£', '¥'][i % 4]}
            </motion.div>
          ))}
        </div>
      )}

        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Left Side: Content */}
          <motion.div 
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-10 text-center lg:text-left"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-bold uppercase tracking-[0.2em] backdrop-blur-md"
              >
                <Sparkles size={14} className="animate-pulse" />
                {t('app.intelligent_wealth')}
              </motion.div>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-white leading-[0.9] lg:leading-[0.85]">
                Clarity in <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 via-emerald-500 to-blue-600">
                  {t('app.clarity_every_expense')}
                </span>
              </h1>
              <p className="text-zinc-400 text-base sm:text-lg lg:text-xl max-w-lg mx-auto lg:mx-0 leading-relaxed font-light px-4 sm:px-0">
                {t('app.experience_future')}
              </p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <button 
                onClick={handleLogin}
                className="group relative px-8 py-4 bg-emerald-500 text-zinc-950 rounded-xl font-black text-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-3 overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_50px_rgba(16,185,129,0.4)]"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                <LogIn size={20} />
                {t('app.start_journey')}
              </button>
              
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center overflow-hidden ring-1 ring-white/5">
                      <img src={`https://picsum.photos/seed/finance${i}/40/40`} alt="user" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <p className="text-white font-bold">{t('app.join_users', { count: '2,400' })}</p>
                  <p className="text-zinc-500 text-xs">{t('app.managing_monthly', { amount: '$4M' })}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Auth Modal */}
          <AnimatePresence>
            {showAuthModal && (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAuthModal(false)}
                  className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden"
                >
                  <AuthModal onClose={() => setShowAuthModal(false)} />
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Right Side: 3D Visuals */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative perspective-1000 hidden lg:block"
          >
            {/* Floating 3D Cards */}
            <motion.div
              animate={{ 
                y: [0, -30, 0],
                rotateZ: [0, 1, 0],
                rotateX: [5, 10, 5]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-20 bg-zinc-900/40 backdrop-blur-2xl border border-white/10 p-10 rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] transform-gpu"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                    <Wallet className="text-zinc-950" size={28} />
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-500 text-sm font-black uppercase tracking-[0.2em]">Live Assets</p>
                    <p className="text-4xl font-black text-white tracking-tight">$42,890.50</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-black text-zinc-400 uppercase tracking-widest">
                    <span>Portfolio Health</span>
                    <span className="text-emerald-400">Excellent</span>
                  </div>
                  <div className="h-3 w-full bg-zinc-800/50 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '82%' }}
                      transition={{ duration: 2.5, delay: 1, ease: "circOut" }}
                      className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-blue-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/5 p-5 rounded-3xl border border-white/5 backdrop-blur-md">
                    <TrendingUp className="text-emerald-400 mb-3" size={24} />
                    <p className="text-xs text-zinc-500 font-black uppercase tracking-widest">Yield</p>
                    <p className="text-2xl font-black text-white">+18.4%</p>
                  </div>
                  <div className="bg-white/5 p-5 rounded-3xl border border-white/5 backdrop-blur-md">
                    <TrendingDown className="text-blue-400 mb-3" size={24} />
                    <p className="text-xs text-zinc-500 font-black uppercase tracking-widest">Burn</p>
                    <p className="text-2xl font-black text-white">-4.2%</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Decorative Floating Orbs */}
            <motion.div 
              animate={{ 
                y: [0, 50, 0],
                x: [0, 20, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px]"
            />
            <motion.div 
              animate={{ 
                y: [0, -60, 0],
                x: [0, -30, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]"
            />
          </motion.div>
        </div>
      </div>
    );
  }

  if (user && !profile?.currency) {
    return <CurrencySetup onComplete={handleCurrencyComplete} />;
  }

  const currencySymbol = profile?.currency?.symbol || '$';

  return (
    <>
      <Layout 
      user={user} 
      profile={profile}
      onLogout={handleLogout} 
      onConverterClick={() => setShowCurrencyConverter(true)}
      onSettingsClick={() => {
        setActiveTab('settings');
        setSettingsTab('general');
      }}
      onRecapClick={() => {
        setActiveTab('settings');
        setSettingsTab('recap');
      }}
      onAboutClick={() => setActiveTab('about')}
      onTermsClick={() => setActiveTab('terms')}
      onPoliciesClick={() => setActiveTab('policies')}
      onSecurityClick={() => setActiveTab('security')}
      onSupportClick={() => setActiveTab('support')}
      onNotificationsClick={() => setShowNotifications(true)}
      unreadNotifications={notifications.filter(n => !n.read).length}
    >
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="overflow-x-auto pb-4 sm:pb-0 no-scrollbar">
          <div className="flex bg-white dark:bg-white/5 backdrop-blur-md p-1.5 rounded-[24px] mb-8 w-max sm:w-fit mx-auto sm:mx-0 border border-zinc-200 dark:border-white/10 transition-colors">
            <TabButton 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')}
              icon={<PieChart size={18} />}
              label={t('nav.overview')}
            />
            <TabButton 
              active={activeTab === 'expenses'} 
              onClick={() => setActiveTab('expenses')}
              icon={<List size={18} />}
              label={t('nav.transactions')}
            />
            <TabButton 
              active={activeTab === 'insights'} 
              onClick={() => setActiveTab('insights')} 
              icon={<Lightbulb size={18} />}
              label={t('nav.insights')}
            />
            <TabButton 
              active={activeTab === 'budgets'} 
              onClick={() => setActiveTab('budgets')} 
              icon={<Target size={18} />}
              label={t('nav.budgets')}
            />
            <TabButton 
              active={activeTab === 'goals'} 
              onClick={() => setActiveTab('goals')} 
              icon={<TrendingUp size={18} />}
              label={t('nav.goals')}
            />
            <TabButton 
              active={activeTab === 'challenges'} 
              onClick={() => setActiveTab('challenges')} 
              icon={<Trophy size={18} />}
              label={t('nav.quests')}
            />
            {profile?.streak && (
              <div className="flex items-center gap-2 px-4 py-3 text-orange-500 font-black text-sm uppercase tracking-widest border-l border-zinc-200 dark:border-white/10 ml-2">
                <Flame size={18} className="animate-pulse" />
                {profile.streak.count}
              </div>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard 
                transactions={transactions} 
                budgets={profile?.budgets || []} 
                goals={profile?.goals || []}
                currencySymbol={currencySymbol}
                userName={profile?.displayName || user?.displayName || user?.email?.split('@')[0]}
                onAddTransaction={() => setShowAddForm(true)}
              />
            )}
            {activeTab === 'expenses' && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{t('nav.transactions')}</h3>
                    <p className="text-zinc-500 text-[13px] font-bold uppercase tracking-widest">{t('transactions.history')}</p>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => setShowScanner(true)}
                      className="flex-1 sm:flex-none px-6 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all"
                    >
                      <Camera size={18} className="text-[#747482]" />
                      {t('app.scan_receipt')}
                    </button>
                    <button 
                      onClick={() => setShowAddForm(true)}
                      className="flex-1 sm:flex-none px-6 py-4 bg-emerald-500 text-zinc-950 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all"
                    >
                      <Plus size={18} />
                      {t('app.add_entry')}
                    </button>
                  </div>
                </div>
                <TransactionList transactions={transactions} currencySymbol={currencySymbol} />
              </div>
            )}
            {activeTab === 'insights' && (
              <SmartInsights transactions={transactions} budgets={profile?.budgets || []} currencySymbol={currencySymbol} />
            )}
            {activeTab === 'budgets' && (
              <BudgetManager 
                uid={user.uid} 
                budgets={profile?.budgets || []} 
                currencySymbol={currencySymbol} 
                onAddClick={() => setShowAddBudget(true)}
              />
            )}
            {activeTab === 'goals' && (
              <GoalTracker 
                uid={user.uid} 
                goals={profile?.goals || []} 
                currencySymbol={currencySymbol} 
                onAddClick={() => setShowAddGoal(true)}
              />
            )}
            {activeTab === 'challenges' && (
              <SavingChallenges 
                uid={user.uid}
                currencySymbol={currencySymbol}
              />
            )}
            {activeTab === 'settings' && profile && (
              <ProfileSettings 
                user={user}
                profile={profile} 
                transactions={transactions} 
                currencySymbol={currencySymbol}
                onViewRecap={() => setSettingsTab('recap')}
                initialTab={settingsTab}
              />
            )}
            {activeTab === 'about' && (
              <About 
                onBack={() => setActiveTab('dashboard')} 
              />
            )}
            {activeTab === 'terms' && (
              <Legal type="terms" onBack={() => setActiveTab('dashboard')} />
            )}
            {activeTab === 'policies' && (
              <Legal type="policies" onBack={() => setActiveTab('dashboard')} />
            )}
            {activeTab === 'security' && (
              <Legal type="security" onBack={() => setActiveTab('dashboard')} />
            )}
            {activeTab === 'support' && (
              <Support onBack={() => setActiveTab('dashboard')} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Layout>

    {/* Modals & Overlays - Moved outside Layout to fix stacking context issues */}
    <AnimatePresence>
      {showCurrencyConverter && (
        <div key="currency-converter-modal" className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCurrencyConverter(false)}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm cursor-pointer"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative z-10 w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-[40px] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-6 right-6 z-20">
              <button 
                onClick={() => setShowCurrencyConverter(false)}
                className="p-2 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <CurrencyConverter />
          </motion.div>
        </div>
      )}

      {showAddBudget && (
        <div key="add-budget-modal" className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddBudget(false)}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm cursor-pointer"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-[40px] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <BudgetForm 
              onClose={() => setShowAddBudget(false)}
              onAdd={handleAddBudget}
              currencySymbol={currencySymbol}
              customCategories={profile?.customCategories || []}
            />
          </motion.div>
        </div>
      )}

      {showAddForm && (
        <div key="add-transaction-modal" className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowAddForm(false);
              setScanData(null);
            }}
            className="absolute inset-0 bg-zinc-950/80 sm:bg-zinc-950/60 dark:bg-zinc-950/95 backdrop-blur-md sm:backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-[40px] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
          >
            <TransactionForm 
              onClose={() => {
                setShowAddForm(false);
                setScanData(null);
              }}
              uid={user.uid}
              currencySymbol={currencySymbol}
              budgets={profile?.budgets || []}
              transactions={transactions}
              initialData={scanData}
              customCategories={profile?.customCategories || []}
            />
          </motion.div>
        </div>
      )}

      {showAddGoal && (
        <div key="add-goal-modal" className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddGoal(false)}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm cursor-pointer"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-[40px] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <GoalForm 
              onClose={() => setShowAddGoal(false)}
              onAdd={handleAddGoal}
              currencySymbol={currencySymbol}
              customCategories={profile?.customCategories || []}
            />
          </motion.div>
        </div>
      )}

      {showScanner && (
        <ReceiptScanner 
          onScanComplete={(data) => {
            setScanData(data);
            setShowScanner(false);
            setShowAddForm(true);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
      {showNotifications && (
        <NotificationCenter 
          uid={user?.uid || ''}
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
        />
      )}
      {showStreakPrompt && profile?.streak && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowStreakPrompt(false)}
            className="absolute inset-0 bg-zinc-950/60 dark:bg-zinc-950/90 backdrop-blur-xl"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-[40px] shadow-2xl overflow-hidden"
          >
            <StreakPrompt 
              streakCount={profile.streak.count}
              onClose={() => setShowStreakPrompt(false)}
              onAddTransaction={() => {
                setShowStreakPrompt(false);
                setShowAddForm(true);
              }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </>
);
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
        active 
          ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20' 
          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="hidden xs:inline">{label}</span>
      <span className="xs:hidden">{active ? label : ''}</span>
    </button>
  );
}
