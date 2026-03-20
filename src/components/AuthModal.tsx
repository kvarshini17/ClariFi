import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { X, Mail, Lock, LogIn, UserPlus, Chrome, AlertCircle, Globe, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { COUNTRIES } from '../constants';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // 1: Credentials, 2: Currency (for signup)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && step === 1) {
      if (!name && !isLogin) {
        setError("Please enter your name.");
        return;
      }
      setStep(2);
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create profile immediately with selected currency and name
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: name,
          country: selectedCountry.name,
          currency: selectedCountry.currency,
          createdAt: serverTimestamp()
        }, { merge: true });
      }
      onClose();
    } catch (err: any) {
      console.error("Auth Error:", err);
      let message = "An error occurred during authentication.";
      
      if (err.code === 'auth/invalid-credential') {
        message = "Invalid email or password. Please check your credentials and try again.";
      } else if (err.code === 'auth/user-not-found') {
        message = "No account found with this email. Please sign up instead.";
      } else if (err.code === 'auth/wrong-password') {
        message = "Incorrect password. Please try again.";
      } else if (err.code === 'auth/email-already-in-use') {
        message = "This email is already registered. Please sign in instead.";
      } else if (err.code === 'auth/weak-password') {
        message = "Password should be at least 6 characters.";
      } else if (err.message) {
        message = err.message;
      }
      
      setError(message);
      if (!isLogin) setStep(1); // Go back to credentials if error during signup
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      if (typeof GoogleAuthProvider !== 'function') {
        throw new Error("GoogleAuthProvider constructor is not available.");
      }
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      console.error("Google Login Error:", err);
      setError(err.message || "Failed to sign in with Google.");
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white tracking-tight">
            {isLogin ? 'Welcome Back' : (step === 1 ? 'Create Account' : 'Final Step')}
          </h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
            {isLogin ? 'Access your dashboard' : (step === 1 ? 'Start your journey today' : 'Set your local currency')}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10 text-zinc-500 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-6">
        {isLogin || step === 1 ? (
          <>
            {/* Google Login Button - Only show on step 1 */}
            <button 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 py-4 rounded-xl text-white font-bold hover:bg-white/10 transition-all active:scale-[0.98]"
            >
              <Chrome size={20} className="text-emerald-400" />
              Continue with Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-3 text-zinc-600 font-black tracking-widest">Or email</span>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-3">
                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <LogIn size={12} /> Full Name
                    </label>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-white placeholder:text-zinc-700 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-bold"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Mail size={12} /> Email Address
                  </label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-white placeholder:text-zinc-700 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Lock size={12} /> Password
                  </label>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-white placeholder:text-zinc-700 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-2 text-red-400 text-[10px] font-bold bg-red-400/5 p-3 rounded-lg border border-red-400/10"
                  >
                    <AlertCircle size={12} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit"
                disabled={loading}
                className="w-full group relative px-8 py-5 bg-emerald-500 text-zinc-950 rounded-xl font-black text-lg transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 overflow-hidden shadow-lg shadow-emerald-500/10 disabled:opacity-50"
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Next Step')}
                {isLogin ? <LogIn size={20} /> : <ChevronRight size={20} />}
              </button>
            </form>
          </>
        ) : (
          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div className="space-y-3">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Globe size={12} /> Select Currency
              </label>
              <div className="grid grid-cols-1 gap-1.5 max-h-[240px] overflow-y-auto pr-1.5 custom-scrollbar">
                {COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => setSelectedCountry(country)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      selectedCountry.code === country.code 
                        ? 'bg-emerald-500/10 border-emerald-500 text-white' 
                        : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/10'
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-bold">{country.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">{country.currency.code} ({country.currency.symbol})</p>
                    </div>
                    {selectedCountry.code === country.code && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-white/5 border border-white/10 text-white py-4 rounded-xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-1"
              >
                <ChevronLeft size={20} /> Back
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="flex-[2] bg-emerald-500 text-zinc-950 py-4 rounded-xl font-black text-lg hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Complete Signup'}
              </button>
            </div>
          </form>
        )}

        <div className="text-center space-y-4">
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setStep(1);
              setError('');
            }}
            className="text-zinc-500 hover:text-white text-xs font-bold transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>

          <div className="pt-4 border-t border-white/5">
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest leading-relaxed">
              By continuing, you agree to ClariFi's<br />
              <span className="text-emerald-500/80">Terms of Service</span> and <span className="text-emerald-500/80">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
