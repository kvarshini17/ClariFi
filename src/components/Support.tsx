import * as React from 'react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, MessageSquare, Mail, HelpCircle, ExternalLink, 
  Shield, Book, LifeBuoy, Search, Send, Bot, 
  CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp,
  MessageCircle, User, AtSign, Type, FileText, Plus
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, Timestamp, updateDoc, doc, getDocFromServer } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: string;
}

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, errorInfo: '' };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message };
  }

  render() {
    if ((this as any).state.hasError) {
      let displayMessage = "Something went wrong. Please try again later.";
      try {
        const parsed = JSON.parse((this as any).state.errorInfo);
        if (parsed.error && parsed.error.includes('permission-denied')) {
          displayMessage = "You don't have permission to perform this action. If you are an admin, please ensure you are logged in with the correct account.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-[32px] p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="text-red-500" size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Application Error</h3>
              <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                {displayMessage}
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

interface SupportProps {
  onBack: () => void;
}

interface Message {
  role: 'user' | 'bot';
  content: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'pending' | 'replied' | 'closed';
  reply?: string;
  createdAt: Timestamp;
}

// --- Sub-components for Performance Optimization ---

// --- Sub-components for Performance Optimization ---

const AIChatModal = React.memo(({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: 'bot', content: "Hi! I'm Clari, your AI financial assistant. How can I help you with ClariFi today?" }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [chatMessages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isTyping) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: {
          systemInstruction: "You are Clari, the AI support assistant for ClariFi. Help users with budgeting, tracking, and app navigation. Be professional, helpful, and very concise. Suggest human support if unsure.",
        },
      });

      const botResponse = response.text || "I'm sorry, I couldn't process that. Please try again or contact our support team.";
      setChatMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setChatMessages(prev => [...prev, { role: 'bot', content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm cursor-pointer"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 150 }}
            className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[550px] will-change-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-zinc-950">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Clari Assistant</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors text-zinc-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-emerald-500 text-zinc-950 rounded-tr-none' 
                      : 'bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white rounded-tl-none border border-zinc-200 dark:border-white/10'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-zinc-100 dark:bg-white/5 p-4 rounded-2xl rounded-tl-none border border-zinc-200 dark:border-white/10">
                    <Loader2 className="animate-spin text-zinc-400" size={16} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-6 bg-zinc-50 dark:bg-white/5 border-t border-zinc-200 dark:border-white/10">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Type your message..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
                <button 
                  type="submit"
                  disabled={!userInput.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-emerald-500 text-zinc-950 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

const ContactUsModal = React.memo(({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [contactForm, setContactForm] = useState({ subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.subject.trim() || !contactForm.message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const path = 'support_messages';
      await addDoc(collection(db, path), {
        uid: user.uid,
        email: user.email,
        subject: contactForm.subject.trim(),
        message: contactForm.message.trim(),
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setSubmitSuccess(true);
      setContactForm({ subject: '', message: '' });
      setTimeout(() => {
        setSubmitSuccess(false);
        onClose();
      }, 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'support_messages');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && onClose()}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm cursor-pointer"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col will-change-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Contact Support</h3>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">We'll respond within 24h</p>
                </div>
              </div>
              {!isSubmitting && (
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors text-zinc-500"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="p-6">
              {submitSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 flex flex-col items-center text-center space-y-4"
                >
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                    <CheckCircle2 size={48} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Message Sent!</h4>
                    <p className="text-zinc-500 font-medium">Thank you for reaching out. Our team will get back to you shortly.</p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Type size={12} />
                      Subject
                    </label>
                    <input 
                      required
                      type="text"
                      placeholder="What can we help you with?"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <FileText size={12} />
                      Message
                    </label>
                    <textarea 
                      required
                      rows={5}
                      placeholder="Describe your issue or question in detail..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

const CategoryCard = React.memo(({ cat, index }: { cat: any, index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.05 }}
    onClick={cat.onClick}
    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-8 rounded-[40px] space-y-8 hover:border-emerald-500/30 transition-all group cursor-pointer shadow-xl shadow-black/5 relative overflow-hidden will-change-transform"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-2xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors hidden sm:block" />
    <div className="w-16 h-16 bg-zinc-50 dark:bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform relative z-10 will-change-transform">
      {cat.icon}
    </div>
    <div className="space-y-3 relative z-10">
      <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{cat.title}</h3>
      <p className="text-zinc-500 text-sm leading-relaxed font-medium">{cat.description}</p>
    </div>
    <div className="pt-4 relative z-10">
      <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 group-hover:gap-4 transition-all">
        {cat.action}
        <ExternalLink size={14} />
      </div>
    </div>
  </motion.div>
));

const FAQItem = React.memo(({ faq, index, isExpanded, onToggle }: { faq: any, index: number, isExpanded: boolean, onToggle: () => void }) => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl overflow-hidden transition-all hover:shadow-xl hover:shadow-black/5 will-change-transform">
    <button 
      onClick={onToggle}
      className="w-full p-8 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
    >
      <p className="font-black text-zinc-900 dark:text-white text-lg tracking-tight">{faq.question}</p>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-emerald-500 text-zinc-950 rotate-180' : 'bg-zinc-100 dark:bg-white/5 text-zinc-400'}`}>
        <ChevronDown size={20} />
      </div>
    </button>
    <AnimatePresence mode="wait">
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 150 }}
          className="px-8 pb-8"
        >
          <div className="pt-6 border-t border-zinc-100 dark:border-white/5">
            <p className="text-zinc-500 leading-relaxed font-medium">
              {faq.answer}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
));

const SystemHealth = React.memo(({ systemStatus }: { systemStatus: any[] }) => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-10 rounded-[40px] space-y-8 shadow-xl shadow-black/5 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {systemStatus.map((service, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{service.name}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{service.status}</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: '100%' }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              className="h-full bg-emerald-500" 
            />
          </div>
        </div>
      ))}
    </div>
    <div className="flex items-center gap-4 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl">
      <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
        <CheckCircle2 size={24} />
      </div>
      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">All systems are operational. No issues reported in the last 24 hours.</p>
    </div>
  </div>
));

const ResourceCard = React.memo(({ icon: Icon, title, subtitle, onClick, colorClass, hoverClass }: { icon: any, title: string, subtitle: string, onClick: () => void, colorClass: string, hoverClass: string }) => (
  <div 
    onClick={onClick}
    className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-8 rounded-[32px] flex items-center justify-between ${hoverClass} transition-all cursor-pointer group shadow-xl shadow-black/5 will-change-transform`}
  >
    <div className="flex items-center gap-6">
      <div className={`w-14 h-14 ${colorClass} rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="font-black text-zinc-900 dark:text-white text-xl tracking-tight">{title}</p>
        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{subtitle}</p>
      </div>
    </div>
    <div className={`w-10 h-10 rounded-full bg-zinc-50 dark:bg-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-950 transition-all`}>
      <ChevronDown className="-rotate-90" size={20} />
    </div>
  </div>
));

const TicketItem = React.memo(({ ticket, isAdmin, onReply, onClose, isReplying, replyText, setReplyText, onCancelReply, onSendReply, isSubmitting }: { 
  ticket: SupportTicket, 
  isAdmin: boolean, 
  onReply: (id: string) => void, 
  onClose: (id: string) => void,
  isReplying: boolean,
  replyText: string,
  setReplyText: (text: string) => void,
  onCancelReply: () => void,
  onSendReply: (e: React.FormEvent) => void,
  isSubmitting: boolean
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-[32px] space-y-6 shadow-xl shadow-black/5 will-change-transform"
  >
    <div className="flex justify-between items-start gap-4">
      <div className="space-y-1">
        <h4 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">{ticket.subject}</h4>
        <div className="flex items-center gap-3">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
            <User size={10} />
            {(ticket as any).email}
          </p>
          <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            {ticket.createdAt?.toDate().toLocaleDateString()}
          </p>
        </div>
      </div>
      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
        ticket.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
        ticket.status === 'replied' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
        'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      }`}>
        {ticket.status}
      </span>
    </div>
    
    <div className="p-6 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5">
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{ticket.message}</p>
    </div>
    
    {ticket.reply && (
      <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
        <div className="flex items-center gap-2">
          <Bot size={14} className="text-emerald-500" />
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Official Response</p>
        </div>
        <p className="text-sm text-zinc-900 dark:text-white font-bold leading-relaxed">{ticket.reply}</p>
      </div>
    )}

    {isAdmin && (
      <div className="pt-6 border-t border-zinc-100 dark:border-white/5 space-y-6">
        {isReplying ? (
          <form onSubmit={onSendReply} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Your Response</label>
              <textarea 
                required
                autoFocus
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response to the user..."
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none"
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-emerald-500 text-zinc-950 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
              >
                {isSubmitting ? "Sending..." : "Send Reply"}
              </button>
              <button 
                type="button"
                onClick={onCancelReply}
                className="px-8 py-3 bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex gap-3">
            <button 
              onClick={() => onReply(ticket.id)}
              className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10 dark:shadow-white/10"
            >
              Reply to User
            </button>
            {ticket.status !== 'closed' && (
              <button 
                onClick={() => onClose(ticket.id)}
                className="px-8 py-3 bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-white/10 transition-all"
              >
                Close Ticket
              </button>
            )}
          </div>
        )}
      </div>
    )}
  </motion.div>
));

const MyTicketsModal = React.memo(({ 
  isOpen, 
  onClose, 
  isAdmin, 
  tickets, 
  onCloseTicket, 
  onReplySubmit, 
  isSubmitting 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  isAdmin: boolean, 
  tickets: SupportTicket[], 
  onCloseTicket: (id: string) => void, 
  onReplySubmit: (id: string, text: string) => Promise<void>, 
  isSubmitting: boolean 
}) => {
  const [ticketSearch, setTicketSearch] = useState('');
  const [replyForm, setReplyForm] = useState<{ id: string, text: string } | null>(null);

  const filteredTickets = useMemo(() => {
    if (!ticketSearch.trim()) return tickets;
    const search = ticketSearch.toLowerCase();
    return tickets.filter(ticket => 
      ticket.subject.toLowerCase().includes(search) ||
      ticket.message.toLowerCase().includes(search) ||
      (ticket.reply && ticket.reply.toLowerCase().includes(search)) ||
      ((ticket as any).email && (ticket as any).email.toLowerCase().includes(search))
    );
  }, [tickets, ticketSearch]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (replyForm) {
      await onReplySubmit(replyForm.id, replyForm.text);
      setReplyForm(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm cursor-pointer"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[80vh] will-change-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                  {isAdmin ? "Admin Support Dashboard" : "My Support Tickets"}
                </h3>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  {isAdmin ? "Manage all incoming requests" : "Track your support history"}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors text-zinc-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="relative mb-4">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search tickets by subject, message, or email..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 pl-14 pr-24 text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                />
                {ticketSearch && (
                  <button 
                    onClick={() => setTicketSearch('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>

              {filteredTickets.length > 0 ? (
                filteredTickets.slice(0, 20).map((ticket) => (
                  <TicketItem 
                    key={ticket.id} 
                    ticket={ticket} 
                    isAdmin={isAdmin} 
                    onReply={(id) => setReplyForm({ id, text: '' })}
                    onClose={onCloseTicket}
                    isReplying={replyForm?.id === ticket.id}
                    replyText={replyForm?.text || ''}
                    setReplyText={(text) => setReplyForm(prev => prev ? { ...prev, text } : null)}
                    onCancelReply={() => setReplyForm(null)}
                    onSendReply={handleSendReply}
                    isSubmitting={isSubmitting}
                  />
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20">
                  <div className="w-24 h-24 bg-zinc-100 dark:bg-white/5 rounded-[32px] flex items-center justify-center text-zinc-300 dark:text-zinc-700">
                    {ticketSearch ? <Search size={48} /> : <MessageCircle size={48} />}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                      {ticketSearch ? "No matches found" : "No tickets yet"}
                    </p>
                    <p className="text-zinc-500 text-sm font-medium max-w-[240px]">
                      {ticketSearch 
                        ? `We couldn't find any tickets matching "${ticketSearch}"`
                        : "When you send a support request, it will appear here."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

const DocumentationModal = React.memo(({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [activeDocSection, setActiveDocSection] = useState('getting-started');
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm cursor-pointer"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-4xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-[80vh] will-change-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full md:w-72 bg-zinc-50 dark:bg-white/5 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-white/10 p-6 md:p-8 flex flex-col gap-6 md:gap-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                  <Book size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Docs</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">v2.4.0</p>
                </div>
              </div>
              <nav className="flex flex-row md:flex-col gap-2 md:gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 no-scrollbar">
                {[
                  { id: 'getting-started', label: 'Start', fullLabel: 'Getting Started', icon: <Bot size={14} /> },
                  { id: 'features', label: 'Features', fullLabel: 'Core Features', icon: <LifeBuoy size={14} /> },
                  { id: 'financial-dna', label: 'DNA', fullLabel: 'Financial DNA', icon: <Search size={14} /> },
                  { id: 'pro-tips', label: 'Tips', fullLabel: 'Pro Tips', icon: <CheckCircle2 size={14} /> }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveDocSection(item.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      activeDocSection === item.id 
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' 
                        : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'
                    }`}
                  >
                    {item.icon}
                    <span className="md:hidden">{item.label}</span>
                    <span className="hidden md:inline">{item.fullLabel}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar relative will-change-transform">
              <button 
                onClick={onClose}
                className="absolute top-8 right-8 p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors text-zinc-500"
              >
                <X size={20} />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDocSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {activeDocSection === 'getting-started' && (
                    <div className="space-y-6">
                      <h4 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Getting Started</h4>
                      <p className="text-lg text-zinc-500 leading-relaxed font-medium">
                        Welcome to ClariFi! Our mission is to help you achieve financial freedom through intelligent tracking and insights. 
                      </p>
                      <div className="p-8 bg-zinc-50 dark:bg-white/5 rounded-3xl border border-zinc-200 dark:border-white/10 space-y-4">
                        <h5 className="font-black text-zinc-900 dark:text-white">Quick Setup</h5>
                        <ul className="space-y-3">
                          {['Connect your bank accounts', 'Set your monthly savings goal', 'Scan your first receipt', 'Create your first budget'].map((step, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-zinc-500 font-medium">
                              <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 text-[10px] font-black">
                                {i + 1}
                              </div>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeDocSection === 'features' && (
                    <div className="space-y-8">
                      <h4 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Core Features</h4>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="p-8 bg-zinc-50 dark:bg-white/5 rounded-3xl border border-zinc-200 dark:border-white/10 space-y-4">
                          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                            <Bot size={24} />
                          </div>
                          <h5 className="text-xl font-black text-zinc-900 dark:text-white">AI Receipt Scanning</h5>
                          <p className="text-zinc-500 leading-relaxed font-medium">
                            Stop typing manually! Use our AI scanner to automatically extract data from your receipts. 
                            Just snap a photo and ClariFi will categorize it for you using advanced OCR technology.
                          </p>
                        </div>
                        <div className="p-8 bg-zinc-50 dark:bg-white/5 rounded-3xl border border-zinc-200 dark:border-white/10 space-y-4">
                          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                            <LifeBuoy size={24} />
                          </div>
                          <h5 className="text-xl font-black text-zinc-900 dark:text-white">Smart Budgets</h5>
                          <p className="text-zinc-500 leading-relaxed font-medium">
                            Set monthly limits for categories like Food or Travel. We'll notify you when you're 
                            approaching your limit so you can stay on track and avoid overspending.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeDocSection === 'financial-dna' && (
                    <div className="space-y-6">
                      <h4 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Financial DNA</h4>
                      <p className="text-lg text-zinc-500 leading-relaxed font-medium">
                        Your Financial DNA is a unique score that analyzes your spending patterns, risk tolerance, and savings consistency.
                      </p>
                      <div className="p-8 bg-purple-500/5 border border-purple-500/10 rounded-3xl space-y-4">
                        <p className="text-zinc-500 font-medium">
                          The more you track, the more accurate your profile becomes. 
                          Check the "Insights" tab to see your current score and personalized tips tailored to your spending personality.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeDocSection === 'pro-tips' && (
                    <div className="space-y-6">
                      <h4 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Pro Tips</h4>
                      <div className="space-y-4">
                        <div className="p-8 bg-emerald-500 rounded-[32px] text-zinc-950 shadow-xl shadow-emerald-500/20">
                          <h4 className="text-2xl font-black mb-4 tracking-tight">Gamify Your Savings</h4>
                          <p className="text-lg font-bold opacity-80 leading-relaxed">
                            Use the "Challenges" feature to build momentum. Start with the "No-Spend Weekend" challenge to see how much you can save by cutting out non-essentials.
                          </p>
                        </div>
                        <div className="p-8 bg-zinc-900 dark:bg-white rounded-[32px] text-white dark:text-zinc-950 shadow-xl shadow-black/10">
                          <h4 className="text-2xl font-black mb-4 tracking-tight">Weekly Reviews</h4>
                          <p className="text-lg font-bold opacity-80 leading-relaxed">
                            Spend 5 minutes every Sunday reviewing your transactions. This small habit increases financial awareness by 40%.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

const UserGuideModal = React.memo(({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [activeGuideSection, setActiveGuideSection] = useState('dashboard');
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm cursor-pointer"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-4xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-[80vh] will-change-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full md:w-72 bg-zinc-50 dark:bg-white/5 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-white/10 p-6 md:p-8 flex flex-col gap-6 md:gap-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Book size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Guide</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">User Manual</p>
                </div>
              </div>
              <nav className="flex flex-row md:flex-col gap-2 md:gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 no-scrollbar">
                {[
                  { id: 'dashboard', label: 'Dash', fullLabel: 'Dashboard', icon: <Bot size={14} /> },
                  { id: 'transactions', label: 'Txns', fullLabel: 'Transactions', icon: <Plus size={14} /> },
                  { id: 'budgets', label: 'Budgets', fullLabel: 'Budgets', icon: <LifeBuoy size={14} /> },
                  { id: 'goals', label: 'Goals', fullLabel: 'Goals', icon: <CheckCircle2 size={14} /> }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveGuideSection(item.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      activeGuideSection === item.id 
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                        : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'
                    }`}
                  >
                    {item.icon}
                    <span className="md:hidden">{item.label}</span>
                    <span className="hidden md:inline">{item.fullLabel}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar relative will-change-transform">
              <button 
                onClick={onClose}
                className="absolute top-8 right-8 p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors text-zinc-500"
              >
                <X size={20} />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeGuideSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {activeGuideSection === 'dashboard' && (
                    <div className="space-y-6">
                      <h4 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Dashboard Overview</h4>
                      <p className="text-lg text-zinc-500 leading-relaxed font-medium">
                        The dashboard is your financial command center. Here you can see your total balance, monthly spending, and recent transactions at a glance.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-6 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-white/10">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Total Balance</p>
                          <p className="text-2xl font-black text-zinc-900 dark:text-white">$12,450.00</p>
                        </div>
                        <div className="p-6 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-white/10">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Monthly Spend</p>
                          <p className="text-2xl font-black text-emerald-500">$3,210.00</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeGuideSection === 'transactions' && (
                    <div className="space-y-6">
                      <h4 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Adding Transactions</h4>
                      <p className="text-lg text-zinc-500 leading-relaxed font-medium">
                        Click the "+" button to add a new expense or income. You can manually enter details or use the AI Receipt Scanner for automatic entry.
                      </p>
                      <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-3xl space-y-4">
                        <h5 className="font-black text-zinc-900 dark:text-white">AI Scanner Pro Tip</h5>
                        <p className="text-sm text-zinc-500 font-medium">
                          Ensure your receipt is flat and well-lit for the best scanning results. The AI will automatically detect the merchant, date, and total amount.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeGuideSection === 'budgets' && (
                    <div className="space-y-6">
                      <h4 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Setting Budgets</h4>
                      <p className="text-lg text-zinc-500 leading-relaxed font-medium">
                        Navigate to the Budgets tab to set spending limits for different categories. ClariFi will notify you when you're close to your limit.
                      </p>
                      <div className="space-y-4">
                        {['Food & Dining', 'Transportation', 'Entertainment'].map((cat, i) => (
                          <div key={i} className="p-4 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/10 flex items-center justify-between">
                            <span className="text-sm font-bold text-zinc-900 dark:text-white">{cat}</span>
                            <div className="w-32 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${70 - i * 15}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeGuideSection === 'goals' && (
                    <div className="space-y-6">
                      <h4 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Financial Goals</h4>
                      <p className="text-lg text-zinc-500 leading-relaxed font-medium">
                        Create savings goals for big purchases or emergency funds. Track your progress and see how much more you need to save.
                      </p>
                      <div className="p-8 bg-emerald-500 rounded-[32px] text-zinc-950 shadow-xl shadow-emerald-500/20">
                        <h4 className="text-2xl font-black mb-2 tracking-tight">Reach Your Goals Faster</h4>
                        <p className="font-bold opacity-80">
                          Set up automatic transfers to your savings account to ensure you hit your targets every month.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

const SecurityWhitepaperModal = React.memo(({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [activeSecuritySection, setActiveSecuritySection] = useState('encryption');
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm cursor-pointer"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-4xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-[80vh] will-change-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full md:w-72 bg-zinc-50 dark:bg-white/5 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-white/10 p-6 md:p-8 flex flex-col gap-6 md:gap-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-zinc-950 shadow-lg shadow-emerald-500/20">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Security</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Whitepaper</p>
                </div>
              </div>
              <nav className="flex flex-row md:flex-col gap-2 md:gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 no-scrollbar">
                {[
                  { id: 'encryption', label: 'AES', fullLabel: 'Encryption', icon: <Shield size={14} /> },
                  { id: 'auth', label: 'Auth', fullLabel: 'Authentication', icon: <User size={14} /> },
                  { id: 'isolation', label: 'Isolation', fullLabel: 'Data Isolation', icon: <Search size={14} /> },
                  { id: 'compliance', label: 'Legal', fullLabel: 'Compliance', icon: <CheckCircle2 size={14} /> }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSecuritySection(item.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      activeSecuritySection === item.id 
                        ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20' 
                        : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'
                    }`}
                  >
                    {item.icon}
                    <span className="md:hidden">{item.label}</span>
                    <span className="hidden md:inline">{item.fullLabel}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar relative will-change-transform">
              <button 
                onClick={onClose}
                className="absolute top-8 right-8 p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors text-zinc-500"
              >
                <X size={20} />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSecuritySection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {activeSecuritySection === 'encryption' && (
                    <div className="space-y-6">
                      <h4 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Encryption</h4>
                      <p className="text-lg text-zinc-500 leading-relaxed font-medium">
                        All your financial data is encrypted at rest and in transit using industry-standard protocols.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-8 bg-zinc-50 dark:bg-white/5 rounded-3xl border border-zinc-200 dark:border-white/10 space-y-4">
                          <h5 className="font-black text-zinc-900 dark:text-white">At Rest</h5>
                          <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                            We use AES-256 encryption to protect your data stored on our servers. This is the same standard used by banks and government agencies.
                          </p>
                        </div>
                        <div className="p-8 bg-zinc-50 dark:bg-white/5 rounded-3xl border border-zinc-200 dark:border-white/10 space-y-4">
                          <h5 className="font-black text-zinc-900 dark:text-white">In Transit</h5>
                          <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                            All data moving between your device and our servers is protected by TLS 1.3, ensuring it cannot be intercepted.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSecuritySection === 'auth' && (
                    <div className="space-y-6">
                      <h4 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Authentication</h4>
                      <p className="text-lg text-zinc-500 leading-relaxed font-medium">
                        We use Firebase Authentication for secure user sign-in and session management.
                      </p>
                      <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl space-y-4">
                        <h5 className="font-black text-zinc-900 dark:text-white">No Passwords Stored</h5>
                        <p className="text-sm text-zinc-500 font-medium">
                          Your passwords are never stored on our servers. We use secure tokens for all sessions, reducing the risk of credential theft.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeSecuritySection === 'isolation' && (
                    <div className="space-y-6">
                      <h4 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Data Isolation</h4>
                      <p className="text-lg text-zinc-500 leading-relaxed font-medium">
                        Our Firestore security rules ensure that your data is strictly isolated from other users.
                      </p>
                      <div className="p-8 bg-zinc-900 dark:bg-white rounded-[32px] text-white dark:text-zinc-950 shadow-xl shadow-black/10">
                        <h4 className="text-2xl font-black mb-4 tracking-tight">Zero-Trust Architecture</h4>
                        <p className="text-lg font-bold opacity-80 leading-relaxed">
                          Every single database request is verified against your unique user ID. No other user can ever access your financial records.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeSecuritySection === 'compliance' && (
                    <div className="space-y-6">
                      <h4 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Compliance</h4>
                      <p className="text-lg text-zinc-500 leading-relaxed font-medium">
                        ClariFi is built with privacy in mind, adhering to global data protection standards.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {['GDPR Compliant', 'CCPA Ready', 'SOC2 Principles', 'Privacy First'].map((item, i) => (
                          <div key={i} className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-white/10">
                            <CheckCircle2 className="text-emerald-500" size={16} />
                            <span className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

export default function Support({ onBack }: SupportProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showDocs, setShowDocs] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [allTickets, setAllTickets] = useState<SupportTicket[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = auth.currentUser?.email === 'chishiyazzcode@gmail.com';

  useEffect(() => {
    if (!auth.currentUser) return;

    // Validate Connection to Firestore
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    };
    testConnection();

    // Listen to user's own tickets
    const q = query(
      collection(db, 'support_messages'),
      where('uid', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupportTicket[];
      setMyTickets(tickets);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'support_messages (my tickets)');
    });

    // If admin, listen to all tickets
    let unsubscribeAll: (() => void) | null = null;
    if (isAdmin) {
      const qAll = query(
        collection(db, 'support_messages'),
        orderBy('createdAt', 'desc')
      );
      unsubscribeAll = onSnapshot(qAll, (snapshot) => {
        const tickets = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SupportTicket[];
        setAllTickets(tickets);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'support_messages (all tickets)');
      });
    }

    return () => {
      unsubscribe();
      if (unsubscribeAll) unsubscribeAll();
    };
  }, [auth.currentUser, isAdmin]);


  const handleReplySubmit = async (id: string, text: string) => {
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const ticketRef = doc(db, 'support_messages', id);
      await updateDoc(ticketRef, {
        reply: text.trim(),
        status: 'replied'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `support_messages/${id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseTicket = async (id: string) => {
    try {
      const path = `support_messages/${id}`;
      const ticketRef = doc(db, 'support_messages', id);
      await updateDoc(ticketRef, { status: 'closed' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `support_messages/${id}`);
    }
  };

  const supportCategories = [
    {
      icon: <Bot className="text-emerald-500" size={24} />,
      title: "AI Assistant",
      description: "Get instant answers from our intelligent support bot.",
      action: "Chat with Clari",
      onClick: () => setShowChat(true)
    },
    {
      icon: <Mail className="text-blue-500" size={24} />,
      title: "Contact Us",
      description: "Send us a detailed message and we'll get back within 24 hours.",
      action: "Open Form",
      onClick: () => setShowContactForm(true)
    },
    {
      icon: <HelpCircle className="text-purple-500" size={24} />,
      title: "Help Center",
      description: "Browse our extensive documentation and FAQs.",
      action: "Visit Docs",
      onClick: () => setShowDocs(true)
    }
  ];

  const adminCategory = isAdmin ? {
    icon: <Shield className="text-red-500" size={24} />,
    title: "Admin Dashboard",
    description: "Manage all support tickets and system health.",
    action: "View All Tickets",
    onClick: () => setShowMyTickets(true)
  } : {
    icon: <MessageCircle className="text-emerald-500" size={24} />,
    title: "My Tickets",
    description: "View and track your previous support requests.",
    action: "View History",
    onClick: () => setShowMyTickets(true)
  };

  const faqs = [
    {
      question: "How secure is my financial data?",
      answer: "We use bank-grade encryption and strict Firestore security rules. Your data is only accessible by you. We never share your personal financial information with third parties."
    },
    {
      question: "Can I export my transaction history?",
      answer: "Yes, you can export your data in CSV or PDF format from the Settings > General tab. This allows you to use your data in other spreadsheet applications."
    },
    {
      question: "How does the AI receipt scanner work?",
      answer: "Our AI uses advanced OCR and natural language processing to extract amounts, categories, and dates from your photos. Simply upload a clear photo of your receipt and we'll do the rest."
    },
    {
      question: "What is the Financial DNA score?",
      answer: "Your Financial DNA is a unique profile calculated based on your spending habits, savings rate, and category distribution. It helps you understand your financial personality."
    },
    {
      question: "How do I set up a budget?",
      answer: "Navigate to the Budgets tab and click 'Add Budget'. You can set monthly limits for specific categories like Food, Travel, or Entertainment."
    }
  ];

  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const systemStatus = [
    { name: "Core API", status: "operational" },
    { name: "AI Services", status: "operational" },
    { name: "Database", status: "operational" },
    { name: "Auth System", status: "operational" }
  ];

  return (
    <ErrorBoundary>
      <div className="space-y-12 md:space-y-16 pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
            <LifeBuoy size={12} />
            Support Center
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tighter leading-tight md:leading-none">
            How can we <br className="hidden md:block" />
            <span className="text-emerald-500">help you?</span>
          </h2>
          <p className="text-zinc-500 text-base md:text-lg font-medium max-w-md leading-relaxed">
            Get instant answers from Clari, browse our guides, or reach out to our human support team.
          </p>
        </div>
        <button 
          onClick={onBack}
          className="w-full md:w-auto px-8 py-4 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-zinc-200 dark:border-white/10 shadow-xl shadow-black/5 flex items-center justify-center gap-2 group"
        >
          <X size={16} className="group-hover:rotate-90 transition-transform" />
          Close Support
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...supportCategories, adminCategory].map((cat, i) => (
          <CategoryCard key={i} cat={cat} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-7 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Common Questions</h3>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Everything you need to know</p>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-6 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all w-full sm:w-80 shadow-xl shadow-black/5"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, i) => (
                <FAQItem 
                  key={i} 
                  faq={faq} 
                  index={i} 
                  isExpanded={expandedFaq === i} 
                  onToggle={() => setExpandedFaq(expandedFaq === i ? null : i)} 
                />
              ))
            ) : (
              <div className="text-center py-20 bg-zinc-50 dark:bg-white/5 rounded-[40px] border-2 border-dashed border-zinc-200 dark:border-white/10 space-y-4">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-zinc-400">
                  <Search size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-900 dark:text-white font-black">No results found</p>
                  <p className="text-zinc-500 text-sm font-medium">Try searching for something else</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-12">
          <div className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">System Health</h3>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Live service monitoring</p>
            </div>
            
            <SystemHealth systemStatus={systemStatus} />
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Resources</h3>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Deep dive into ClariFi</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <ResourceCard 
                icon={Book}
                title="User Guide"
                subtitle="Complete Walkthrough"
                onClick={() => setShowGuide(true)}
                colorClass="bg-blue-500/10 text-blue-500"
                hoverClass="hover:border-blue-500/30"
              />
              <ResourceCard 
                icon={Shield}
                title="Security Whitepaper"
                subtitle="Privacy & Compliance"
                onClick={() => setShowSecurity(true)}
                colorClass="bg-emerald-500/10 text-emerald-500"
                hoverClass="hover:border-emerald-500/30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Modal */}
      <AIChatModal isOpen={showChat} onClose={() => setShowChat(false)} />

      {/* Contact Us Modal */}
      <ContactUsModal isOpen={showContactForm} onClose={() => setShowContactForm(false)} />

      {/* My Tickets Modal */}
      <MyTicketsModal 
        isOpen={showMyTickets} 
        onClose={() => setShowMyTickets(false)} 
        isAdmin={isAdmin} 
        tickets={isAdmin ? allTickets : myTickets} 
        onCloseTicket={handleCloseTicket} 
        onReplySubmit={handleReplySubmit} 
        isSubmitting={isSubmitting} 
      />

      {/* Documentation Modal */}
      <DocumentationModal isOpen={showDocs} onClose={() => setShowDocs(false)} />

      {/* User Guide Modal */}
      <UserGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

      {/* Security Whitepaper Modal */}
      <SecurityWhitepaperModal isOpen={showSecurity} onClose={() => setShowSecurity(false)} />
      </div>
    </ErrorBoundary>
  );
}
