import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogIn,
  Sun,
  Moon,
  Sparkles
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
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/popup-closed-by-user':
        return 'Google sign-in popup was closed before completion.';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked by browser. Please allow popups.';
      case 'auth/network-request-failed':
        return 'Network issue. Please check your internet connection.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again in a few minutes.';
      default:
        return error.message || 'An authentication error occurred. Please try again.';
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
      }, 500);
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
        setSuccessMsg('Reset link sent! Please check your inbox.');
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
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }

      setLoading(true);
      try {
        const user = await registerWithEmail(email.trim(), password, name.trim());
        setSuccessMsg(`Account created! Welcome, ${user.displayName || user.email}.`);
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess(user);
        }, 500);
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
      }, 500);
    } catch (err) {
      setErrorMsg(parseFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`h-screen w-full flex flex-col lg:flex-row font-sans select-none overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#0B0F17] text-slate-100' : 'bg-white text-slate-900'
      }`}
    >
      {/* =========================================================================
          LEFT PANEL: Full Screen Auth & Input Form (42% width on desktop)
         ========================================================================= */}
      <div className="w-full lg:w-[48%] xl:w-[42%] h-full flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-y-auto bg-white dark:bg-[#0E121A] border-r border-slate-200 dark:border-white/[0.08] shrink-0">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 group cursor-pointer text-left"
            title="Return to Home"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#673DE6] to-[#8B5CF6] flex items-center justify-center text-white shadow-xs shadow-[#673DE6]/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
              DreamKit <span className="text-[#673DE6] dark:text-[#A78BFA]">Pro</span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onBackToHome}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              title="Back to home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Form Section */}
        <div className="my-auto max-w-[360px] w-full mx-auto py-6">
          {/* Indigo Door / Login Badge with Faint Grid Squares Behind */}
          <div className="relative flex flex-col items-center justify-center text-center mb-5">
            {/* Subtle Grid Squares Pattern */}
            <div
              className="absolute -top-3 w-44 h-16 opacity-30 pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)',
                backgroundSize: '14px 14px'
              }}
            />

            {/* Glowing Indigo/Violet 3D Badge */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#673DE6] via-[#4F46E5] to-[#8B5CF6] flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 relative z-10 mb-2.5">
              <LogIn className="w-5 h-5 text-white" />
            </div>

            {/* Heading & Subtitle */}
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {mode === 'signin' && 'Login to your account!'}
              {mode === 'signup' && 'Create your account!'}
              {mode === 'forgot' && 'Reset your password!'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[290px]">
              {mode === 'signin' && 'Enter your registered email address and password to login!'}
              {mode === 'signup' && 'Sign up to sync your preferences and access offline tools!'}
              {mode === 'forgot' && 'Enter your email address and we will send a reset link!'}
            </p>
          </div>

          {/* Feedback Banners */}
          {errorMsg && (
            <div className="mb-3.5 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-tight">{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-3.5 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2 text-emerald-600 dark:text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-tight">{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name (Sign Up only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="eg. Alex Turner"
                    className="w-full text-xs py-2.5 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="eg. developer@dreamkit.com"
                  required
                  className="w-full text-xs py-2.5 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>
            </div>

            {/* Password Input (Sign In & Sign Up) */}
            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full text-xs py-2.5 pl-9 pr-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (Sign Up only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full text-xs py-2.5 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  />
                </div>
              </div>
            )}

            {/* Remember me & Forgot Password Row */}
            {mode === 'signin' && (
              <div className="flex items-center justify-between text-[11px] pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                >
                  Forgot Password ?
                </button>
              </div>
            )}

            {/* Primary Action Button (Indigo to Violet Gradient Matching App Theme) */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {mode === 'signin' && 'Login'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'forgot' && 'Send Reset Link'}
              </span>
            </button>
          </form>

          {/* Single Google Login Button */}
          {mode !== 'forgot' && (
            <div className="mt-4">
              <div className="relative flex items-center justify-center mb-3">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                <span className="bg-white dark:bg-[#0D121F] px-3 text-[11px] text-slate-400 uppercase tracking-wider relative shrink-0">
                  Or continue with
                </span>
              </div>

              {/* Prominent Full-Width Google Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
                title="Sign in with Google"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
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
                <span>Sign in with Google</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Switcher */}
        <div className="pt-3 text-center text-xs text-slate-500">
          {mode === 'signin' && (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer ml-1"
              >
                Sign up
              </button>
            </p>
          )}
          {mode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer ml-1"
              >
                Log in
              </button>
            </p>
          )}
          {mode === 'forgot' && (
            <p>
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer ml-1"
              >
                Back to login
              </button>
            </p>
          )}
        </div>
      </div>

      {/* =========================================================================
          RIGHT PANEL: Expanded Solar Orbit Showcase (Synced with App Brand Colors)
         ========================================================================= */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[58%] h-full overflow-y-auto bg-gradient-to-b from-[#FAF8FF] via-[#F5F3FF] to-[#EDE9FE] dark:from-[#0B0F17] dark:via-[#131128] dark:to-[#0B0F17] p-8 sm:p-12 flex-col justify-between items-center text-center relative scrollbar-thin">
        {/* Top Title Banner */}
        <div className="relative z-10 pt-2 max-w-lg">
          <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            Develop Faster <span className="text-[#673DE6] dark:text-[#A78BFA]">Everywhere</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            40+ high-performance developer utilities running 100% inside your browser memory with
            zero cloud latency, zero file uploads, and full tech-stack ecosystem integration.
          </p>
        </div>

        {/* Center Graphic: Expanded Concentric Radar Orbits System with 6 Rings */}
        <div className="relative w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] lg:w-[540px] lg:h-[540px] flex items-center justify-center my-6 shrink-0">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute w-[440px] h-[440px] rounded-full bg-gradient-to-tr from-[#673DE6]/10 via-[#8B5CF6]/10 to-transparent blur-3xl pointer-events-none" />

          {/* 6 Concentric Circular Orbit Rings with Purple / Indigo Borders */}
          {/* Ring 6: Outermost (530px) */}
          <div className="absolute w-[530px] h-[530px] inset-0 m-auto rounded-full border border-[#673DE6]/15 dark:border-[#8B5CF6]/15" />
          {/* Ring 5: (440px) */}
          <div className="absolute w-[440px] h-[440px] inset-0 m-auto rounded-full border border-[#673DE6]/20 dark:border-[#8B5CF6]/20" />
          {/* Ring 4: (350px) */}
          <div className="absolute w-[350px] h-[350px] inset-0 m-auto rounded-full border border-[#673DE6]/25 dark:border-[#8B5CF6]/25" />
          {/* Ring 3: (265px) */}
          <div className="absolute w-[265px] h-[265px] inset-0 m-auto rounded-full border border-[#673DE6]/30 dark:border-[#8B5CF6]/30" />
          {/* Ring 2: (180px) */}
          <div className="absolute w-[180px] h-[180px] inset-0 m-auto rounded-full border border-[#673DE6]/35 dark:border-[#8B5CF6]/35" />
          {/* Ring 1: Innermost (105px) */}
          <div className="absolute w-[105px] h-[105px] inset-0 m-auto rounded-full border border-[#673DE6]/40 dark:border-[#8B5CF6]/40" />

          {/* Glowing Center Hub Badge with DreamKit Star Spark in Royal Indigo/Violet Gradient */}
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-[#673DE6] via-[#4F46E5] to-[#8B5CF6] flex items-center justify-center text-white shadow-2xl shadow-[#673DE6]/40 relative z-20 hover:scale-105 transition-transform">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          {/* =========================================================
              RING 1 (Innermost - Tech Stacks: React, TypeScript)
             ========================================================= */}
          {/* React */}
          <div
            className="absolute top-[37%] right-[37%] w-7 h-7 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 hover:scale-115 transition-transform"
            title="React"
          >
            <svg viewBox="-11.5 -10.23 23 20.46" className="w-4 h-4">
              <circle cx="0" cy="0" r="2.05" fill="#61DAFB" />
              <g stroke="#61DAFB" strokeWidth="1" fill="none">
                <ellipse rx="11" ry="4.2" />
                <ellipse rx="11" ry="4.2" transform="rotate(60)" />
                <ellipse rx="11" ry="4.2" transform="rotate(120)" />
              </g>
            </svg>
          </div>

          {/* TypeScript */}
          <div
            className="absolute bottom-[36%] left-[36%] w-7 h-7 rounded-full bg-[#3178C6] shadow-md flex items-center justify-center z-10 hover:scale-115 transition-transform text-white font-bold text-[10px]"
            title="TypeScript"
          >
            TS
          </div>

          {/* =========================================================
              RING 2 (Tech & Social: Python, Node.js, Figma, Slack)
             ========================================================= */}
          {/* Python */}
          <div
            className="absolute top-[32%] right-[29%] w-8 h-8 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 hover:scale-115 transition-transform"
            title="Python"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path
                fill="#3776AB"
                d="M11.9 2c-3.1 0-5.2.7-5.2 2.1v2.8h5.3v.7H4.4C3 7.6 2 8.9 2 11.2s.8 3.5 2.4 3.5h1.4V13c0-2 1.7-3.7 3.7-3.7h5.3c1.7 0 3-1.3 3-3V4.1C17.8 2.7 15 2 11.9 2z"
              />
              <path
                fill="#FFD43B"
                d="M12.1 22c3.1 0 5.2-.7 5.2-2.1v-2.8h-5.3v-.7h7.6c1.4 0 2.4-1.3 2.4-3.6s-.8-3.5-2.4-3.5h-1.4V11c0 2-1.7 3.7-3.7 3.7H9.2c-1.7 0-3 1.3-3 3v2.2C6.2 21.3 9 22 12.1 22z"
              />
            </svg>
          </div>

          {/* Node.js */}
          <div
            className="absolute top-[28%] left-[33%] w-8 h-8 rounded-full bg-[#339933] shadow-md flex items-center justify-center z-10 hover:scale-115 transition-transform text-white font-bold text-[10px]"
            title="Node.js"
          >
            Node
          </div>

          {/* Figma */}
          <div
            className="absolute bottom-[28%] left-[31%] w-8 h-8 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 hover:scale-115 transition-transform"
            title="Figma"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path fill="#F24E1E" d="M8 2a4 4 0 000 8h4V2H8z" />
              <path fill="#A259FF" d="M8 10a4 4 0 000 8h4v-8H8z" />
              <path fill="#0ACF83" d="M8 18a4 4 0 004 4v-4H8z" />
              <path fill="#FF7262" d="M12 2h4a4 4 0 010 8h-4V2z" />
              <path fill="#1ABCFE" d="M12 10h4a4 4 0 010 8h-4v-8z" />
            </svg>
          </div>

          {/* Slack */}
          <div
            className="absolute bottom-[30%] right-[30%] w-8 h-8 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 hover:scale-115 transition-transform"
            title="Slack"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path
                fill="#E01E5A"
                d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"
              />
              <path
                fill="#36C5F0"
                d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"
              />
              <path
                fill="#2EB67D"
                d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.522 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.521 2.522v6.312z"
              />
              <path
                fill="#ECB22E"
                d="M15.165 18.956a2.528 2.528 0 0 1 2.521 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.27a2.528 2.528 0 0 1-2.52-2.522 2.527 2.527 0 0 1 2.52-2.521h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.521h-6.313z"
              />
            </svg>
          </div>

          {/* =========================================================
              RING 3 (GitHub, VS Code, Discord, Docker, Outlook)
             ========================================================= */}
          {/* GitHub */}
          <div
            className="absolute top-[21%] right-[22%] w-8 h-8 rounded-full bg-slate-950 text-white shadow-md flex items-center justify-center z-10 hover:scale-115 transition-transform"
            title="GitHub"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </div>

          {/* VS Code */}
          <div
            className="absolute top-[18%] left-[45%] w-8 h-8 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 hover:scale-115 transition-transform"
            title="VS Code"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path fill="#0065A9" d="M17.5 2L5.8 11.2l3.4 2.8L17.5 2z" />
              <path fill="#007ACC" d="M17.5 22l-8.3-6.6-3.4 2.8L17.5 22z" />
              <path fill="#1F9CF0" d="M17.5 2L9.2 8.6l8.3 6.6L23 12.6l-5.5-10.6z" />
            </svg>
          </div>

          {/* Discord */}
          <div
            className="absolute top-[38%] left-[23%] w-8 h-8 rounded-full bg-[#5865F2] shadow-md flex items-center justify-center z-10 hover:scale-115 transition-transform text-white"
            title="Discord"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M20.3 4.4A19.6 19.6 0 0015.6 3a.1.1 0 00-.1.1c-.2.4-.4.8-.6 1.2a18.2 18.2 0 00-5.8 0c-.2-.4-.4-.8-.6-1.2a.1.1 0 00-.1-.1A19.6 19.6 0 003.7 4.4a.1.1 0 000 .1c-2.4 3.7-3.1 7.2-2.8 10.7v.1a19.8 19.8 0 006 3 .1.1 0 00.1 0c.5-.6.9-1.3 1.3-2a.1.1 0 00-.1-.1 13 13 0 01-1.8-.9.1.1 0 010-.2c.1-.1.3-.2.4-.3a14.2 14.2 0 0010.4 0c.2.1.3.2.4.3a.1.1 0 010 .2 13 13 0 01-1.8.9.1.1 0 00-.1.1c.4.7.8 1.4 1.3 2a.1.1 0 00.1 0 19.7 19.7 0 006-3v-.1c.4-4-1-7.5-3.1-10.7a.1.1 0 00-.1-.1zM8.3 13.5c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm7.4 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z" />
            </svg>
          </div>

          {/* Docker */}
          <div
            className="absolute bottom-[23%] left-[34%] w-8 h-8 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 hover:scale-115 transition-transform"
            title="Docker"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path
                fill="#2496ED"
                d="M13.9 10.4h1.7v1.7h-1.7zm-2.3 0h1.7v1.7h-1.7zm-2.3 0H11v1.7H9.3zm-2.3 0h1.7v1.7H7zm-2.3 0h1.7v1.7H4.7zm7-2.3h1.7v1.7h-1.7zm-2.3 0h1.7v1.7H9.4zm-2.4 0h1.7v1.7H7zm4.7-2.3h1.7v1.7h-1.7zM23.9 12c-.1-.1-.8-.6-2.2-.4-.4-.8-1-1.3-1.8-1.6l-.5-.2-.3.5c-.3.6-.3 1.3-.2 1.8-.7.4-1.6.6-2.6.6H1.5c-.3 0-.6.3-.6.6v2.3c0 2.2 1 3.9 2.5 5 1.5 1.1 3.4 1.6 5.5 1.6 6.8 0 11.8-3.7 13.1-9.4.9-.1 1.7-.5 2.1-1.1l.3-.4-.5-.7z"
              />
            </svg>
          </div>

          {/* Outlook */}
          <div
            className="absolute bottom-[22%] right-[32%] w-8 h-8 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 hover:scale-115 transition-transform"
            title="Outlook"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#0072C6" d="M1 4h14v16H1z" />
              <path fill="#0072C6" d="M13 7l8 3v7l-8 3z" opacity="0.8" />
            </svg>
          </div>

          {/* =========================================================
              RING 4 (Twitter/X, Chrome, Android, YouTube, Edge)
             ========================================================= */}
          {/* Twitter / X */}
          <div
            className="absolute top-[46%] right-[16%] w-8 h-8 rounded-full bg-black text-white shadow-md flex items-center justify-center z-10 hover:scale-115 transition-transform"
            title="X (Twitter)"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>

          {/* Chrome */}
          <div
            className="absolute top-[17%] right-[30%] w-9 h-9 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 hover:scale-115 transition-transform"
            title="Google Chrome"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="#EA4335" />
              <circle cx="12" cy="12" r="5" fill="#FBBC05" />
              <circle cx="12" cy="12" r="3" fill="#4285F4" />
            </svg>
          </div>

          {/* Android */}
          <div
            className="absolute top-[23%] left-[20%] w-8 h-8 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 hover:scale-115 transition-transform"
            title="Android"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#3DDC84"
                d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0007s.4482-1.0006.9993-1.0006c.5516 0 .9997.4485.9997 1.0006s-.4481 1.0007-.9997 1.0007m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0007s.4482-1.0006.9993-1.0006c.5516 0 .9997.4485.9997 1.0006s-.4481 1.0007-.9997 1.0007m11.4045-6.02l1.9973-3.4592a.416.416 0 0 0-.1521-.5676.416.416 0 0 0-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.1 12 8.1s-3.5902.3116-5.1368.8497L4.8409 5.4467a.4161.4161 0 0 0-.5677-.1521.4157.4157 0 0 0-.152 5676l1.9972 3.4592C2.6889 11.1867.3432 14.6589 0 18.7778h24c-.3432-4.1189-2.6889-7.5911-6.1185-9.4564"
              />
            </svg>
          </div>

          {/* YouTube */}
          <div
            className="absolute bottom-[23%] left-[19%] w-8 h-8 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 hover:scale-115 transition-transform"
            title="YouTube"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path
                fill="#FF0000"
                d="M23.5 6.2s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.3-1C17.2 2.7 12 2.7 12 2.7s-5.2 0-8.3.2c-.4.1-1.4.1-2.3 1-.7.7-.9 2.3-.9 2.3S.3 8.1.3 10v1.9c0 1.9.2 3.8.2 3.8s.2 1.6.9 2.3c.9.9 2.1.9 2.6 1 1.9.2 8 .2 8 .2s5.2 0 8.3-.2c.4-.1 1.4-.1 2.3-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8V10c0-1.9-.2-3.8-.2-3.8z"
              />
              <path fill="#FFF" d="M9.6 15.3l6.3-3.6-6.3-3.6v7.2z" />
            </svg>
          </div>

          {/* Edge */}
          <div
            className="absolute bottom-[16%] right-[24%] w-8 h-8 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 hover:scale-115 transition-transform"
            title="Microsoft Edge"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#0078D7"
                d="M12 2a10 10 0 0 0-9.8 8h4.2A5.8 5.8 0 0 1 12 6.2a5.8 5.8 0 0 1 5.8 5.8c0 3.2-2.6 5.8-5.8 5.8a5.8 5.8 0 0 1-5.6-4.2H2.2A10 10 0 0 0 12 22a10 10 0 0 0 10-10A10 10 0 0 0 12 2z"
              />
            </svg>
          </div>

          {/* =========================================================
              RING 5 (Apple, LinkedIn, Instagram, Messenger)
             ========================================================= */}
          {/* Apple */}
          <div
            className="absolute top-[13%] right-[17%] w-9 h-9 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 hover:scale-115 transition-transform text-slate-900 dark:text-white"
            title="Apple macOS / iOS"
          >
            <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.78 1.05-1.87.94-2.96-.92.04-2.02.62-2.67 1.39-.58.67-.99 1.77-.85 2.84 1.03.08 2.07-.56 2.58-1.27z" />
            </svg>
          </div>

          {/* LinkedIn */}
          <div
            className="absolute top-[48%] left-[8%] w-8 h-8 rounded-full bg-[#0A66C2] shadow-md flex items-center justify-center z-10 hover:scale-115 transition-transform text-white text-xs font-bold"
            title="LinkedIn"
          >
            in
          </div>

          {/* Instagram */}
          <div
            className="absolute bottom-[9%] left-[45%] w-8 h-8 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 hover:scale-115 transition-transform"
            title="Instagram"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <defs>
                <linearGradient id="igIconG" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFD600" />
                  <stop offset="50%" stopColor="#FF0069" />
                  <stop offset="100%" stopColor="#7638FA" />
                </linearGradient>
              </defs>
              <rect width="24" height="24" rx="6" fill="url(#igIconG)" />
              <path
                fill="#FFF"
                d="M12 7a5 5 0 100 10 5 5 0 000-10zm0 8.2a3.2 3.2 0 110-6.4 3.2 3.2 0 010 6.4zm5.2-8.6a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z"
              />
            </svg>
          </div>

          {/* Messenger */}
          <div
            className="absolute bottom-[20%] right-[12%] w-8 h-8 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 hover:scale-115 transition-transform"
            title="Messenger"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#0084FF"
                d="M12 2C6.477 2 2 6.145 2 11.258c0 2.914 1.455 5.518 3.734 7.218V22l3.39-1.86c.91.252 1.875.388 2.876.388 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.066 12.456l-2.56-2.73-5 2.73 5.5-5.844 2.625 2.73 4.935-2.73-5.5 5.844z"
              />
            </svg>
          </div>

          {/* =========================================================
              RING 6 (Outermost: Git Branch, Yahoo / Data)
             ========================================================= */}
          {/* Git */}
          <div
            className="absolute top-[8%] left-[29%] w-8 h-8 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 hover:scale-115 transition-transform"
            title="Git"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path
                fill="#F05032"
                d="M22.6 10.9L13.1 1.4c-.6-.6-1.5-.6-2.1 0L9.1 3.3l2.7 2.7c.6-.2 1.4 0 1.8.5.5.5.6 1.3.4 1.9l2.6 2.6c.6-.2 1.4 0 1.9.4.7.7.7 1.9 0 2.6-.7.7-1.9.7-2.6 0-.5-.5-.7-1.3-.4-1.9L12.9 9.5v5.3c.2.1.4.3.5.5.7.7.7 1.9 0 2.6-.7.7-1.9.7-2.6 0-.7-.7-.7-1.9 0-2.6.2-.2.4-.4.6-.5V9.4c-.2-.1-.4-.3-.6-.5-.5-.5-.7-1.3-.4-1.9L7.8 4.3 1.4 10.7c-.6.6-.6 1.5 0 2.1l9.5 9.5c.6.6 1.5.6 2.1 0l9.6-9.5c.6-.5.6-1.4 0-1.9z"
              />
            </svg>
          </div>

          {/* Yahoo! */}
          <div
            className="absolute bottom-[11%] left-[20%] w-8 h-8 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 hover:scale-115 transition-transform"
            title="Yahoo! Web"
          >
            <div className="w-full h-full rounded-full bg-[#6001D2] flex items-center justify-center text-white text-[10px] font-black">
              Y!
            </div>
          </div>
        </div>

        {/* Clean Bottom Platform Compatibility Description */}
        <div className="relative z-10 max-w-md pb-4 text-center">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Compatible with <strong className="text-slate-800 dark:text-slate-200">Gmail</strong>,{' '}
            <strong className="text-slate-800 dark:text-slate-200">Outlook Web</strong>,{' '}
            <strong className="text-slate-800 dark:text-slate-200">VS Code</strong>,{' '}
            <strong className="text-slate-800 dark:text-slate-200">GitHub</strong>,{' '}
            <strong className="text-slate-800 dark:text-slate-200">Slack</strong>,{' '}
            <strong className="text-slate-800 dark:text-slate-200">Figma</strong> and all modern
            developer environments.
          </p>
        </div>
      </div>
    </div>
  );
}
