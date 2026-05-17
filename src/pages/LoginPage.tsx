import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, LogIn, UserPlus, ArrowRight, Github } from 'lucide-react';

export function LoginPage() {
  const { signIn, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-6 text-white overflow-hidden relative">
      {/* Animated background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[100px] animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-xl p-8 rounded-[40px] border border-white/20 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.img 
            initial={{ scale: 0.5, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            src="https://img.icons8.com/color/512/ludo.png" 
            alt="Ludo Pro" 
            className="w-24 h-24 mb-4 drop-shadow-2xl"
          />
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">Ludo Master Pro</h1>
          <p className="text-blue-200 text-sm font-medium">Join the ultimate Ludo battle</p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl mb-8">
          <button 
            onClick={() => setMode('login')}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${mode === 'login' ? 'bg-white text-blue-950 shadow-lg' : 'text-blue-200 hover:bg-white/5'}`}
          >
            LOGIN
          </button>
          <button 
            onClick={() => setMode('signup')}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${mode === 'signup' ? 'bg-white text-blue-950 shadow-lg' : 'text-blue-200 hover:bg-white/5'}`}
          >
            SIGN UP
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-400 focus:bg-white/10 transition-all text-sm"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
            <input 
              type="email" 
              placeholder="Email Address" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-400 focus:bg-white/10 transition-all text-sm"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
            <input 
              type="password" 
              placeholder="Password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-400 focus:bg-white/10 transition-all text-sm"
            />
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-xs font-bold text-center bg-red-400/10 py-2 rounded-xl border border-red-400/20"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-sm tracking-widest shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] font-black text-blue-300 tracking-widest">OR CONTINUE WITH</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <button 
          onClick={handleGoogleSignIn}
          className="w-full bg-white text-blue-950 py-4 rounded-2xl font-black text-sm tracking-widest shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          GOOGLE
        </button>

        <p className="mt-8 text-center text-[10px] font-medium text-blue-200/50 uppercase tracking-[0.2em] leading-relaxed">
          By continuing you agree to our<br />
          <span className="text-blue-300 cursor-pointer hover:text-white">Terms of Service</span> & <span className="text-blue-300 cursor-pointer hover:text-white">Privacy Policy</span>
        </p>
      </motion.div>
    </div>
  );
}
