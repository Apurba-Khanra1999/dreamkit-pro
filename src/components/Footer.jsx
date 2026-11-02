import React from 'react';
import { Braces, ShieldCheck, Terminal } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer({ onSelectTool }) {
  const handleToolClick = (toolId) => {
    onSelectTool(toolId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full mt-auto border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-[#0c111a]/60 backdrop-blur-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Brand & Slogan */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div 
              onClick={() => handleToolClick('dashboard')}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <Braces className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                JSON<span className="text-indigo-600 dark:text-indigo-400">Studio</span>
              </span>
            </div>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-indigo-500" />
              <span>Modular Developer Suite</span>
            </span>
          </div>

          {/* Tool Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
            <button
              type="button"
              onClick={() => handleToolClick('landing')}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline transition-colors"
            >
              SaaS Landing Page
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('dashboard')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Dashboard
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('formatter')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              JSON Formatter
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('minifier')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              JSON Minifier
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('json_xml')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              JSON ⇄ XML
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('json_csv')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              JSON ⇄ CSV
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('yaml_formatter')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              YAML Formatter
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('xml_formatter')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              XML Formatter
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('html_formatter')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              HTML Formatter
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('css_formatter')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              CSS Formatter
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('js_formatter')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              JS Formatter
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('sql_formatter')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              SQL Formatter
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('html_table')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              HTML Table
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('base64')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Base64
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('url_encoder')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              URL Encoder
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('uuid_generator')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              UUID Generator
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('lorem_ipsum')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Lorem Ipsum
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('regex_tester')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Regex Tester
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('jwt_debugger')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              JWT Decoder
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('http_status')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              HTTP Status Codes
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('serp_preview')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              SERP Preview
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('robots_sitemap')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Robots & Sitemap
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('schema_markup')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Schema Markup
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('image_compressor')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Image Compressor
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('image_resizer')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Resizer & Cropper
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('image_converter')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Format Converter
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('image_watermark')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Image Watermark
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('image_grayscale')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Image to Grayscale
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('image_blur')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Image Blur
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('image_pixelator')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Image Pixelator
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('social_media_resizer')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Social Resizer
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('favicon_generator')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Favicon Generator
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('svg_optimizer')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              SVG Optimizer
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('placeholder_image')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Placeholder Image
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('word_counter')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Word Counter
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('qr_code_generator')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              QR Generator
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('seo_audit')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              SEO Audit
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('pdf_compressor')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              PDF Compressor
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('pdf_merger')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              PDF Merger
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('pdf_splitter')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              PDF Splitter
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('pdf_reorder')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              PDF Reorder
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('pdf_converter')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              PDF Converter
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('pdf_watermark')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              PDF Watermark
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('pdf_signature')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              PDF Signature
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('pdf_ocr')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              PDF OCR Extractor
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('pdf_grayscale')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              PDF to Grayscale
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('audio_extractor')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Audio Extractor
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleToolClick('color_palette')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Color Palette
            </button>
          </div>

          {/* Privacy Note & Copyright */}
          <div className="flex flex-col sm:flex-row items-center gap-2 text-xs text-slate-400 dark:text-slate-500 text-center sm:text-right">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Local browser execution</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <span>&copy; {CURRENT_YEAR} JSON Studio</span>
          </div>

        </div>
      </div>
    </footer>
  );
}
