import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  QrCode,
  Download,
  Copy,
  Check,
  RotateCcw,
  Upload,
  Sparkles,
  Eye,
  EyeOff,
  Link,
  Wifi,
  User,
  Mail,
  MessageSquare,
  Phone,
  MapPin,
  Coins,
  Calendar,
  FileText,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Printer,
  Sliders
} from 'lucide-react';
import {
  CONTENT_TYPES,
  STYLE_PRESETS,
  PRESET_LOGOS,
  formatQrUrl,
  formatQrWifi,
  formatQrVCard,
  formatQrEmail,
  formatQrSms,
  formatQrPhone,
  formatQrGeo,
  formatQrCrypto,
  formatQrEvent,
  calculateContrastRatio,
  renderCustomQrCanvas,
  generateCustomQrSvg,
  downloadCanvasImage,
  downloadSvgFile,
  copyCanvasToClipboard
} from '../utils/qrCodeUtils';

export default function QrCodeGeneratorSuite({ _theme = 'dark', onNotify }) {
  // --- CONTENT TYPE STATE ---
  const [contentType, setContentType] = useState('url');

  // Form Fields per Content Type
  const [urlInput, setUrlInput] = useState('https://dreamkit.dev');
  const [wifiForm, setWifiForm] = useState({
    ssid: 'Office_Guest_5G',
    password: 'SafePassword2026',
    encryption: 'WPA',
    hidden: false
  });
  const [showWifiPassword, setShowWifiPassword] = useState(false);

  const [vcardForm, setVcardForm] = useState({
    firstName: 'Alex',
    lastName: 'Morgan',
    org: 'DreamKit Studio',
    title: 'Lead Architect',
    phone: '+1 555-0199',
    email: 'alex@dreamkit.dev',
    url: 'https://dreamkit.dev',
    address: 'San Francisco, CA',
    note: 'Built with 100% in-browser privacy'
  });

  const [textInput, setTextInput] = useState('DreamKit Developer Studio — 30+ client-side developer utilities.');

  const [emailForm, setEmailForm] = useState({
    email: 'hello@dreamkit.dev',
    subject: 'Collaboration Inquiry',
    body: 'Hi Alex,\nI would love to connect regarding your developer tools.'
  });

  const [smsForm, setSmsForm] = useState({
    phone: '+1 555-0199',
    message: 'Hello! Reaching out via DreamKit QR code.'
  });

  const [phoneInput, setPhoneInput] = useState('+1 555-0199');

  const [geoForm, setGeoForm] = useState({
    lat: '37.7749',
    lng: '-122.4194'
  });

  const [cryptoForm, setCryptoForm] = useState({
    currency: 'bitcoin',
    address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    amount: '0.005',
    label: 'DreamKit Support'
  });

  const [eventForm, setEventForm] = useState({
    title: 'DreamKit 2.0 Keynote Launch',
    location: 'Virtual Broadcast & Stream',
    start: '2026-11-15T18:00',
    end: '2026-11-15T19:30',
    description: 'Join the engineering team live for the new product reveal!'
  });

  // --- STYLING & CUSTOMIZATION STATE ---
  const [activeStyleTab, setActiveStyleTab] = useState('colors'); // 'colors' | 'shapes' | 'logo' | 'presets'
  const [fgColor, setFgColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isTransparent, setIsTransparent] = useState(false);

  const [useGradient, setUseGradient] = useState(false);
  const [gradientStart, setGradientStart] = useState('#059669');
  const [gradientEnd, setGradientEnd] = useState('#0284c7');
  const [gradientType, setGradientType] = useState('diagonal'); // 'diagonal' | 'horizontal' | 'vertical'

  const [dotStyle, setDotStyle] = useState('rounded'); // 'square' | 'dots' | 'rounded' | 'extra-rounded'
  const [eyeStyle, setEyeStyle] = useState('rounded'); // 'square' | 'rounded' | 'circle'
  const [margin, setMargin] = useState(3); // 0 to 6
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState('H'); // 'L' | 'M' | 'Q' | 'H'
  const [canvasResolution, setCanvasResolution] = useState(1024); // 512 | 1024 | 2048

  // --- LOGO OVERLAY STATE ---
  const [enableLogo, setEnableLogo] = useState(false);
  const [logoSourceType, setLogoSourceType] = useState('preset'); // 'preset' | 'upload'
  const [selectedPresetLogoId, setSelectedPresetLogoId] = useState('link');
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState(null);
  const [logoSizePercent, setLogoSizePercent] = useState(20); // 12% to 26%
  const [logoBadgeShape, setLogoBadgeShape] = useState('rounded'); // 'circle' | 'rounded' | 'square'
  const [logoImageObj, setLogoImageObj] = useState(null);

  // --- PREVIEW & EXPORT STATE ---
  const [viewportBg, setViewportBg] = useState('checkerboard'); // 'checkerboard' | 'dark' | 'light'
  const [copiedBlob, setCopiedBlob] = useState(false);

  // Canvas Reference
  const canvasRef = useRef(null);

  // Compute Raw Encoded String based on Active Content Type
  const rawQrPayload = useMemo(() => {
    switch (contentType) {
      case 'url':
        return formatQrUrl(urlInput);
      case 'wifi':
        return formatQrWifi(wifiForm);
      case 'vcard':
        return formatQrVCard(vcardForm);
      case 'text':
        return textInput || '';
      case 'email':
        return formatQrEmail(emailForm);
      case 'sms':
        return formatQrSms(smsForm);
      case 'phone':
        return formatQrPhone(phoneInput);
      case 'geo':
        return formatQrGeo(geoForm);
      case 'crypto':
        return formatQrCrypto(cryptoForm);
      case 'event':
        return formatQrEvent(eventForm);
      default:
        return urlInput;
    }
  }, [
    contentType,
    urlInput,
    wifiForm,
    vcardForm,
    textInput,
    emailForm,
    smsForm,
    phoneInput,
    geoForm,
    cryptoForm,
    eventForm
  ]);

  // Optical Contrast Diagnostics
  const contrastAnalysis = useMemo(() => {
    const effectiveBg = isTransparent ? 'transparent' : bgColor;
    return calculateContrastRatio(useGradient ? gradientStart : fgColor, effectiveBg);
  }, [fgColor, bgColor, isTransparent, useGradient, gradientStart]);

  // Pre-load Logo Image into DOM Image object
  useEffect(() => {
    if (!enableLogo) {
      return;
    }

    let src = null;
    if (logoSourceType === 'upload' && uploadedLogoUrl) {
      src = uploadedLogoUrl;
    } else {
      const preset = PRESET_LOGOS.find(p => p.id === selectedPresetLogoId);
      if (preset) {
        src = `data:image/svg+xml;utf8,${encodeURIComponent(preset.svg)}`;
      }
    }

    if (src) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setLogoImageObj(img);
      };
      img.src = src;
    }
  }, [enableLogo, logoSourceType, selectedPresetLogoId, uploadedLogoUrl]);

  // Main Render to Canvas Function
  const drawQrCode = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rawQrPayload) return;

    try {
      const gradientObj = useGradient
        ? { type: gradientType, start: gradientStart, end: gradientEnd }
        : null;

      renderCustomQrCanvas(canvas, rawQrPayload, {
        errorCorrectionLevel: enableLogo ? 'H' : errorCorrectionLevel,
        margin,
        canvasSize: canvasResolution,
        dotStyle,
        eyeStyle,
        fgColor,
        bgColor: isTransparent ? 'transparent' : bgColor,
        gradient: gradientObj,
        logoImage: enableLogo ? logoImageObj : null,
        logoSizePercent,
        logoBadgeShape
      });
    } catch (err) {
      console.error('QR rendering error:', err);
    }
  }, [
    rawQrPayload,
    errorCorrectionLevel,
    margin,
    canvasResolution,
    dotStyle,
    eyeStyle,
    fgColor,
    bgColor,
    isTransparent,
    useGradient,
    gradientType,
    gradientStart,
    gradientEnd,
    enableLogo,
    logoImageObj,
    logoSizePercent,
    logoBadgeShape
  ]);

  // Re-draw when options or payload changes
  useEffect(() => {
    drawQrCode();
  }, [drawQrCode]);

  // Apply Curated Style Preset
  const handleApplyPreset = (preset) => {
    setFgColor(preset.fgColor);
    setBgColor(preset.bgColor);
    setIsTransparent(false);
    setDotStyle(preset.dotStyle);
    setEyeStyle(preset.eyeStyle);
    if (preset.gradient) {
      setUseGradient(true);
      setGradientStart(preset.gradient.start);
      setGradientEnd(preset.gradient.end);
      setGradientType(preset.gradient.type);
    } else {
      setUseGradient(false);
    }
    if (onNotify) onNotify(`Applied preset: ${preset.name}`, 'info');
  };

  // Upload Logo File Handler
  const handleUploadLogoFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setUploadedLogoUrl(e.target.result);
        setLogoSourceType('upload');
        setEnableLogo(true);
        if (onNotify) onNotify(`Uploaded logo: ${file.name}`, 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Download Handlers
  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    downloadCanvasImage(canvas, `qrcode_${contentType}`, 'png');
    if (onNotify) onNotify('Downloaded high-resolution PNG QR Code', 'success');
  };

  const handleDownloadJpeg = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    downloadCanvasImage(canvas, `qrcode_${contentType}`, 'jpeg', 0.95);
    if (onNotify) onNotify('Downloaded JPEG QR Code', 'success');
  };

  const handleDownloadWebp = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    downloadCanvasImage(canvas, `qrcode_${contentType}`, 'webp', 0.95);
    if (onNotify) onNotify('Downloaded WebP QR Code', 'success');
  };

  const handleDownloadSvg = () => {
    if (!rawQrPayload) return;
    const gradientObj = useGradient
      ? { type: gradientType, start: gradientStart, end: gradientEnd }
      : null;

    const svg = generateCustomQrSvg(rawQrPayload, {
      errorCorrectionLevel: enableLogo ? 'H' : errorCorrectionLevel,
      margin,
      size: canvasResolution,
      dotStyle,
      eyeStyle,
      fgColor,
      bgColor: isTransparent ? 'transparent' : bgColor,
      gradient: gradientObj
    });

    downloadSvgFile(svg, `qrcode_${contentType}`);
    if (onNotify) onNotify('Downloaded vector SVG QR Code', 'success');
  };

  // Copy to Clipboard
  const handleCopyClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      await copyCanvasToClipboard(canvas);
      setCopiedBlob(true);
      setTimeout(() => setCopiedBlob(false), 2000);
      if (onNotify) onNotify('Copied QR image to clipboard!', 'success');
    } catch {
      if (onNotify) onNotify('Clipboard copy failed', 'warning');
    }
  };

  // Print Dialog
  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${contentType.toUpperCase()}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; margin: 0; }
            img { max-width: 380px; height: auto; border: 1px solid #e2e8f0; border-radius: 12px; }
            h2 { margin: 16px 0 6px 0; color: #0f172a; }
            p { margin: 0; color: #64748b; font-size: 14px; font-family: monospace; word-break: break-all; max-width: 450px; text-align: center; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" alt="QR Code" />
          <h2>Scan to Connect</h2>
          <p>${rawQrPayload}</p>
          <script>window.onload = function() { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Reset to Defaults
  const handleReset = () => {
    setUrlInput('https://dreamkit.dev');
    setContentType('url');
    setFgColor('#0f172a');
    setBgColor('#ffffff');
    setIsTransparent(false);
    setUseGradient(false);
    setDotStyle('rounded');
    setEyeStyle('rounded');
    setMargin(3);
    setErrorCorrectionLevel('H');
    setEnableLogo(false);
    setUploadedLogoUrl(null);
    if (onNotify) onNotify('Reset to default clean settings', 'info');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* =========================================================================
          MODULE HEADER
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                QR Code Studio & Vector Generator
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Print Ready 300 DPI
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Create beautiful vector QR codes with gradients, custom shapes, center logos, and optical scannability verification.
            </p>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="Reset to default settings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="Open printable sheet"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Sheet</span>
          </button>

          <button
            type="button"
            onClick={handleCopyClipboard}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="Copy image to clipboard"
          >
            {copiedBlob ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedBlob ? 'Copied Image!' : 'Copy PNG'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPng}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          CONTENT TYPE SELECTOR BAR (10 FORMATS)
         ========================================================================= */}
      <div className="p-3 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {CONTENT_TYPES.map((type) => {
            const isSelected = contentType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setContentType(type.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {type.id === 'url' && <Link className="w-3.5 h-3.5" />}
                {type.id === 'wifi' && <Wifi className="w-3.5 h-3.5" />}
                {type.id === 'vcard' && <User className="w-3.5 h-3.5" />}
                {type.id === 'text' && <FileText className="w-3.5 h-3.5" />}
                {type.id === 'email' && <Mail className="w-3.5 h-3.5" />}
                {type.id === 'sms' && <MessageSquare className="w-3.5 h-3.5" />}
                {type.id === 'phone' && <Phone className="w-3.5 h-3.5" />}
                {type.id === 'geo' && <MapPin className="w-3.5 h-3.5" />}
                {type.id === 'crypto' && <Coins className="w-3.5 h-3.5" />}
                {type.id === 'event' && <Calendar className="w-3.5 h-3.5" />}
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          MAIN WORKSPACE GRID (LEFT: CONTENT & CUSTOMIZER | RIGHT: PREVIEW & EXPORT)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =======================================================================
            LEFT COLUMN: PAYLOAD INPUTS & CUSTOMIZATION ACCORDIONS (7 COLS)
           ======================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* CONTENT PAYLOAD CARD */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                <span>QR Code Content ({contentType.toUpperCase()})</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {rawQrPayload.length} characters encoded
              </span>
            </div>

            {/* URL INPUT */}
            {contentType === 'url' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Website URL
                </label>
                <div className="relative">
                  <Link className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex gap-2 pt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setUrlInput('https://dreamkit.dev')}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Use DreamKit URL
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <button
                    type="button"
                    onClick={() => setUrlInput('https://github.com')}
                    className="text-slate-500 hover:underline"
                  >
                    GitHub
                  </button>
                </div>
              </div>
            )}

            {/* WI-FI NETWORK INPUT */}
            {contentType === 'wifi' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Network SSID (Name)
                  </label>
                  <input
                    type="text"
                    value={wifiForm.ssid}
                    onChange={(e) => setWifiForm({ ...wifiForm, ssid: e.target.value })}
                    placeholder="e.g. CoffeeShop_Guest_5G"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Wi-Fi Password
                  </label>
                  <div className="relative">
                    <input
                      type={showWifiPassword ? 'text' : 'password'}
                      value={wifiForm.password}
                      onChange={(e) => setWifiForm({ ...wifiForm, password: e.target.value })}
                      placeholder="Password"
                      className="w-full pl-3 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowWifiPassword(!showWifiPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showWifiPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Encryption Security
                    </label>
                    <select
                      value={wifiForm.encryption}
                      onChange={(e) => setWifiForm({ ...wifiForm, encryption: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="WPA">WPA / WPA2 / WPA3 (Default)</option>
                      <option value="WEP">WEP (Legacy)</option>
                      <option value="nopass">None (Open Network)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="wifiHidden"
                      checked={wifiForm.hidden}
                      onChange={(e) => setWifiForm({ ...wifiForm, hidden: e.target.checked })}
                      className="rounded accent-emerald-500"
                    />
                    <label htmlFor="wifiHidden" className="font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                      Hidden Network
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* VCARD CONTACT INPUT */}
            {contentType === 'vcard' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">First Name</label>
                    <input
                      type="text"
                      value={vcardForm.firstName}
                      onChange={(e) => setVcardForm({ ...vcardForm, firstName: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Last Name</label>
                    <input
                      type="text"
                      value={vcardForm.lastName}
                      onChange={(e) => setVcardForm({ ...vcardForm, lastName: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Mobile Phone</label>
                    <input
                      type="tel"
                      value={vcardForm.phone}
                      onChange={(e) => setVcardForm({ ...vcardForm, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={vcardForm.email}
                      onChange={(e) => setVcardForm({ ...vcardForm, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Company / Org</label>
                    <input
                      type="text"
                      value={vcardForm.org}
                      onChange={(e) => setVcardForm({ ...vcardForm, org: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Job Title</label>
                    <input
                      type="text"
                      value={vcardForm.title}
                      onChange={(e) => setVcardForm({ ...vcardForm, title: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Website URL</label>
                  <input
                    type="url"
                    value={vcardForm.url}
                    onChange={(e) => setVcardForm({ ...vcardForm, url: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* PLAIN TEXT INPUT */}
            {contentType === 'text' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Custom Text Payload
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={4}
                  placeholder="Enter any text, instructions, or notes to encode..."
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
            )}

            {/* EMAIL INPUT */}
            {contentType === 'email' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={emailForm.email}
                    onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Pre-filled Body Message</label>
                  <textarea
                    rows={3}
                    value={emailForm.body}
                    onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                    className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* SMS INPUT */}
            {contentType === 'sms' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={smsForm.phone}
                    onChange={(e) => setSmsForm({ ...smsForm, phone: e.target.value })}
                    placeholder="+1 555-0199"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">SMS Message</label>
                  <textarea
                    rows={3}
                    value={smsForm.message}
                    onChange={(e) => setSmsForm({ ...smsForm, message: e.target.value })}
                    className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* PHONE CALL INPUT */}
            {contentType === 'phone' && (
              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Phone Number to Dial</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+1 555-0199"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* GEOLOCATION INPUT */}
            {contentType === 'geo' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Latitude</label>
                    <input
                      type="text"
                      value={geoForm.lat}
                      onChange={(e) => setGeoForm({ ...geoForm, lat: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Longitude</label>
                    <input
                      type="text"
                      value={geoForm.lng}
                      onChange={(e) => setGeoForm({ ...geoForm, lng: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  <span className="text-[11px] text-slate-400">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setGeoForm({ lat: '37.7749', lng: '-122.4194' })}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px]"
                  >
                    San Francisco
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeoForm({ lat: '40.7128', lng: '-74.0060' })}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px]"
                  >
                    New York
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeoForm({ lat: '51.5074', lng: '-0.1278' })}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px]"
                  >
                    London
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeoForm({ lat: '35.6762', lng: '139.6503' })}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px]"
                  >
                    Tokyo
                  </button>
                </div>
              </div>
            )}

            {/* CRYPTO INPUT */}
            {contentType === 'crypto' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Cryptocurrency</label>
                    <select
                      value={cryptoForm.currency}
                      onChange={(e) => setCryptoForm({ ...cryptoForm, currency: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="bitcoin">Bitcoin (BTC)</option>
                      <option value="ethereum">Ethereum (ETH)</option>
                      <option value="solana">Solana (SOL)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Amount</label>
                    <input
                      type="text"
                      value={cryptoForm.amount}
                      onChange={(e) => setCryptoForm({ ...cryptoForm, amount: e.target.value })}
                      placeholder="e.g. 0.05"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Wallet Address</label>
                  <input
                    type="text"
                    value={cryptoForm.address}
                    onChange={(e) => setCryptoForm({ ...cryptoForm, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            )}

            {/* EVENT INPUT */}
            {contentType === 'event' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Event Title</label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Location</label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={eventForm.start}
                      onChange={(e) => setEventForm({ ...eventForm, start: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">End Date & Time</label>
                    <input
                      type="datetime-local"
                      value={eventForm.end}
                      onChange={(e) => setEventForm({ ...eventForm, end: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STYLING & DESIGN CONTROLS ACCORDION */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            {/* Customization Tabs */}
            <div className="flex border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-1 rounded-xl gap-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveStyleTab('colors')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                  activeStyleTab === 'colors'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Colors & Gradients
              </button>
              <button
                type="button"
                onClick={() => setActiveStyleTab('shapes')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                  activeStyleTab === 'shapes'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Shapes & Eyes
              </button>
              <button
                type="button"
                onClick={() => setActiveStyleTab('logo')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                  activeStyleTab === 'logo'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Center Logo
              </button>
              <button
                type="button"
                onClick={() => setActiveStyleTab('presets')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                  activeStyleTab === 'presets'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Presets
              </button>
            </div>

            {/* TAB 1: COLORS & GRADIENTS */}
            {activeStyleTab === 'colors' && (
              <div className="space-y-4 text-xs">
                {/* Gradient vs Solid Toggle */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Fill Color Mode
                  </span>
                  <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setUseGradient(false)}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        !useGradient ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Solid
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseGradient(true)}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        useGradient ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Gradient
                    </button>
                  </div>
                </div>

                {/* Solid Foreground Color Picker */}
                {!useGradient ? (
                  <div className="space-y-2">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                      Foreground Module Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-28 px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      />
                      {/* Quick Swatches */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {['#0f172a', '#059669', '#4f46e5', '#7c3aed', '#ea580c', '#e11d48'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setFgColor(c)}
                            className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 cursor-pointer shadow-xs"
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Gradient Start
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={gradientStart}
                            onChange={(e) => setGradientStart(e.target.value)}
                            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={gradientStart}
                            onChange={(e) => setGradientStart(e.target.value)}
                            className="w-full px-2 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Gradient End
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={gradientEnd}
                            onChange={(e) => setGradientEnd(e.target.value)}
                            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={gradientEnd}
                            onChange={(e) => setGradientEnd(e.target.value)}
                            className="w-full px-2 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Gradient Direction
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['diagonal', 'horizontal', 'vertical'].map((dir) => (
                          <button
                            key={dir}
                            type="button"
                            onClick={() => setGradientType(dir)}
                            className={`py-1.5 px-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                              gradientType === dir
                                ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {dir}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Background Color Picker & Transparent Toggle */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Background Canvas
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isTransparent}
                        onChange={(e) => setIsTransparent(e.target.checked)}
                        className="rounded accent-emerald-500"
                      />
                      <span className="text-slate-600 dark:text-slate-300">Transparent</span>
                    </label>
                  </div>

                  {!isTransparent && (
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-28 px-3 py-1.5 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      />
                      <div className="flex items-center gap-1.5">
                        {['#ffffff', '#f8fafc', '#f0fdf4', '#faf5ff', '#fff7ed', '#111622'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setBgColor(c)}
                            className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 cursor-pointer shadow-xs"
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Contrast Ratio Check Badge */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    contrastAnalysis.status === 'optimal'
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                      : contrastAnalysis.status === 'good'
                      ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/60 text-teal-800 dark:text-teal-300'
                      : contrastAnalysis.status === 'warning'
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300'
                      : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {contrastAnalysis.status === 'optimal' || contrastAnalysis.status === 'good' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <div>
                      <span className="font-semibold block">{contrastAnalysis.label}</span>
                      <span className="text-[10px] opacity-80">
                        Luminance contrast: {contrastAnalysis.ratio}:1 (WCAG scanner standard)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SHAPES & EYES */}
            {activeStyleTab === 'shapes' && (
              <div className="space-y-4 text-xs">
                {/* Module Dot Shape */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Data Module Pattern Style
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'square', label: 'Square (Classic)' },
                      { id: 'rounded', label: 'Rounded (Smooth)' },
                      { id: 'extra-rounded', label: 'Pill / Extra' },
                      { id: 'dots', label: 'Circular Dots' }
                    ].map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setDotStyle(style.id)}
                        className={`p-2.5 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                          dotStyle === style.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Corner Eye Style */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Corner Finder Pattern (Eyes)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'square', label: 'Square Target' },
                      { id: 'rounded', label: 'Rounded Frame' },
                      { id: 'circle', label: 'Circular Target' }
                    ].map((eye) => (
                      <button
                        key={eye.id}
                        type="button"
                        onClick={() => setEyeStyle(eye.id)}
                        className={`p-2.5 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                          eyeStyle === eye.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {eye.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Margin / Padding Slider */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Quiet Zone Margin
                    </label>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {margin} modules
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={6}
                    step={1}
                    value={margin}
                    onChange={(e) => setMargin(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Standard scanning specification recommends 2-4 modules of white-space padding.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 3: CENTER LOGO & BADGE OVERLAY */}
            {activeStyleTab === 'logo' && (
              <div className="space-y-4 text-xs">
                {/* Enable Logo Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Overlay Center Brand Logo
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Error correction is automatically upgraded to High (30% recovery)
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableLogo}
                      onChange={(e) => {
                        setEnableLogo(e.target.checked);
                        if (e.target.checked) setErrorCorrectionLevel('H');
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {enableLogo && (
                  <div className="space-y-3 pt-2">
                    {/* Logo Source Switcher */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLogoSourceType('preset')}
                        className={`flex-1 py-1.5 rounded-lg font-semibold border ${
                          logoSourceType === 'preset'
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                            : 'border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        Preset Icons
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoSourceType('upload')}
                        className={`flex-1 py-1.5 rounded-lg font-semibold border ${
                          logoSourceType === 'upload'
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                            : 'border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        Upload Custom Logo
                      </button>
                    </div>

                    {/* Presets Grid */}
                    {logoSourceType === 'preset' ? (
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                          Select Brand Icon
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {PRESET_LOGOS.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setSelectedPresetLogoId(p.id)}
                              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                                selectedPresetLogoId === p.id
                                  ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              <div
                                className="w-5 h-5"
                                dangerouslySetInnerHTML={{ __html: p.svg }}
                              />
                              <span className="text-[10px] font-medium">{p.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Upload Logo Box */
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                          Upload Logo (PNG, SVG, JPEG)
                        </label>
                        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-emerald-500 cursor-pointer bg-slate-50 dark:bg-slate-900/50">
                          <Upload className="w-6 h-6 text-slate-400 mb-1" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {uploadedLogoUrl ? 'Change Custom Logo' : 'Choose Logo File'}
                          </span>
                          <span className="text-[10px] text-slate-400">Transparent PNG or SVG recommended</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleUploadLogoFile(e.target.files[0]);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}

                    {/* Logo Size & Badge Shape */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-semibold text-slate-700 dark:text-slate-300">
                            Logo Scale
                          </label>
                          <span className="font-mono text-emerald-500 font-bold">{logoSizePercent}%</span>
                        </div>
                        <input
                          type="range"
                          min={12}
                          max={26}
                          step={1}
                          value={logoSizePercent}
                          onChange={(e) => setLogoSizePercent(parseInt(e.target.value))}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Badge Background
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {['circle', 'rounded', 'square'].map((shape) => (
                            <button
                              key={shape}
                              type="button"
                              onClick={() => setLogoBadgeShape(shape)}
                              className={`py-1.5 px-1 rounded-lg text-center text-[11px] font-semibold capitalize border ${
                                logoBadgeShape === shape
                                  ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                                  : 'border-slate-200 dark:border-slate-800 text-slate-500'
                              }`}
                            >
                              {shape}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: PRESETS GALLERY */}
            {activeStyleTab === 'presets' && (
              <div className="space-y-3 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                  1-Click Designer Style Presets
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {STYLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 text-left transition-all bg-slate-50/50 dark:bg-slate-900/50 group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-5 h-5 rounded-full border border-slate-300 shadow-xs"
                          style={{
                            background: preset.gradient
                              ? `linear-gradient(135deg, ${preset.gradient.start}, ${preset.gradient.end})`
                              : preset.fgColor
                          }}
                        />
                        <div
                          className="w-5 h-5 rounded-full border border-slate-300 shadow-xs"
                          style={{ backgroundColor: preset.bgColor }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white block group-hover:text-emerald-600 transition-colors">
                        {preset.name}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {preset.dotStyle} • {preset.eyeStyle} eyes
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =======================================================================
            RIGHT COLUMN: INTERACTIVE HIGH-RES CANVAS & MULTI-FORMAT EXPORTER (5 COLS)
           ======================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            {/* Viewport Controls Bar */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 text-xs">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Live Vector Canvas</span>
              </span>

              {/* Viewport Background Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewportBg('checkerboard')}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    viewportBg === 'checkerboard' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setViewportBg('dark')}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    viewportBg === 'dark' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => setViewportBg('light')}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    viewportBg === 'light' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Light
                </button>
              </div>
            </div>

            {/* Canvas Stage with Checkerboard/Solid Background */}
            <div
              className={`p-6 rounded-xl flex items-center justify-center transition-all min-h-[360px] border border-slate-200/60 dark:border-slate-800 relative ${
                viewportBg === 'dark'
                  ? 'bg-[#0b0f19]'
                  : viewportBg === 'light'
                  ? 'bg-slate-100'
                  : 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50 dark:bg-slate-950/40'
              }`}
            >
              <canvas
                ref={canvasRef}
                className="max-w-[280px] sm:max-w-[320px] w-full h-auto aspect-square rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-800 transition-transform hover:scale-[1.01]"
              />
            </div>

            {/* Quality & Scan Diagnostics Card */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Error Correction:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  Level {enableLogo ? 'H (30% recovery)' : errorCorrectionLevel}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Resolution:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {canvasResolution} × {canvasResolution} px (High-DPI)
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Recommended Print Size:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  ≥ 2.5 cm × 2.5 cm (1&quot; × 1&quot;)
                </span>
              </div>
            </div>

            {/* Multi-Format Export Buttons */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Export Resolution:
                </span>
                <select
                  value={canvasResolution}
                  onChange={(e) => setCanvasResolution(parseInt(e.target.value))}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono font-semibold"
                >
                  <option value={512}>512 × 512 px (Mobile / Web)</option>
                  <option value={1024}>1024 × 1024 px (HD Screen)</option>
                  <option value={2048}>2048 × 2048 px (Ultra HD Print 300 DPI)</option>
                </select>
              </div>

              {/* Primary Downloads Grid */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PNG</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download SVG (Vector)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJpeg}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                >
                  <span>Download JPEG</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadWebp}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                >
                  <span>Download WebP</span>
                </button>
              </div>
            </div>

            {/* Privacy Assurance */}
            <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Rendered 100% locally in your browser. Wi-Fi keys, vCards, and passwords never leave your device.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
