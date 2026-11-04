import React, { useState } from 'react';
import { 
  X, 
  User, 
  Settings, 
  ShieldCheck, 
  Key, 
  LogOut, 
  Check, 
  Copy, 
  Sliders, 
  Database,
  Mail,
  Sparkles,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { resetPassword } from '../config/firebase';

export default function ProfileSettingsModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onLogout,
  theme,
  onToggleTheme,
  onNotify
}) {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'preferences' | 'security'
  const [copiedUid, setCopiedUid] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Editor preferences from localStorage
  const [indentSize, setIndentSize] = useState(() => {
    return localStorage.getItem('dreamkit_indent_size') || '2';
  });
  const [autoCopyOnFormat, setAutoCopyOnFormat] = useState(() => {
    return localStorage.getItem('dreamkit_auto_copy') === 'true';
  });
  const [soundFeedback, setSoundFeedback] = useState(() => {
    return localStorage.getItem('dreamkit_sound_feedback') === 'true';
  });

  if (!isOpen) return null;

  const handleSavePref = (key, val) => {
    localStorage.setItem(key, String(val));
    if (onNotify) onNotify('Preference saved', 'success');
  };

  const handleCopyUid = () => {
    if (currentUser?.uid) {
      navigator.clipboard.writeText(currentUser.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleSendReset = async () => {
    if (!currentUser?.email) return;
    setSendingReset(true);
    try {
      await resetPassword(currentUser.email);
      setResetSent(true);
      if (onNotify) onNotify('Password reset email sent!', 'success');
    } catch {
      if (onNotify) onNotify('Failed to send reset email', 'error');
    } finally {
      setSendingReset(false);
    }
  };

  const handleClearCache = () => {
    if (window.confirm('Reset local workspace cache and tool configurations?')) {
      const savedTheme = localStorage.getItem('json_studio_theme');
      localStorage.clear();
      if (savedTheme) localStorage.setItem('json_studio_theme', savedTheme);
      if (onNotify) onNotify('Local cache cleared', 'info');
      setTimeout(() => window.location.reload(), 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Frosted Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div 
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden transition-all duration-200 z-10 flex flex-col max-h-[90vh] ${
          isDark 
            ? 'bg-[#121620]/95 border-white/[0.12] text-slate-100 shadow-black/70' 
            : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-slate-300/60'
        } backdrop-blur-2xl`}
      >
        {/* macOS Window Title Bar */}
        <div className={`h-12 px-4 flex items-center justify-between border-b shrink-0 select-none ${
          isDark ? 'bg-slate-900/60 border-white/[0.08]' : 'bg-slate-100/70 border-slate-200/80'
        }`}>
          {/* Traffic Light Dots */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-90 active:brightness-75 transition-all flex items-center justify-center group cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-2 h-2 text-black/60 opacity-0 group-hover:opacity-100 stroke-[3]" />
            </button>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>

          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Account Settings & Preferences
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Apple Segmented Control Header */}
        <div className={`p-3 border-b flex justify-center shrink-0 ${
          isDark ? 'border-white/[0.06] bg-slate-950/20' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className={`p-1 rounded-xl border flex items-center gap-1 ${
            isDark ? 'bg-black/40 border-white/[0.08]' : 'bg-slate-200/60 border-slate-200/70'
          }`}>
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'preferences', label: 'Preferences', icon: Sliders },
              { id: 'security', label: 'Privacy & Security', icon: ShieldCheck },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-white text-slate-900 shadow-xs'
                      : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* User Hero Banner */}
              <div className={`p-5 rounded-2xl border flex items-center gap-4 ${
                isDark 
                  ? 'bg-slate-900/50 border-white/[0.08]' 
                  : 'bg-gradient-to-r from-indigo-50/60 to-purple-50/40 border-indigo-100'
              }`}>
                {currentUser?.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="Profile Avatar" 
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/30 shadow-md shrink-0" 
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
                    {(currentUser?.displayName || currentUser?.email || 'Guest')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold truncate">
                      {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Local Developer'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                      {currentUser ? 'Verified' : 'Guest'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {currentUser?.email || 'Local air-gapped workspace'}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" /> 100% In-Browser Privacy
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Metadata Details */}
              <div className={`rounded-xl border divide-y ${
                isDark ? 'border-white/[0.08] divide-white/[0.06] bg-slate-900/40' : 'border-slate-200 divide-slate-100 bg-white'
              }`}>
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Sign-in Provider</span>
                  <span className="font-semibold text-xs flex items-center gap-1.5">
                    {currentUser?.providerData?.[0]?.providerId === 'google.com' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Google (Gmail) Account
                      </>
                    ) : currentUser ? (
                      <>
                        <Mail className="w-3.5 h-3.5 text-indigo-500" />
                        Email & Password
                      </>
                    ) : (
                      'Anonymous Local Session'
                    )}
                  </span>
                </div>

                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Account UID</span>
                  <div className="flex items-center gap-2">
                    <code className="text-[11px] font-mono text-slate-400">
                      {currentUser?.uid ? `${currentUser.uid.substring(0, 14)}...` : 'local-client'}
                    </code>
                    {currentUser?.uid && (
                      <button
                        type="button"
                        onClick={handleCopyUid}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
                        title="Copy full UID"
                      >
                        {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-xs text-slate-500">License Tier</span>
                  <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                    Community Pro (Free Forever)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-4">
              <div className={`rounded-xl border divide-y ${
                isDark ? 'border-white/[0.08] divide-white/[0.06] bg-slate-900/40' : 'border-slate-200 divide-slate-100 bg-white'
              }`}>
                {/* Indentation preference */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs">Default Indentation Size</div>
                    <div className="text-[11px] text-slate-500">Applies to JSON, YAML, HTML, and CSS formatters</div>
                  </div>
                  <select
                    value={indentSize}
                    onChange={(e) => {
                      setIndentSize(e.target.value);
                      handleSavePref('dreamkit_indent_size', e.target.value);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="2">2 Spaces</option>
                    <option value="4">4 Spaces</option>
                    <option value="tab">Tabs (\t)</option>
                  </select>
                </div>

                {/* Auto copy switch */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs">Auto Copy to Clipboard</div>
                    <div className="text-[11px] text-slate-500">Automatically copy minified or formatted code on execution</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !autoCopyOnFormat;
                      setAutoCopyOnFormat(next);
                      handleSavePref('dreamkit_auto_copy', next);
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      autoCopyOnFormat ? 'bg-indigo-600' : isDark ? 'bg-slate-800' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      autoCopyOnFormat ? 'translate-x-5' : ''
                    }`} />
                  </button>
                </div>

                {/* Theme mode toggle */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs">Appearance Theme</div>
                    <div className="text-[11px] text-slate-500">Switch between Light and Developer Dark aesthetics</div>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY & SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                isDark ? 'bg-emerald-950/20 border-emerald-500/25' : 'bg-emerald-50/60 border-emerald-200'
              }`}>
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-emerald-800 dark:text-emerald-300">
                    Air-Gapped Client Architecture
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed">
                    DreamKit processes every file, image, audio demux, and PDF inside your browser's local RAM. Your raw payloads never touch a server, remote socket, or telemetry endpoint.
                  </p>
                </div>
              </div>

              <div className={`rounded-xl border divide-y ${
                isDark ? 'border-white/[0.08] divide-white/[0.06] bg-slate-900/40' : 'border-slate-200 divide-slate-100 bg-white'
              }`}>
                {currentUser?.email && (
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs">Password Reset Link</div>
                      <div className="text-[11px] text-slate-500">Send a password update link to {currentUser.email}</div>
                    </div>
                    <button
                      type="button"
                      disabled={sendingReset || resetSent}
                      onClick={handleSendReset}
                      className="px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {resetSent ? 'Email Sent!' : sendingReset ? 'Sending...' : 'Send Reset Email'}
                    </button>
                  </div>
                )}

                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs">Reset Workspace & Storage Cache</div>
                    <div className="text-[11px] text-slate-500">Clear saved drafts and cached tool inputs</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearCache}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Clear Cache
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`h-16 px-6 border-t flex items-center justify-between shrink-0 ${
          isDark ? 'border-white/[0.08] bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'
        }`}>
          {currentUser ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Account</span>
            </button>
          ) : (
            <div className="text-xs text-slate-400">
              Not currently signed in
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer active:scale-[0.98] transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
