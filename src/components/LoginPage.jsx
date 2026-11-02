import React, { useState } from 'react';
import { 
  Braces, 
  Mail, 
  Lock, 
  User, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  ShieldCheck,
  Zap,
  Sun,
  Moon
} from 'lucide-react';
import { 
  loginWithGoogle, 
  loginWithEmail, 
  registerWithEmail, 
  resetPassword 
} from '../config/firebase';

export default function LoginPage({ 
  onLoginSuccess, 
  onBackToHome, 
  theme = 'light',
  onToggleTheme 
}) {
  const isDark = theme === 'dark';
  
  // Modes: 'signin' | 'signup' | 'forgot'
  const [mode, setMode] = useState('signin');
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // States
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Clean error messages from Firebase error codes
  const parseFirebaseError = (error) => {
    const code = error?.code || '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password. Please verify and try again.';
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in instead.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/popup-closed-by-user':
        return 'Google sign-in popup was closed before finishing.';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked by browser. Please allow popups for this site.';
      case 'auth/network-request-failed':
        return 'Network connection issue. Please check your internet connection.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful attempts. Please try again in a few minutes.';
      default:
        return error.message || 'An error occurred during authentication. Please try again.';
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      setSuccessMsg(`Welcome, ${user.displayName || user.email}!`);
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(user);
      }, 700);
    } catch (err) {
      setErrorMsg(parseFirebaseError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (mode === 'forgot') {
      setLoading(true);
      try {
        await resetPassword(email.trim());
        setSuccessMsg('Password reset link sent! Check your inbox.');
      } catch (err) {
        setErrorMsg(parseFirebaseError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please check and try again.');
        return;
      }

      setLoading(true);
      try {
        const user = await registerWithEmail(email.trim(), password, name.trim());
        setSuccessMsg(`Account created! Welcome, ${user.displayName || user.email}.`);
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess(user);
        }, 700);
      } catch (err) {
        setErrorMsg(parseFirebaseError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    // Sign in mode
    setLoading(true);
    try {
      const user = await loginWithEmail(email.trim(), password);
      setSuccessMsg(`Welcome back, ${user.displayName || user.email}!`);
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(user);
      }, 700);
    } catch (err) {
      setErrorMsg(parseFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 relative overflow-hidden ${
      isDark ? 'bg-[#060911] text-slate-100' : 'bg-[#FAFBFC] text-slate-900'
    }`}>

      {/* AMBIENT BACKGROUND GLOWS */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-3xl"
          style={{ 
            background: isDark 
              ? 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.08) 50%, transparent 80%)'
              : 'radial-gradient(ellipse, rgba(99,102,241,0.10) 0%, rgba(139,92,246,0.05) 50%, transparent 80%)'
          }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ 
            background: isDark
              ? 'radial-gradient(ellipse, rgba(236,72,153,0.12) 0%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(236,72,153,0.06) 0%, transparent 70%)'
          }} />
        <div className={`absolute inset-0 ${isDark ? 'opacity-[0.025]' : 'opacity-[0.04]'}`}
          style={{ 
            backgroundImage: `linear-gradient(${isDark ? 'rgba(148,163,184,1)' : 'rgba(100,116,139,1)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(148,163,184,1)' : 'rgba(100,116,139,1)'} 1px, transparent 1px)`, 
            backgroundSize: '48px 48px' 
          }} />
      </div>

      {/* TOP HEADER BAR */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToHome}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shadow-2xs cursor-pointer ${
            isDark 
              ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800' 
              : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to DreamKit</span>
        </button>

        <div className="flex items-center gap-3">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
              className={`p-2 rounded-xl transition-all border ${
                isDark
                  ? 'bg-slate-800/80 text-amber-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
        </div>
      </header>

      {/* MAIN AUTH CONTAINER */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">

          {/* CARD CONTAINER */}
          <div className={`rounded-3xl border shadow-2xl p-6 sm:p-8 transition-all ${
            isDark 
              ? 'bg-[#0B0F1A]/90 border-white/[0.08] shadow-black/60 backdrop-blur-xl' 
              : 'bg-white/95 border-slate-200/90 shadow-slate-300/40 backdrop-blur-xl'
          }`}>

            {/* BRAND LOGO */}
            <div className="text-center space-y-3 mb-6">
              <div className="inline-flex relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/25"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <Braces className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-[#0B0F1A]" />
              </div>

              <div>
                <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {mode === 'signin' && 'Welcome back'}
                  {mode === 'signup' && 'Create your account'}
                  {mode === 'forgot' && 'Reset your password'}
                </h1>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {mode === 'signin' && 'Sign in to access DreamKit Studio & synced settings'}
                  {mode === 'signup' && 'Get instant access to 42+ developer productivity tools'}
                  {mode === 'forgot' && 'Enter your email address and we will send a reset link'}
                </p>
              </div>
            </div>

            {/* TAB SELECTOR: SIGN IN / SIGN UP (when not in forgot mode) */}
            {mode !== 'forgot' && (
              <div className={`p-1 rounded-xl border flex items-center mb-6 ${
                isDark ? 'bg-black/30 border-white/[0.06]' : 'bg-slate-100/80 border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* GOOGLE / GMAIL ONE-CLICK BUTTON */}
            {mode !== 'forgot' && (
              <div className="space-y-4 mb-6">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || loading}
                  className={`w-full py-3 px-4 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-60 shadow-xs ${
                    isDark 
                      ? 'bg-white/[0.05] border-white/10 text-white hover:bg-white/[0.1] hover:border-white/20' 
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {googleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  ) : (
                    /* Google 'G' Multi-Color SVG */
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>

                {/* DIVIDER */}
                <div className="relative flex items-center justify-center">
                  <div className={`w-full border-t ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`} />
                  <span className={`absolute px-3 text-[11px] font-semibold uppercase tracking-wider ${
                    isDark ? 'bg-[#0B0F1A] text-slate-500' : 'bg-white text-slate-400'
                  }`}>
                    or with email
                  </span>
                </div>
              </div>
            )}

            {/* ERROR BANNER */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* SUCCESS BANNER */}
            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* AUTH FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* FULL NAME (Signup only) */}
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Alex Mercer"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
                        isDark 
                          ? 'bg-black/40 border-white/10 text-white placeholder-slate-500 focus:border-indigo-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* EMAIL FIELD */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="alex@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
                      isDark 
                        ? 'bg-black/40 border-white/10 text-white placeholder-slate-500 focus:border-indigo-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>

              {/* PASSWORD FIELD (When not forgot password) */}
              {mode !== 'forgot' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
                        isDark 
                          ? 'bg-black/40 border-white/10 text-white placeholder-slate-500 focus:border-indigo-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* CONFIRM PASSWORD (Signup only) */}
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
                        isDark 
                          ? 'bg-black/40 border-white/10 text-white placeholder-slate-500 focus:border-indigo-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* REMEMBER ME CHECKBOX (Signin only) */}
              {mode === 'signin' && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Remember this device</span>
                  </label>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #db2777 100%)' }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 fill-current text-amber-300" />
                )}
                <span>
                  {mode === 'signin' && (loading ? 'Signing in...' : 'Sign In')}
                  {mode === 'signup' && (loading ? 'Creating account...' : 'Create Free Account')}
                  {mode === 'forgot' && (loading ? 'Sending link...' : 'Send Password Reset Link')}
                </span>
              </button>
            </form>

            {/* FORGOT PASSWORD CANCEL */}
            {mode === 'forgot' && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            )}

            {/* PRIVACY ASSURANCE */}
            <div className={`mt-6 pt-4 border-t flex items-center justify-center gap-2 text-[11px] ${
              isDark ? 'border-white/[0.06] text-slate-500' : 'border-slate-100 text-slate-500'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Firebase SSL Authenticated • 100% In-Browser Privacy</span>
            </div>

          </div>

          {/* BOTTOM QUICK FOOTER */}
          <div className="text-center mt-6 text-xs text-slate-500 space-x-4">
            <button type="button" onClick={onBackToHome} className="hover:underline">Home</button>
            <span>•</span>
            <span className="text-slate-400">DreamKit Studio v2.5</span>
            <span>•</span>
            <span>Zero Telemetry</span>
          </div>

        </div>
      </main>

    </div>
  );
}
