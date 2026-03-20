import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, MessageSquare, Mail, HelpCircle, ExternalLink, 
  Shield, Book, LifeBuoy, Search, Send, Bot, 
  CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface SupportProps {
  onBack: () => void;
}

interface Message {
  role: 'user' | 'bot';
  content: string;
}

export default function Support({ onBack }: SupportProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: 'bot', content: "Hi! I'm Clari, your AI financial assistant. How can I help you with ClariFi today?" }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

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
          systemInstruction: "You are Clari, the AI support assistant for ClariFi, an intelligent personal finance application. You help users with budgeting, expense tracking, and navigating the app. Be professional, helpful, and concise. If you don't know something about the app, suggest contacting human support.",
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
      title: "Email Support",
      description: "Send us a detailed message and we'll get back within 24 hours.",
      action: "Send Email",
      onClick: () => window.location.href = "mailto:support@clarifi.app"
    },
    {
      icon: <HelpCircle className="text-purple-500" size={24} />,
      title: "Help Center",
      description: "Browse our extensive documentation and FAQs.",
      action: "Visit Docs",
      onClick: () => {}
    }
  ];

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
            <button 
              onClick={cat.onClick}
              className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-all"
            >
              {cat.action}
              <ExternalLink size={14} />
            </button>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Frequently Asked Questions</h3>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Quick answers to common queries</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all w-full sm:w-64"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, i) => (
                <div 
                  key={i} 
                  className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden transition-all"
                >
                  <button 
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full p-6 flex items-center justify-between text-left hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <p className="font-black text-zinc-900 dark:text-white text-sm">{faq.question}</p>
                    {expandedFaq === i ? <ChevronUp size={18} className="text-zinc-400" /> : <ChevronDown size={18} className="text-zinc-400" />}
                  </button>
                  <AnimatePresence>
                    {expandedFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-6"
                      >
                        <p className="text-sm text-zinc-500 leading-relaxed border-t border-zinc-200 dark:border-white/5 pt-4">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-zinc-50 dark:bg-white/5 rounded-3xl border border-dashed border-zinc-200 dark:border-white/10">
                <p className="text-zinc-500 text-sm font-medium">No FAQs found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">System Status</h3>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Real-time service health</p>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-8 rounded-[32px] space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {systemStatus.map((service, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-white/10">
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">{service.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{service.status}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <CheckCircle2 className="text-emerald-500" size={20} />
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">All systems are operational. No issues reported.</p>
            </div>
          </div>

          <div className="space-y-1 pt-4">
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
        </div>
      </div>

      {/* AI Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChat(false)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md cursor-pointer"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-[600px]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Chat Header */}
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
                  onClick={() => setShowChat(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors text-zinc-500"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Chat Messages */}
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

              {/* Chat Input */}
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
    </div>
  );
}
