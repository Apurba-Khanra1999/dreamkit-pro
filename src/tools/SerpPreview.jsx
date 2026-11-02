import React, { useState, useMemo, useCallback } from 'react';
import { 
  Laptop, 
  Smartphone, 
  Share2, 
  Code2, 
  Copy, 
  Check, 
  Sparkles, 
  Star, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  RotateCcw,
  Globe
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { copyToClipboard } from '../utils/fileUtils';
import { 
  calculateTitlePixels, 
  truncateByPixels, 
  truncateDescription, 
  formatBreadcrumbs, 
  calculateSeoScore, 
  generateMetaTags, 
  SERP_PRESETS,
  MAX_DESKTOP_TITLE_PIXELS
} from '../utils/serpUtils';

export default function SerpPreview({ theme, onNotify }) {
  // Input fields
  const [title, setTitle] = useState(SERP_PRESETS[0].title);
  const [description, setDescription] = useState(SERP_PRESETS[0].description);
  const [url, setUrl] = useState(SERP_PRESETS[0].url);
  const [siteName, setSiteName] = useState(SERP_PRESETS[0].siteName);
  const [keyword, setKeyword] = useState(SERP_PRESETS[0].keyword);
  const [imageUrl, setImageUrl] = useState(SERP_PRESETS[0].imageUrl);

  // Rich snippet options
  const [showDate, setShowDate] = useState(true);
  const [publishedDate, setPublishedDate] = useState('Oct 30, 2026');
  const [showRating, setShowRating] = useState(true);
  const [rating, setRating] = useState(4.9);
  const [reviewsCount, setReviewsCount] = useState(312);
  const [showSitelinks, setShowSitelinks] = useState(true);
  const [sitelinks] = useState(SERP_PRESETS[0].sitelinks);

  // Active preview viewport tab: 'desktop' | 'mobile' | 'facebook' | 'twitter' | 'code'
  const [previewTab, setPreviewTab] = useState('desktop');
  const [copiedKey, setCopiedKey] = useState(null);

  // Calculated Pixel Width & SEO Diagnostics
  const titlePixels = useMemo(() => calculateTitlePixels(title), [title]);
  const breadcrumbs = useMemo(() => formatBreadcrumbs(url), [url]);

  const seoScoreData = useMemo(() => {
    return calculateSeoScore({ title, description, url, keyword });
  }, [title, description, url, keyword]);

  // Truncated previews
  const desktopTitleDisplay = useMemo(() => truncateByPixels(title, MAX_DESKTOP_TITLE_PIXELS), [title]);
  const mobileTitleDisplay = useMemo(() => truncateByPixels(title, 650), [title]);
  const desktopDescDisplay = useMemo(() => truncateDescription(description, 160), [description]);
  const mobileDescDisplay = useMemo(() => truncateDescription(description, 120), [description]);

  // Generated Meta Tags Code
  const metaTagsCode = useMemo(() => {
    return generateMetaTags({
      title,
      description,
      url,
      siteName,
      imageUrl,
      publishedDate: showDate ? publishedDate : ''
    });
  }, [title, description, url, siteName, imageUrl, showDate, publishedDate]);

  // Copy helper
  const handleCopy = useCallback(async (text, key = 'generic', label = 'Content') => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      onNotify?.({ type: 'success', title: 'Copied to Clipboard', message: `${label} copied.` });
    } else {
      onNotify?.({ type: 'error', title: 'Copy Failed', message: 'Unable to copy to clipboard.' });
    }
  }, [onNotify]);

  // Apply Preset
  const handleApplyPreset = (preset) => {
    setTitle(preset.title);
    setDescription(preset.description);
    setUrl(preset.url);
    setSiteName(preset.siteName);
    setKeyword(preset.keyword);
    setImageUrl(preset.imageUrl || '');
    if (preset.publishedDate) {
      setShowDate(true);
      setPublishedDate(preset.publishedDate);
    } else {
      setShowDate(false);
    }
    if (preset.rating) {
      setShowRating(true);
      setRating(preset.rating);
      setReviewsCount(preset.reviewsCount || 100);
    } else {
      setShowRating(false);
    }
    onNotify?.({
      type: 'info',
      title: 'Preset Loaded',
      message: `Loaded template: ${preset.name}`
    });
  };

  // Reset to default
  const handleReset = () => {
    handleApplyPreset(SERP_PRESETS[0]);
  };

  // Helper to render keyword highlighting in search description
  const renderHighlightedSnippet = (text, kw) => {
    if (!kw || !kw.trim()) return text;
    const cleanKw = kw.trim();
    // Escape regex
    const escaped = cleanKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (part.toLowerCase() === cleanKw.toLowerCase()) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-white">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  // Pixel width status color
  const pixelProgressColor = useMemo(() => {
    if (titlePixels <= 560) return 'bg-emerald-500';
    if (titlePixels <= 600) return 'bg-amber-500';
    return 'bg-rose-500';
  }, [titlePixels]);

  return (
    <div className="w-full space-y-6">
      {/* Preset Bar */}
      <div className="bg-white dark:bg-[#0c111a] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Templates:</span>
          </div>
          {SERP_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800/80 transition-all shrink-0 whitespace-nowrap shadow-2xs"
            >
              {p.name}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 shrink-0 self-end sm:self-center"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Form</span>
        </button>
      </div>

      {/* Main Grid: Inputs Column (left) + Live Previews & Diagnostics (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form Controls (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-[#0c111a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>SERP Meta Tag Inputs</span>
            </h2>

            {/* 1. Page Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  Page Title (&lt;title&gt;)
                </label>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className={title.length > 60 ? 'text-amber-500 font-bold' : 'text-slate-500'}>
                    {title.length} chars
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className={titlePixels > MAX_DESKTOP_TITLE_PIXELS ? 'text-rose-500 font-bold' : 'text-slate-500'}>
                    {titlePixels} / 600px
                  </span>
                </div>
              </div>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Page Title - Brand Name"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />

              {/* Title Pixel Meter Bar */}
              <div className="space-y-1 pt-0.5">
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${pixelProgressColor}`}
                    style={{ width: `${Math.min(100, (titlePixels / MAX_DESKTOP_TITLE_PIXELS) * 100)}%` }}
                  />
                </div>
                {titlePixels > MAX_DESKTOP_TITLE_PIXELS && (
                  <p className="text-[10px] text-rose-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>Title exceeds 600px and will be truncated with &quot;...&quot;</span>
                  </p>
                )}
              </div>
            </div>

            {/* 2. Meta Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  Meta Description
                </label>
                <span className={`text-[11px] font-mono ${description.length > 160 ? 'text-amber-500 font-bold' : 'text-slate-500'}`}>
                  {description.length} / 160 chars
                </span>
              </div>

              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Compelling, accurate summary of your page content for searchers..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
              />
            </div>

            {/* 3. URL and Site Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  Target URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/slug"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  Site Name
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Brand / Site Name"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* 4. Target Keyword for Bold Matching */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  Focus Keyword
                </label>
                <span className="text-[10px] text-slate-400">Highlights matches in bold</span>
              </div>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. developer toolkit"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* 5. Rich Snippet Features (Toggles) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Rich Result Extensions
              </span>

              {/* Date toggle */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={showDate}
                    onChange={(e) => setShowDate(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Publication Date</span>
                </label>
                {showDate && (
                  <input
                    type="text"
                    value={publishedDate}
                    onChange={(e) => setPublishedDate(e.target.value)}
                    className="w-28 px-2 py-1 text-[11px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300"
                  />
                )}
              </div>

              {/* Star Rating toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showRating}
                      onChange={(e) => setShowRating(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Review Ratings (Schema)</span>
                  </label>
                </div>

                {showRating && (
                  <div className="grid grid-cols-2 gap-2 pl-6">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>Stars:</span>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={rating}
                        onChange={(e) => setRating(parseFloat(e.target.value) || 5)}
                        className="w-16 px-2 py-0.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>Votes:</span>
                      <input
                        type="number"
                        min="1"
                        value={reviewsCount}
                        onChange={(e) => setReviewsCount(parseInt(e.target.value, 10) || 1)}
                        className="w-20 px-2 py-0.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sitelinks toggle */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={showSitelinks}
                    onChange={(e) => setShowSitelinks(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Sitelinks Preview (Mini Links)</span>
                </label>
              </div>

              {/* Social Image URL */}
              <div className="space-y-1 pt-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Social Card Image URL (OG / Twitter)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/og-image.jpg"
                  className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>

          </div>

          {/* SEO Diagnostic Score Gauge Card */}
          <div className="bg-white dark:bg-[#0c111a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  SEO Quality Score
                </h3>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className={`text-3xl font-black font-mono ${
                    seoScoreData.score >= 90 ? 'text-emerald-500' :
                    seoScoreData.score >= 70 ? 'text-amber-500' : 'text-rose-500'
                  }`}>
                    {seoScoreData.score}
                  </span>
                  <span className="text-xs text-slate-400">/ 100</span>
                </div>
              </div>

              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                seoScoreData.score >= 90 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                seoScoreData.score >= 70 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {seoScoreData.score >= 90 ? 'Excellent' : seoScoreData.score >= 70 ? 'Needs Attention' : 'Poor'}
              </div>
            </div>

            {/* Checklist items */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {seoScoreData.checks.map((c, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs">
                  {c.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                  {c.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                  {c.status === 'error' && <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                  {c.status === 'info' && <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
                  
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {c.label}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {c.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Previews (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white dark:bg-[#0c111a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            
            {/* Viewport & Platform Switcher Tabs */}
            <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 overflow-x-auto no-scrollbar gap-2">
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewTab('desktop')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    previewTab === 'desktop'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Google Desktop</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewTab('mobile')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    previewTab === 'mobile'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Google Mobile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewTab('social')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    previewTab === 'social'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Social (OG / X)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewTab('code')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    previewTab === 'code'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>HTML Meta Tags</span>
                </button>
              </div>

              {/* Quick Copy actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(title, 'title', 'Title')}
                  className="px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-slate-800"
                  title="Copy Page Title"
                >
                  {copiedKey === 'title' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : 'Copy Title'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(description, 'desc', 'Description')}
                  className="px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-slate-800"
                  title="Copy Meta Description"
                >
                  {copiedKey === 'desc' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : 'Copy Desc'}
                </button>
              </div>
            </div>

            {/* Preview Window Canvas */}
            <div className="p-6 bg-slate-100/60 dark:bg-slate-950/60 min-h-[420px] flex flex-col justify-center">

              {/* 1. GOOGLE DESKTOP PREVIEW */}
              {previewTab === 'desktop' && (
                <div className="max-w-[650px] w-full mx-auto bg-white dark:bg-[#1f1f1f] p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-2 text-left font-sans">
                  {/* Google Favicon & URL line */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      {siteName ? siteName.charAt(0).toUpperCase() : 'G'}
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-[13px] font-medium text-slate-800 dark:text-slate-200">
                        {siteName || 'Example Site'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[500px]">
                        {breadcrumbs.full}
                      </span>
                    </div>
                  </div>

                  {/* Title Link (20px Arial Google link style) */}
                  <h3 className="text-[20px] leading-[26px] font-normal text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer break-words">
                    {desktopTitleDisplay || 'Page Title'}
                  </h3>

                  {/* Star Ratings Row */}
                  {showRating && (
                    <div className="flex items-center gap-1.5 text-[12px] text-slate-600 dark:text-slate-300">
                      <div className="flex items-center text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                      </div>
                      <span className="font-semibold">{rating.toFixed(1)}</span>
                      <span className="text-slate-400">({reviewsCount.toLocaleString()})</span>
                    </div>
                  )}

                  {/* Description with Date & Bold Keyword Matches */}
                  <p className="text-[14px] leading-[22px] text-[#4d5156] dark:text-[#bdc1c6] break-words">
                    {showDate && publishedDate && (
                      <span className="text-slate-500 dark:text-slate-400 mr-1.5">
                        {publishedDate} —
                      </span>
                    )}
                    {renderHighlightedSnippet(desktopDescDisplay || 'Meta description text will appear here.', keyword)}
                  </p>

                  {/* Sitelinks Mini Grid */}
                  {showSitelinks && sitelinks && sitelinks.length > 0 && (
                    <div className="pt-3 grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800/80">
                      {sitelinks.slice(0, 4).map((sl, i) => (
                        <div key={i} className="text-left space-y-0.5">
                          <a
                            href={sl.url}
                            onClick={(e) => e.preventDefault()}
                            className="text-[13px] font-medium text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer truncate block"
                          >
                            {sl.title}
                          </a>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate block">
                            {sl.url}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. GOOGLE MOBILE PREVIEW */}
              {previewTab === 'mobile' && (
                <div className="max-w-[380px] w-full mx-auto bg-white dark:bg-[#1f1f1f] p-4 rounded-3xl shadow-md border border-slate-200 dark:border-slate-800 space-y-2 text-left font-sans">
                  {/* Mobile Header line */}
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300">
                      {siteName ? siteName.charAt(0).toUpperCase() : 'G'}
                    </div>
                    <div className="flex flex-col text-[12px] leading-tight">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {siteName || 'Example'}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        {breadcrumbs.domain}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Title */}
                  <h3 className="text-[16px] leading-[22px] font-medium text-[#1a0dab] dark:text-[#8ab4f8] break-words">
                    {mobileTitleDisplay || 'Page Title'}
                  </h3>

                  {/* Mobile Star Rating */}
                  {showRating && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="font-semibold">{rating.toFixed(1)}</span>
                      <span className="text-slate-400">({reviewsCount})</span>
                    </div>
                  )}

                  {/* Mobile Description */}
                  <p className="text-[12px] leading-[18px] text-[#4d5156] dark:text-[#bdc1c6] break-words">
                    {showDate && publishedDate && (
                      <span className="text-slate-400 mr-1">
                        {publishedDate} —
                      </span>
                    )}
                    {renderHighlightedSnippet(mobileDescDisplay || 'Meta description preview...', keyword)}
                  </p>
                </div>
              )}

              {/* 3. SOCIAL (OPEN GRAPH & TWITTER) PREVIEW */}
              {previewTab === 'social' && (
                <div className="max-w-[500px] w-full mx-auto space-y-4">
                  {/* Open Graph Card */}
                  <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm text-left">
                    <div className="relative aspect-[1.91/1] w-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                      {imageUrl ? (
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-slate-400 text-xs flex flex-col items-center gap-1">
                          <Share2 className="w-6 h-6" />
                          <span>1200 x 630 Social Preview Image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                        {breadcrumbs.domain}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {title || 'Card Title'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {description || 'Card description summary...'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. HTML META TAGS CODE */}
              {previewTab === 'code' && (
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Ready-to-paste &lt;head&gt; tags:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(metaTagsCode, 'meta_all', 'Meta Tags')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      {copiedKey === 'meta_all' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy All Meta Tags</span>
                    </button>
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <CodeEditor
                      value={metaTagsCode}
                      readOnly={true}
                      height="320px"
                      language="html"
                      theme={theme}
                    />
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
