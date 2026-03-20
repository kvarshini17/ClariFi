import React, { useState, useRef } from 'react';
import { Camera, Upload, Sparkles, X, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

interface ReceiptScannerProps {
  onScanComplete: (data: { amount: number; category: string; note: string }) => void;
  onClose: () => void;
}

export default function ReceiptScanner({ onScanComplete, onClose }: ReceiptScannerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("FileReader constructor failed:", err);
        setError("Your browser does not support file reading. Please try a different browser.");
      }
    }
  };

  const scanReceipt = async () => {
    if (!image) return;
    setIsScanning(true);
    setError(null);

    try {
      if (typeof GoogleGenAI !== 'function') {
        throw new Error("GoogleGenAI constructor is not available.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const base64Data = image.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Extract the total amount, category (one of: Food, Travel, Bills, Shopping, Health, Entertainment, Others), and a short note from this receipt. Return ONLY a JSON object like: {\"amount\": 12.50, \"category\": \"Food\", \"note\": \"Lunch at Cafe\"}" },
              { inlineData: { mimeType: "image/jpeg", data: base64Data } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text || '{}');
      if (result.amount) {
        onScanComplete(result);
      } else {
        throw new Error("Could not extract data from receipt");
      }
    } catch (err) {
      console.error("Scanning Error:", err);
      setError("Failed to scan receipt. Please try again or enter manually.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xl"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-[48px] shadow-2xl overflow-hidden transition-colors"
      >
        <div className="p-8 sm:p-12 space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                <Sparkles className="text-emerald-400" size={28} />
                Receipt Scanner
              </h2>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">AI-Powered Data Extraction</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-all text-zinc-500"
            >
              <X size={20} />
            </button>
          </div>

          {!image ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-video border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-[32px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5 transition-all group"
            >
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <Camera className="text-emerald-400" size={32} />
              </div>
              <div className="text-center">
                <p className="text-zinc-900 dark:text-white font-black">Click to scan or upload</p>
                <p className="text-zinc-500 text-xs">Supports JPG, PNG</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative aspect-video rounded-[32px] overflow-hidden border border-zinc-200 dark:border-white/10 shadow-2xl">
                <img src={image} alt="Receipt" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-4 right-4 p-2 bg-zinc-950/50 backdrop-blur-md text-white rounded-full hover:bg-zinc-950 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium flex items-center gap-2">
                  <X size={16} />
                  {error}
                </div>
              )}

              <button
                onClick={scanReceipt}
                disabled={isScanning}
                className="w-full group relative px-8 py-5 bg-emerald-500 text-zinc-950 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3 overflow-hidden shadow-xl shadow-emerald-500/20 disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={24} />
                    Extract Data
                  </>
                )}
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">
            <CheckCircle2 size={12} className="text-emerald-500" />
            Secure & Private Processing
          </div>
        </div>
      </motion.div>
    </div>
  );
}
