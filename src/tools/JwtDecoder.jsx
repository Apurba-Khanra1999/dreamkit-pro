import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  KeyRound, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ClipboardPaste, 
  Lock, 
  Unlock, 
  Wand2, 
  Layers
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { copyToClipboard } from '../utils/fileUtils';
import { 
  decodeJwt, 
  verifyHmacSignature, 
  createSignedJwt, 
  JWT_PRESETS 
} from '../utils/jwtUtils';

export default function JwtDecoder({ theme, onNotify }) {
  // Main view mode: 'decode' | 'encode'
  const [activeMode, setActiveMode] = useState('decode');

  // Decode State
  const [tokenInput, setTokenInput] = useState('');
  const [secretInput, setSecretInput] = useState(JWT_PRESETS[0].secret);
  const [isSecretBase64, setIsSecretBase64] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null); // null | { verified, message }
  const [isVerifying, setIsVerifying] = useState(false);

  // Encode / Sign State
  const [encodeAlg, setEncodeAlg] = useState('HS256');
  const [encodeHeaderStr, setEncodeHeaderStr] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  const [encodePayloadStr, setEncodePayloadStr] = useState(
    JSON.stringify(JWT_PRESETS[0].payload, null, 2)
  );
  const [encodeSecret, setEncodeSecret] = useState('my-development-secret-key-32-chars');
  const [generatedToken, setGeneratedToken] = useState('');

  const [showPresets, setShowPresets] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize with signed preset token
  useEffect(() => {
    async function initPreset() {
      const p = JWT_PRESETS[0];
      try {
        const signed = await createSignedJwt(p.header, p.payload, p.secret);
        setTokenInput(signed);
      } catch {
        // ignore
      }
    }
    initPreset();
  }, []);

  // Parse decoded token in real time
  const decodedResult = useMemo(() => {
    return decodeJwt(tokenInput);
  }, [tokenInput]);

  // Formatted JSON strings for editors
  const headerJsonString = useMemo(() => {
    return decodedResult.success ? JSON.stringify(decodedResult.header, null, 2) : '';
  }, [decodedResult]);

  const payloadJsonString = useMemo(() => {
    return decodedResult.success ? JSON.stringify(decodedResult.payload, null, 2) : '';
  }, [decodedResult]);

  // Handle Verify Signature
  const handleVerify = useCallback(async () => {
    if (!tokenInput.trim() || !secretInput.trim()) {
      onNotify?.({ type: 'warning', title: 'Missing Info', message: 'Enter both token and secret key to verify.' });
      return;
    }

    setIsVerifying(true);
    const res = await verifyHmacSignature(tokenInput, secretInput, isSecretBase64);
    setIsVerifying(false);
    setVerificationResult(res);

    if (res.verified) {
      onNotify?.({ type: 'success', title: 'Signature Valid', message: res.message });
    } else {
      onNotify?.({ type: 'error', title: 'Signature Invalid', message: res.message });
    }
  }, [tokenInput, secretInput, isSecretBase64, onNotify]);

  // Handle Generate / Sign JWT
  const handleGenerateJwt = async () => {
    try {
      const headerObj = JSON.parse(encodeHeaderStr);
      headerObj.alg = encodeAlg;
      const payloadObj = JSON.parse(encodePayloadStr);

      const token = await createSignedJwt(headerObj, payloadObj, encodeSecret);
      setGeneratedToken(token);
      onNotify?.({ type: 'success', title: 'JWT Generated', message: 'Token signed successfully.' });
    } catch (err) {
      onNotify?.({ type: 'error', title: 'Signing Failed', message: err.message });
    }
  };

  // Load a preset
  const handleLoadPreset = async (preset) => {
    try {
      const token = await createSignedJwt(preset.header, preset.payload, preset.secret);
      setTokenInput(token);
      setSecretInput(preset.secret);
      setVerificationResult(null);
      setShowPresets(false);
      onNotify?.({ type: 'info', title: 'Preset Loaded', message: `Loaded ${preset.title}` });
    } catch (err) {
      onNotify?.({ type: 'error', title: 'Preset Error', message: err.message });
    }
  };

  const handleCopy = async (text, label = 'Content') => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      onNotify?.({ type: 'success', title: 'Copied', message: `${label} copied to clipboard.` });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Status badge style helper
  const getStatusBadge = () => {
    if (!decodedResult.success) return null;
    const info = decodedResult.expiryInfo;

    switch (info.statusType) {
      case 'active':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{info.statusText}</span>
          </div>
        );
      case 'expired':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>{info.statusText}</span>
          </div>
        );
      case 'future':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>{info.statusText}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>No Expiry Claim (exp)</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Action Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveMode('decode')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeMode === 'decode'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Decode &amp; Inspect
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('encode')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeMode === 'encode'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign &amp; Generate JWT
            </button>
          </div>

          {/* Presets dropdown */}
          {activeMode === 'decode' && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPresets(prev => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Presets</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showPresets && (
                <div className="absolute left-0 mt-2 w-80 max-h-80 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-30 p-1.5 text-xs animate-scale-in">
                  <div className="px-2.5 py-1.5 font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                    Sample Tokens
                  </div>
                  {JWT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleLoadPreset(preset)}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 flex flex-col gap-0.5 transition-colors cursor-pointer"
                    >
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {preset.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {preset.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>100% In-Browser Cryptography • Zero Server Telemetry</span>
        </div>
      </div>

      {/* MODE 1: DECODE & INSPECT */}
      {activeMode === 'decode' && (
        <div className="space-y-4 animate-fade-in">
          {/* Main Grid: Left Column Token Input, Right Column Decoded Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* Left 5 Cols: Encoded Token String */}
            <div className="lg:col-span-5 flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Encoded JWT Token
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (navigator.clipboard?.readText) {
                          const t = await navigator.clipboard.readText();
                          if (t) setTokenInput(t.trim());
                        }
                      } catch {
                        // ignore
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                    title="Paste token"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTokenInput('');
                      setVerificationResult(null);
                    }}
                    disabled={!tokenInput}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded disabled:opacity-40 cursor-pointer"
                    title="Clear token"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Textarea Token Input */}
              <div className="p-4 flex-1 flex flex-col min-h-[300px]">
                <textarea
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    setVerificationResult(null);
                  }}
                  placeholder="Paste JWT token here (header.payload.signature)..."
                  className="w-full flex-1 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                />

                {/* Color Legend */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-rose-500 font-semibold">• Header</span>
                  <span className="text-purple-500 font-semibold">• Payload</span>
                  <span className="text-cyan-500 font-semibold">• Signature</span>
                </div>
              </div>

              {/* Signature Verification Card */}
              <div className="p-4 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Verify HMAC Signature</span>
                  </span>

                  {verificationResult && (
                    <div className="text-[11px] font-semibold flex items-center gap-1">
                      {verificationResult.verified ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Invalid
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={secretInput}
                      onChange={(e) => setSecretInput(e.target.value)}
                      placeholder="Enter HMAC Secret..."
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(prev => !prev)}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      {showSecret ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={isVerifying || !tokenInput}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify'}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSecretBase64}
                      onChange={(e) => setIsSecretBase64(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <span>Secret is Base64 encoded</span>
                  </label>

                  {verificationResult && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                      {verificationResult.message}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Decoded Header, Payload & Expiry Breakdown */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              
              {/* Expiry & Time Claims Status Card */}
              {decodedResult.success && (
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Token Lifecycle &amp; Validity
                    </span>
                    {getStatusBadge()}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    {/* Issued At (iat) */}
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                      <span className="text-slate-400 text-[10px] block font-bold uppercase mb-0.5">Issued At (iat)</span>
                      {decodedResult.expiryInfo.iat ? (
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {decodedResult.expiryInfo.iat.local}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {decodedResult.expiryInfo.iat.relativeTime}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Not specified</span>
                      )}
                    </div>

                    {/* Expiration (exp) */}
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                      <span className="text-slate-400 text-[10px] block font-bold uppercase mb-0.5">Expires At (exp)</span>
                      {decodedResult.expiryInfo.exp ? (
                        <div>
                          <div className={`font-semibold truncate ${
                            decodedResult.expiryInfo.isExpired ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {decodedResult.expiryInfo.exp.local}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {decodedResult.expiryInfo.exp.relativeTime}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Never (no exp)</span>
                      )}
                    </div>

                    {/* Not Before (nbf) */}
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                      <span className="text-slate-400 text-[10px] block font-bold uppercase mb-0.5">Not Before (nbf)</span>
                      {decodedResult.expiryInfo.nbf ? (
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {decodedResult.expiryInfo.nbf.local}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {decodedResult.expiryInfo.nbf.relativeTime}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Immediate</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Notice */}
              {!decodedResult.success && (
                <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-800 dark:text-red-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">JWT Parsing Error: </span>
                    <span>{decodedResult.error}</span>
                  </div>
                </div>
              )}

              {/* Header JSON Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      HEADER: Algorithm &amp; Token Type
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(headerJsonString, 'Header JSON')}
                    disabled={!headerJsonString}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer disabled:opacity-40"
                    title="Copy Header"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="min-h-[140px]">
                  <CodeEditor
                    value={headerJsonString}
                    readOnly={true}
                    theme={theme}
                    minHeight="140px"
                  />
                </div>
              </div>

              {/* Payload Claims JSON Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      PAYLOAD: Claims &amp; Data
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(payloadJsonString, 'Payload JSON')}
                    disabled={!payloadJsonString}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer disabled:opacity-40"
                    title="Copy Payload"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="min-h-[220px]">
                  <CodeEditor
                    value={payloadJsonString}
                    readOnly={true}
                    theme={theme}
                    minHeight="220px"
                  />
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODE 2: SIGN & GENERATE JWT */}
      {activeMode === 'encode' && (
        <div className="space-y-4 animate-fade-in">
          {/* Controls Bar */}
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Algorithm:</span>
                <select
                  value={encodeAlg}
                  onChange={(e) => setEncodeAlg(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="HS256">HS256 (HMAC SHA-256)</option>
                  <option value="HS384">HS384 (HMAC SHA-384)</option>
                  <option value="HS512">HS512 (HMAC SHA-512)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Secret:</span>
                <input
                  type="text"
                  value={encodeSecret}
                  onChange={(e) => setEncodeSecret(e.target.value)}
                  placeholder="Signing secret..."
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateJwt}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 cursor-pointer transition-colors"
            >
              <Wand2 className="w-4 h-4" />
              <span>Sign &amp; Generate Token</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            {/* Header & Payload Editors */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Header JSON
                </div>
                <div className="min-h-[140px]">
                  <CodeEditor
                    value={encodeHeaderStr}
                    onChange={setEncodeHeaderStr}
                    theme={theme}
                    minHeight="140px"
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Payload Claims JSON
                </div>
                <div className="min-h-[240px]">
                  <CodeEditor
                    value={encodePayloadStr}
                    onChange={setEncodePayloadStr}
                    theme={theme}
                    minHeight="240px"
                  />
                </div>
              </div>
            </div>

            {/* Generated Signed Token Result */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Generated Signed Token
                </span>
                {generatedToken && (
                  <button
                    type="button"
                    onClick={() => handleCopy(generatedToken, 'Generated token')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs hover:text-indigo-600 shadow-xs cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copied ? 'Copied' : 'Copy Token'}</span>
                  </button>
                )}
              </div>

              <div className="flex-1 p-4 flex flex-col">
                {generatedToken ? (
                  <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-slate-100 break-all select-all leading-relaxed">
                    {generatedToken}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                    <Layers className="w-10 h-10 mb-2 opacity-40 text-indigo-400" />
                    <p className="text-xs">Click "Sign &amp; Generate Token" to produce a signed JWT</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
