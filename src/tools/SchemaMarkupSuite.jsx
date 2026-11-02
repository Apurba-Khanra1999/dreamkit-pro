import React, { useState, useMemo, useCallback } from 'react';
import { 
  FileJson, 
  Code2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  Check, 
  Download, 
  Plus, 
  Trash2, 
  Upload, 
  ArrowRight, 
  ExternalLink, 
  RotateCcw,
  Building2,
  ShoppingBag,
  HelpCircle,
  Briefcase,
  Calendar,
  User,
  Sparkles
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { copyToClipboard, downloadJsonFile, readUploadedJsonFile } from '../utils/fileUtils';
import { 
  SCHEMA_TYPES, 
  SCHEMA_PRESETS, 
  buildSchemaJsonLd, 
  formatJsonLdScript, 
  validateSchemaMarkup 
} from '../utils/schemaMarkupUtils';

export default function SchemaMarkupSuite({ theme, onNotify }) {
  // Mode switcher: 'generator' | 'validator'
  const [activeTab, setActiveTab] = useState('generator');
  const [copiedKey, setCopiedKey] = useState(null);

  // ==========================================
  // TAB 1: GENERATOR STATE
  // ==========================================
  const [selectedType, setSelectedType] = useState('Article');
  const [formData, setFormData] = useState(() => ({ ...SCHEMA_PRESETS.Article }));
  const [outputMode, setOutputMode] = useState('script'); // 'script' | 'raw'

  // Update form data when schema type changes
  const handleTypeChange = (typeId) => {
    setSelectedType(typeId);
    if (SCHEMA_PRESETS[typeId]) {
      setFormData({ ...SCHEMA_PRESETS[typeId] });
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Generated JSON-LD Object & Output string
  const generatedSchemaObj = useMemo(() => {
    return buildSchemaJsonLd(selectedType, formData);
  }, [selectedType, formData]);

  const generatedOutput = useMemo(() => {
    if (outputMode === 'raw') {
      return JSON.stringify(generatedSchemaObj, null, 2);
    }
    return formatJsonLdScript(generatedSchemaObj);
  }, [generatedSchemaObj, outputMode]);

  // ==========================================
  // TAB 2: VALIDATOR STATE
  // ==========================================
  const [validatorCode, setValidatorCode] = useState(() => {
    return formatJsonLdScript(buildSchemaJsonLd('Product', SCHEMA_PRESETS.Product));
  });

  const validationResult = useMemo(() => {
    return validateSchemaMarkup(validatorCode);
  }, [validatorCode]);

  // Shared Copy Helper
  const handleCopy = useCallback(async (text, key = 'generic', label = 'Content') => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      onNotify?.({ type: 'success', title: 'Copied', message: `${label} copied to clipboard.` });
    } else {
      onNotify?.({ type: 'error', title: 'Copy Failed', message: 'Unable to copy to clipboard.' });
    }
  }, [onNotify]);

  // Download Helper
  const handleDownload = (content, filename, mime = 'application/json') => {
    if (!content) return;
    downloadJsonFile(content, filename, mime);
    onNotify?.({ type: 'success', title: 'File Downloaded', message: `Saved as ${filename}.` });
  };

  // Upload file for validator
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await readUploadedJsonFile(file);
      setValidatorCode(res.content);
      onNotify?.({ type: 'success', title: 'File Uploaded', message: `Loaded ${file.name} for validation.` });
    } catch (err) {
      onNotify?.({ type: 'error', title: 'Upload Failed', message: err.message });
    }
  };

  // Helper icon for schema type
  const getTypeIcon = (typeId) => {
    switch (typeId) {
      case 'Article': return <Code2 className="w-3.5 h-3.5" />;
      case 'Product': return <ShoppingBag className="w-3.5 h-3.5" />;
      case 'FAQPage': return <HelpCircle className="w-3.5 h-3.5" />;
      case 'LocalBusiness': return <Building2 className="w-3.5 h-3.5" />;
      case 'Organization': return <Building2 className="w-3.5 h-3.5" />;
      case 'JobPosting': return <Briefcase className="w-3.5 h-3.5" />;
      case 'Event': return <Calendar className="w-3.5 h-3.5" />;
      case 'Person': return <User className="w-3.5 h-3.5" />;
      default: return <FileJson className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Suite Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c111a] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          
          <button
            type="button"
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'generator'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Schema Markup Generator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('validator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'validator'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Schema Markup Validator & Inspector</span>
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-[11px] font-mono text-slate-400">Google Rich Results & Schema.org</span>
        </div>
      </div>

      {/* ==========================================
          TAB 1: SCHEMA MARKUP GENERATOR
      ========================================== */}
      {activeTab === 'generator' && (
        <div className="space-y-6">
          
          {/* Schema Type Selector Bar */}
          <div className="bg-white dark:bg-[#0c111a] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Select Schema.org Entity Type:
              </span>
              {SCHEMA_TYPES.find(t => t.id === selectedType)?.googleDoc && (
                <a
                  href={SCHEMA_TYPES.find(t => t.id === selectedType).googleDoc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>Google Guidelines</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {SCHEMA_TYPES.map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleTypeChange(st.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    selectedType === st.id
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {getTypeIcon(st.id)}
                  <span>{st.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Inputs & Live JSON-LD Output Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Customized Form Inputs (6 cols on desktop) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white dark:bg-[#0c111a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      {selectedType} Properties
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {SCHEMA_TYPES.find(t => t.id === selectedType)?.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (SCHEMA_PRESETS[selectedType]) {
                        setFormData({ ...SCHEMA_PRESETS[selectedType] });
                        onNotify?.({ type: 'info', title: 'Reset to Preset', message: `Restored sample data for ${selectedType}.` });
                      }
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* DYNAMIC FORM FIELDS ACCORDING TO TYPE */}
                {selectedType === 'Article' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-900 dark:text-white">Headline (Required)</label>
                      <input
                        type="text"
                        value={formData.headline || ''}
                        onChange={(e) => handleFieldChange('headline', e.target.value)}
                        placeholder="Article Headline"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-900 dark:text-white">Article Description</label>
                      <textarea
                        rows={2}
                        value={formData.description || ''}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        placeholder="Summary of the article content"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900 dark:text-white">Author Name</label>
                        <input
                          type="text"
                          value={formData.authorName || ''}
                          onChange={(e) => handleFieldChange('authorName', e.target.value)}
                          placeholder="Elena Rostova"
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900 dark:text-white">Author URL</label>
                        <input
                          type="url"
                          value={formData.authorUrl || ''}
                          onChange={(e) => handleFieldChange('authorUrl', e.target.value)}
                          placeholder="https://example.com/author"
                          className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900 dark:text-white">Date Published</label>
                        <input
                          type="date"
                          value={formData.datePublished || ''}
                          onChange={(e) => handleFieldChange('datePublished', e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900 dark:text-white">Date Modified</label>
                        <input
                          type="date"
                          value={formData.dateModified || ''}
                          onChange={(e) => handleFieldChange('dateModified', e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-900 dark:text-white">Featured Image URL</label>
                      <input
                        type="url"
                        value={formData.image || ''}
                        onChange={(e) => handleFieldChange('image', e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {selectedType === 'Product' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-900 dark:text-white">Product Name (Required)</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        placeholder="Wireless Headphones Pro"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900 dark:text-white">Brand Name</label>
                        <input
                          type="text"
                          value={formData.brand || ''}
                          onChange={(e) => handleFieldChange('brand', e.target.value)}
                          placeholder="AcousticLab"
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900 dark:text-white">SKU / MPN</label>
                        <input
                          type="text"
                          value={formData.sku || ''}
                          onChange={(e) => handleFieldChange('sku', e.target.value)}
                          placeholder="AL-NC-900"
                          className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900 dark:text-white">Price</label>
                        <input
                          type="text"
                          value={formData.price || ''}
                          onChange={(e) => handleFieldChange('price', e.target.value)}
                          placeholder="299.99"
                          className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900 dark:text-white">Currency</label>
                        <input
                          type="text"
                          value={formData.currency || 'USD'}
                          onChange={(e) => handleFieldChange('currency', e.target.value)}
                          placeholder="USD"
                          className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900 dark:text-white">Availability</label>
                        <select
                          value={formData.availability || 'https://schema.org/InStock'}
                          onChange={(e) => handleFieldChange('availability', e.target.value)}
                          className="w-full px-2 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                        >
                          <option value="https://schema.org/InStock">In Stock</option>
                          <option value="https://schema.org/OutOfStock">Out of Stock</option>
                          <option value="https://schema.org/PreOrder">Pre-Order</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-900 dark:text-white">Product Image URL</label>
                      <input
                        type="url"
                        value={formData.image || ''}
                        onChange={(e) => handleFieldChange('image', e.target.value)}
                        placeholder="https://example.com/product.jpg"
                        className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Rating Section */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!formData.hasRating}
                            onChange={(e) => handleFieldChange('hasRating', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600"
                          />
                          <span>Include Aggregate Rating (Star Snippets)</span>
                        </label>
                      </div>

                      {formData.hasRating && (
                        <div className="grid grid-cols-2 gap-3 pl-5">
                          <div className="space-y-1">
                            <span className="text-[11px] text-slate-500">Rating (1.0 to 5.0):</span>
                            <input
                              type="number"
                              step="0.1"
                              min="1"
                              max="5"
                              value={formData.ratingValue || '5.0'}
                              onChange={(e) => handleFieldChange('ratingValue', e.target.value)}
                              className="w-full px-2 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[11px] text-slate-500">Review Count:</span>
                            <input
                              type="number"
                              min="1"
                              value={formData.reviewCount || '10'}
                              onChange={(e) => handleFieldChange('reviewCount', e.target.value)}
                              className="w-full px-2 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedType === 'FAQPage' && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {(formData.faqs || []).map((faq, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 relative">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                              Question #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = formData.faqs.filter((_, i) => i !== idx);
                                handleFieldChange('faqs', updated);
                              }}
                              className="text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) => {
                              const updated = [...formData.faqs];
                              updated[idx].question = e.target.value;
                              handleFieldChange('faqs', updated);
                            }}
                            placeholder="Question"
                            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                          />

                          <textarea
                            rows={2}
                            value={faq.answer}
                            onChange={(e) => {
                              const updated = [...formData.faqs];
                              updated[idx].answer = e.target.value;
                              handleFieldChange('faqs', updated);
                            }}
                            placeholder="Answer"
                            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white resize-none"
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...(formData.faqs || []), { question: '', answer: '' }];
                        handleFieldChange('faqs', updated);
                      }}
                      className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Another Question</span>
                    </button>
                  </div>
                )}

                {selectedType === 'LocalBusiness' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-900 dark:text-white">Business Name (Required)</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        placeholder="Coffee Roasters & Bakery"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900 dark:text-white">Telephone</label>
                        <input
                          type="tel"
                          value={formData.telephone || ''}
                          onChange={(e) => handleFieldChange('telephone', e.target.value)}
                          placeholder="+1-555-019-2834"
                          className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900 dark:text-white">Price Range</label>
                        <input
                          type="text"
                          value={formData.priceRange || '$$'}
                          onChange={(e) => handleFieldChange('priceRange', e.target.value)}
                          placeholder="$$"
                          className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-900 dark:text-white">Street Address</label>
                      <input
                        type="text"
                        value={formData.streetAddress || ''}
                        onChange={(e) => handleFieldChange('streetAddress', e.target.value)}
                        placeholder="142 Market Street"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={formData.addressLocality || ''}
                        onChange={(e) => handleFieldChange('addressLocality', e.target.value)}
                        placeholder="City"
                        className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={formData.addressRegion || ''}
                        onChange={(e) => handleFieldChange('addressRegion', e.target.value)}
                        placeholder="State"
                        className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={formData.postalCode || ''}
                        onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                        placeholder="Zip"
                        className="px-2 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Fallback for other schema types */}
                {!['Article', 'Product', 'FAQPage', 'LocalBusiness'].includes(selectedType) && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-900 dark:text-white">Name / Title</label>
                      <input
                        type="text"
                        value={formData.name || formData.title || ''}
                        onChange={(e) => handleFieldChange(formData.name !== undefined ? 'name' : 'title', e.target.value)}
                        placeholder="Entity Name"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-900 dark:text-white">URL</label>
                      <input
                        type="url"
                        value={formData.url || ''}
                        onChange={(e) => handleFieldChange('url', e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>

                    {formData.description !== undefined && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-900 dark:text-white">Description</label>
                        <textarea
                          rows={2}
                          value={formData.description || ''}
                          onChange={(e) => handleFieldChange('description', e.target.value)}
                          placeholder="Description"
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white resize-none"
                        />
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* Right Column: Live Output & Code Actions (6 cols on desktop) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white dark:bg-[#0c111a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      JSON-LD Output
                    </span>

                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
                      <button
                        type="button"
                        onClick={() => setOutputMode('script')}
                        className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                          outputMode === 'script'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        &lt;script&gt;
                      </button>
                      <button
                        type="button"
                        onClick={() => setOutputMode('raw')}
                        className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                          outputMode === 'raw'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Raw JSON
                      </button>
                    </div>
                  </div>

                  {/* Bridge button to Validator */}
                  <button
                    type="button"
                    onClick={() => {
                      setValidatorCode(generatedOutput);
                      setActiveTab('validator');
                      onNotify?.({ type: 'success', title: 'Sent to Validator', message: `Loaded ${selectedType} into Schema Validator.` });
                    }}
                    className="px-2.5 py-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Validate This</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <CodeEditor
                    value={generatedOutput}
                    readOnly={true}
                    height="420px"
                    language={outputMode === 'script' ? 'html' : 'json'}
                    theme={theme}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Schema.org @context: https://schema.org
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedOutput, 'gen_schema', 'JSON-LD Schema')}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                    >
                      {copiedKey === 'gen_schema' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Code</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(generatedOutput, `schema-${selectedType.toLowerCase()}.json`)}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: SCHEMA MARKUP VALIDATOR & INSPECTOR
      ========================================== */}
      {activeTab === 'validator' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Code Input (6 cols on desktop) */}
            <div className="lg:col-span-6 bg-white dark:bg-[#0c111a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileJson className="w-3.5 h-3.5 text-indigo-500" />
                  <span>JSON-LD Schema Code</span>
                </h3>

                <div className="flex items-center gap-2">
                  <label className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>Upload .json</span>
                    <input
                      type="file"
                      accept=".json,.html,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <select
                    onChange={(e) => {
                      const type = e.target.value;
                      if (SCHEMA_PRESETS[type]) {
                        setValidatorCode(formatJsonLdScript(buildSchemaJsonLd(type, SCHEMA_PRESETS[type])));
                      }
                    }}
                    defaultValue="Product"
                    className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300"
                  >
                    {SCHEMA_TYPES.map(t => (
                      <option key={t.id} value={t.id}>Sample: {t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <CodeEditor
                  value={validatorCode}
                  onChange={setValidatorCode}
                  height="440px"
                  language="html"
                  theme={theme}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400 font-mono">
                  Extracts JSON-LD from &lt;script&gt; or parses raw JSON
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(validatorCode, 'val_code', 'Validated Code')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Code</span>
                </button>
              </div>
            </div>

            {/* Right Column: Google Rich Results Diagnostics & Score (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white dark:bg-[#0c111a] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                
                {/* Header: Score & Rich Result Readiness */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Google Rich Results Eligibility
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className={`text-3xl font-black font-mono ${
                        validationResult.score >= 90 ? 'text-emerald-500' :
                        validationResult.score >= 70 ? 'text-amber-500' : 'text-rose-500'
                      }`}>
                        {validationResult.score}%
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {validationResult.isValid ? 'Eligible for Rich Snippets' : 'Fix Required Errors'}
                      </span>
                    </div>
                  </div>

                  <a
                    href="https://search.google.com/test/rich-results"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Google Tester</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Entity Summary Badges */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Schema Type</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono truncate block">
                      {validationResult.extractedType}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Context</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono truncate block">
                      schema.org
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Properties</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono block">
                      {validationResult.nodeCount} nodes
                    </span>
                  </div>
                </div>

                {/* ERRORS & WARNINGS ACCORDION / LIST */}
                <div className="space-y-3 pt-2">
                  
                  {/* Critical Errors */}
                  {validationResult.errors.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Errors (Prevents Google Rich Results)</span>
                      </span>
                      <div className="space-y-1">
                        {validationResult.errors.map((err, i) => (
                          <div key={i} className="text-xs p-2.5 rounded-xl bg-rose-500/10 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-200 flex items-start gap-2">
                            <span className="font-mono font-bold shrink-0">{err.field}:</span>
                            <span>{err.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {validationResult.warnings.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Warnings (Recommended by Google)</span>
                      </span>
                      <div className="space-y-1">
                        {validationResult.warnings.map((w, i) => (
                          <div key={i} className="text-xs p-2.5 rounded-xl bg-amber-500/10 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200 flex items-start gap-2">
                            <span className="font-mono font-bold shrink-0">{w.field}:</span>
                            <span>{w.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Passed checks */}
                  {validationResult.passed.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Passed Specifications ({validationResult.passed.length})</span>
                      </span>
                      <div className="space-y-1 max-h-44 overflow-y-auto no-scrollbar">
                        {validationResult.passed.map((p, i) => (
                          <div key={i} className="text-xs p-2 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                            <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="font-mono font-semibold">{p.field}</span>
                            <span className="text-slate-500 dark:text-slate-400 truncate">{p.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
