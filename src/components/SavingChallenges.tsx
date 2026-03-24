import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Target, Calendar, Award, Flame, Zap, CheckCircle2, XCircle, Info, Plus, Trash2, TrendingUp } from 'lucide-react';
import { SavingChallenge, Category } from '../types';
import { createNotification } from '../services/notificationService';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, updateDoc, doc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

interface SavingChallengesProps {
  uid: string;
  currencySymbol: string;
}

export default function SavingChallenges({ uid, currencySymbol }: SavingChallengesProps) {
  const [challenges, setChallenges] = useState<SavingChallenge[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    targetAmount: 0,
    duration: 30,
    category: 'Food' as Category,
    reward: 100,
    icon: 'target'
  });

  useEffect(() => {
    if (!uid) return;
    
    const q = query(
      collection(db, 'challenges'),
      where('uid', '==', uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (() => {
          try {
            const d = doc.data().createdAt?.toDate();
            return d && !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
          } catch {
            return new Date().toISOString();
          }
        })()
      })) as SavingChallenge[];
      setChallenges(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'challenges');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  const handleAddChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newChallenge.targetAmount <= 0) return;
    
    try {
      await addDoc(collection(db, 'challenges'), {
        uid,
        ...newChallenge,
        currentAmount: 0,
        startDate: new Date().toISOString(),
        status: 'active',
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewChallenge({
        title: '',
        description: '',
        targetAmount: 0,
        duration: 30,
        category: 'Food',
        reward: 100,
        icon: 'target'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'challenges');
    }
  };

  const updateProgress = async (id: string, amount: number) => {
    const challenge = challenges.find(c => c.id === id);
    if (!challenge) return;

    const newAmount = Math.min(challenge.targetAmount, challenge.currentAmount + amount);
    const isNowCompleted = newAmount >= challenge.targetAmount && challenge.status !== 'completed';
    const status = isNowCompleted ? 'completed' : challenge.status;

    try {
      await updateDoc(doc(db, 'challenges', id), {
        currentAmount: newAmount,
        status
      });

      if (isNowCompleted) {
        await createNotification({
          uid,
          title: 'Quest Completed! 🏆',
          message: `Congratulations! You've finished the "${challenge.title}" quest and earned ${challenge.reward} XP!`,
          type: 'success'
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `challenges/${id}`);
    }
  };

  const deleteChallenge = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'challenges', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `challenges/${id}`);
    }
  };

  const markAllAsRead = async () => {
    const batch = writeBatch(db);
    // This is for notifications, but let's keep it here if needed or move to NotificationCenter
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'failed': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="relative overflow-hidden p-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[40px] text-white shadow-2xl shadow-indigo-200 dark:shadow-none">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
              <Trophy size={24} className="text-white" />
            </div>
            <span className="text-[13px] font-black uppercase tracking-[0.2em] text-[#ebedf3]">Saving Quests</span>
          </div>
          <h3 className="text-[28px] font-black mb-2 tracking-tight">Gamify Your Savings</h3>
          <p className="text-indigo-100 max-w-md text-[15px] leading-relaxed opacity-80">
            Turn your financial goals into epic quests. Earn points, build streaks, and master your money.
          </p>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl" />
        
        <button
          onClick={() => setShowAddModal(true)}
          className="absolute bottom-8 right-8 z-20 p-4 bg-white text-indigo-600 rounded-2xl font-black shadow-xl hover:scale-105 transition-transform flex items-center gap-2 text-[14px]"
        >
          <Plus size={24} />
          <span className="text-sm uppercase tracking-widest">New Quest</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active', value: challenges.filter(c => c.status === 'active').length, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Won', value: challenges.filter(c => c.status === 'completed').length, icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Points', value: challenges.filter(c => c.status === 'completed').reduce((acc, curr) => acc + curr.reward, 0), icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Success Rate', value: challenges.length ? `${Math.round((challenges.filter(c => c.status === 'completed').length / challenges.length) * 100)}%` : '0%', icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-500/10' }
        ].map((stat, i) => (
          <div key={i} className="p-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-white/5 flex flex-col items-center text-center">
            <div className={`p-2 ${stat.bg} ${stat.color} rounded-xl mb-2`}>
              <stat.icon size={20} />
            </div>
            <p className="text-[12px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">{stat.label}</p>
            <p className="text-xl font-black text-zinc-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {challenges.map((challenge) => (
            <motion.div
              key={challenge.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-white/5 p-6 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${getStatusColor(challenge.status)} border`}>
                  <Target size={28} />
                </div>
                <div className="flex flex-col items-end">
                  <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${getStatusColor(challenge.status)}`}>
                    {challenge.status}
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-amber-500">
                    <Zap size={14} fill="currentColor" />
                    <span className="text-xs font-black">+{challenge.reward} XP</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <h3 className="text-[15px] font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
                  {challenge.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {challenge.description}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[12px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Progress</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-zinc-900 dark:text-white">
                        {currencySymbol}{challenge.currentAmount.toLocaleString()}
                      </span>
                      <span className="text-[13px] font-bold text-zinc-400">
                        / {currencySymbol}{challenge.targetAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {Math.round((challenge.currentAmount / challenge.targetAmount) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-3 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(challenge.currentAmount / challenge.targetAmount) * 100}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                  />
                </div>

                {challenge.status === 'active' && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => updateProgress(challenge.id, 10)}
                      className="py-3 bg-zinc-50 dark:bg-white/5 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      +{currencySymbol}10
                    </button>
                    <button
                      onClick={() => updateProgress(challenge.id, 50)}
                      className="py-3 bg-zinc-50 dark:bg-white/5 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      +{currencySymbol}50
                    </button>
                  </div>
                )}

                {challenge.status === 'completed' && (
                  <div className="flex items-center justify-center gap-2 py-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                    <CheckCircle2 size={18} />
                    <span className="text-sm font-black uppercase tracking-widest">Quest Mastered</span>
                  </div>
                )}
              </div>

              {/* Delete Button */}
              <button
                onClick={() => deleteChallenge(challenge.id)}
                className="absolute top-4 right-4 p-2 text-zinc-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {challenges.length === 0 && !loading && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Target size={40} className="text-zinc-300" />
            </div>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">No Active Quests</h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto mb-8">
              The world of savings awaits. Start your first quest and begin your journey to wealth.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none hover:scale-105 transition-transform"
            >
              Start Your First Quest
            </button>
          </div>
        )}
      </div>

      {/* Add Quest Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative z-10 w-full max-w-xl bg-white dark:bg-zinc-900 rounded-[40px] shadow-2xl overflow-hidden border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="p-8 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">New Quest</h3>
                  <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-1">Define your challenge</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                  <XCircle size={32} />
                </button>
              </div>

              <form onSubmit={handleAddChallenge} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">Quest Name</label>
                      <input
                        required
                        type="text"
                        value={newChallenge.title}
                        onChange={e => setNewChallenge({ ...newChallenge, title: e.target.value })}
                        placeholder="e.g. The Frugal Week"
                        className="w-full px-6 py-4 bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">Description</label>
                      <textarea
                        required
                        value={newChallenge.description}
                        onChange={e => setNewChallenge({ ...newChallenge, description: e.target.value })}
                        placeholder="What's the mission?"
                        className="w-full px-6 py-4 bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-medium h-32 resize-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">Target Amount ({currencySymbol})</label>
                      <input
                        required
                        type="number"
                        value={newChallenge.targetAmount || ''}
                        onChange={e => setNewChallenge({ ...newChallenge, targetAmount: Number(e.target.value) })}
                        placeholder="500"
                        className="w-full px-6 py-4 bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-black text-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">Quest Duration (Days)</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[7, 14, 30].map(days => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => setNewChallenge({ ...newChallenge, duration: days })}
                            className={`py-3 rounded-xl text-xs font-black transition-all ${newChallenge.duration === days ? 'bg-indigo-600 text-white' : 'bg-zinc-50 dark:bg-white/5 text-zinc-500'}`}
                          >
                            {days}D
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl space-y-2">
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <Award size={18} />
                        <span className="text-sm font-black uppercase tracking-widest">Potential Reward</span>
                      </div>
                      <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                        +{newChallenge.reward} XP
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-indigo-200 dark:shadow-none mt-4"
                >
                  Begin Quest
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
