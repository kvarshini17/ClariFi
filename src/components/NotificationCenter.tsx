import React, { useEffect, useRef } from 'react';
import { AppNotification } from '../types';
import { Bell, X, Info, AlertCircle, CheckCircle2, Trash2, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { doc, updateDoc, deleteDoc, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface NotificationCenterProps {
  uid: string;
  notifications: AppNotification[];
  onClose: () => void;
}

export default function NotificationCenter({ uid, notifications, onClose }: NotificationCenterProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { read: true });
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const clearAll = async () => {
    if (notifications.length === 0) return;
    
    const batch = writeBatch(db);
    notifications.forEach(n => {
      batch.delete(doc(db, 'notifications', n.id));
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertCircle className="text-amber-500" size={20} />;
      case 'success': return <CheckCircle2 className="text-emerald-500" size={20} />;
      default: return <Info className="text-indigo-500" size={20} />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-end p-4 sm:p-6 bg-black/20 backdrop-blur-sm pointer-events-auto">
      <motion.div 
        ref={containerRef}
        initial={{ opacity: 0, y: -20, scale: 0.95, x: 20 }}
        animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
        exit={{ opacity: 0, y: -20, scale: 0.95, x: 20 }}
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-[40px] shadow-[0_40px_80px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-zinc-50/50 dark:bg-white/2">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm flex items-center justify-center border border-zinc-100 dark:border-white/5">
                <Bell className="text-zinc-900 dark:text-white" size={24} />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-900">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Activity</h3>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mt-0.5">
                {unreadCount} New Alerts
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-2xl transition-all hover:scale-110"
          >
            <X size={20} />
          </button>
        </div>

        {/* Actions Bar */}
        {notifications.length > 0 && (
          <div className="px-8 py-3 bg-zinc-50/30 dark:bg-white/1 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center">
            <button 
              onClick={markAllAsRead}
              className="flex items-center gap-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:opacity-70 transition-opacity disabled:opacity-30"
              disabled={unreadCount === 0}
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
            <button 
              onClick={clearAll}
              className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-rose-500 transition-colors"
            >
              <Trash2 size={14} />
              Clear all
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-16 text-center space-y-4"
              >
                <div className="w-20 h-20 bg-zinc-50 dark:bg-white/2 rounded-full flex items-center justify-center mx-auto">
                  <Bell className="text-zinc-200 dark:text-white/10" size={40} />
                </div>
                <div>
                  <p className="text-zinc-900 dark:text-white font-black tracking-tight">All Caught Up!</p>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">No new notifications at the moment.</p>
                </div>
              </motion.div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-white/5">
                {notifications.map((notif) => (
                  <motion.div 
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`p-8 flex gap-5 transition-all relative group ${notif.read ? 'opacity-60 grayscale-[0.5]' : 'bg-indigo-500/[0.02]'}`}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                  >
                    {!notif.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />
                    )}
                    
                    <div className="mt-1 shrink-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notif.read ? 'bg-zinc-100 dark:bg-white/5' : 'bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-white/5'}`}>
                        {getIcon(notif.type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`font-black tracking-tight text-sm truncate ${notif.read ? 'text-zinc-500' : 'text-zinc-900 dark:text-white'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-zinc-400 font-black whitespace-nowrap pt-0.5">
                          {format(notif.createdAt, 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed font-medium">
                        {notif.message}
                      </p>
                      
                      <div className="flex gap-6 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.read && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                            className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline"
                          >
                            Mark Read
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                          className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
