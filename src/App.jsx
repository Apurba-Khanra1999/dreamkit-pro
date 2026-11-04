import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import AdminNavbar from './components/AdminNavbar';
import DashboardOverview from './components/DashboardOverview';
import ToolNavigation from './components/ToolNavigation';
import JsonFormatter from './tools/JsonFormatter';
import JsonMinifier from './tools/JsonMinifier';
import JsonXmlConverter from './tools/JsonXmlConverter';
import JsonCsvConverter from './tools/JsonCsvConverter';
import YamlFormatter from './tools/YamlFormatter';
import XmlFormatter from './tools/XmlFormatter';
import HtmlFormatter from './tools/HtmlFormatter';
import CssFormatter from './tools/CssFormatter';
import JsFormatter from './tools/JsFormatter';
import SqlFormatter from './tools/SqlFormatter';
import HtmlTableGenerator from './tools/HtmlTableGenerator';
import RegexTester from './tools/RegexTester';
import JwtDecoder from './tools/JwtDecoder';
import Base64Tool from './tools/Base64Tool';
import UrlEncoderTool from './tools/UrlEncoderTool';
import UuidGenerator from './tools/UuidGenerator';
import LoremIpsumGenerator from './tools/LoremIpsumGenerator';
import HttpStatusCodeLookup from './tools/HttpStatusCodeLookup';
import SerpPreview from './tools/SerpPreview';
import RobotsSitemapSuite from './tools/RobotsSitemapSuite';
import SchemaMarkupSuite from './tools/SchemaMarkupSuite';
import ImageCompressorSuite from './tools/ImageCompressorSuite';
import ImageResizerCropperSuite from './tools/ImageResizerCropperSuite';
import ImageFormatConverterSuite from './tools/ImageFormatConverterSuite';
import ImageWatermarkSuite from './tools/ImageWatermarkSuite';
import ImageGrayscaleSuite from './tools/ImageGrayscaleSuite';
import ImageBlurSuite from './tools/ImageBlurSuite';
import ImagePixelatorSuite from './tools/ImagePixelatorSuite';
import SocialMediaResizerSuite from './tools/SocialMediaResizerSuite';
import FaviconAppIconSuite from './tools/FaviconAppIconSuite';
import SvgOptimizerSuite from './tools/SvgOptimizerSuite';
import PlaceholderGeneratorSuite from './tools/PlaceholderGeneratorSuite';
import WordCounterSuite from './tools/WordCounterSuite';
import QrCodeGeneratorSuite from './tools/QrCodeGeneratorSuite';
import SeoAuditSuite from './tools/SeoAuditSuite';
import PdfCompressorSuite from './tools/PdfCompressorSuite';
import PdfMergerSuite from './tools/PdfMergerSuite';
import PdfSplitterSuite from './tools/PdfSplitterSuite';
import PdfReorderSuite from './tools/PdfReorderSuite';
import PdfConverterSuite from './tools/PdfConverterSuite';
import PdfWatermarkSuite from './tools/PdfWatermarkSuite';
import PdfSignatureSuite from './tools/PdfSignatureSuite';
import PdfOcrSuite from './tools/PdfOcrSuite';
import PdfGrayscaleSuite from './tools/PdfGrayscaleSuite';
import AudioExtractorSuite from './tools/AudioExtractorSuite';
import ColorPaletteSuite from './tools/ColorPaletteSuite';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import ProfileSettingsModal from './components/ProfileSettingsModal';
import Footer from './components/Footer';
import ToastNotification from './components/ToastNotification';
import CommandPalette from './components/CommandPalette';
import { auth, onAuthStateChanged, logoutUser } from './config/firebase';
import { getToolFromUrl, syncUrlWithTool, updateDocumentSeo } from './utils/seoHelper';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [_authLoading, setAuthLoading] = useState(true);

  // Theme state: defaults to 'light' per user request
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('json_studio_theme');
    if (saved === 'light') return 'light';
    // Reset previous dark preference to light per user request
    return 'light';
  });

  // Active utility tool: checks deep-link URL first (?tool=...), then persisted storage
  const [activeTool, setActiveTool] = useState(() => {
    const urlTool = getToolFromUrl();
    if (urlTool) return urlTool;

    const wasLoggedIn = localStorage.getItem('dreamkit_logged_in') === 'true';
    const savedTool = localStorage.getItem('dreamkit_active_tool');

    // If user was logged in, always restore their active workspace tool or default to dashboard, NEVER landing
    if (wasLoggedIn) {
      return (savedTool && savedTool !== 'landing' && savedTool !== 'login') ? savedTool : 'dashboard';
    }

    // If not logged in, but user was working on a tool as a guest
    if (savedTool && savedTool !== 'landing' && savedTool !== 'login') {
      return savedTool;
    }

    return 'landing';
  });

  // Sidebar interactive states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('json_studio_sidebar_collapsed') === 'true';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Command palette modal state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Profile and account settings modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Toast notification state
  const [toasts, setToasts] = useState([]);

  // Dynamically update document title, meta tags, and URL query string for SEO & deep links
  useEffect(() => {
    updateDocumentSeo(activeTool);
    syncUrlWithTool(activeTool);
  }, [activeTool]);

  // Support browser Back and Forward navigation buttons
  useEffect(() => {
    const handlePopState = () => {
      const toolFromUrl = getToolFromUrl();
      if (toolFromUrl) {
        setActiveTool(toolFromUrl);
      } else {
        const wasLoggedIn = localStorage.getItem('dreamkit_logged_in') === 'true';
        setActiveTool(wasLoggedIn ? 'dashboard' : 'landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Persist active tool location across page refreshes
  useEffect(() => {
    if (activeTool && activeTool !== 'login') {
      localStorage.setItem('dreamkit_active_tool', activeTool);
    }
  }, [activeTool]);

  // Apply theme to document root
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('json_studio_theme', theme);
  }, [theme]);

  // Persist sidebar collapsed preference
  useEffect(() => {
    localStorage.setItem('json_studio_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  // Global hotkeys (Cmd+K for command palette, Cmd+1..4 for tool quick jumps)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ⌘K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      // ⌘1: Formatter
      if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        setActiveTool('formatter');
      }
      // ⌘2: Minifier
      if ((e.metaKey || e.ctrlKey) && e.key === '2') {
        e.preventDefault();
        setActiveTool('minifier');
      }
      // ⌘3: Base64
      if ((e.metaKey || e.ctrlKey) && e.key === '3') {
        e.preventDefault();
        setActiveTool('base64');
      }
      // ⌘4: URL Encoder
      if ((e.metaKey || e.ctrlKey) && e.key === '4') {
        e.preventDefault();
        setActiveTool('url_encoder');
      }
      // ⌘5: JSON to XML
      if ((e.metaKey || e.ctrlKey) && e.key === '5') {
        e.preventDefault();
        setActiveTool('json_xml');
      }
      // ⌘6: JSON to CSV
      if ((e.metaKey || e.ctrlKey) && e.key === '6') {
        e.preventDefault();
        setActiveTool('json_csv');
      }
      // ⌘7: YAML Formatter
      if ((e.metaKey || e.ctrlKey) && e.key === '7') {
        e.preventDefault();
        setActiveTool('yaml_formatter');
      }
      // ⌘8: XML Formatter
      if ((e.metaKey || e.ctrlKey) && e.key === '8') {
        e.preventDefault();
        setActiveTool('xml_formatter');
      }
      // ⌘9: HTML Formatter
      if ((e.metaKey || e.ctrlKey) && e.key === '9') {
        e.preventDefault();
        setActiveTool('html_formatter');
      }
      // ⌘0: CSS Formatter
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        setActiveTool('css_formatter');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toast dispatch helper: seamlessly supports both addToast('message', 'type') and addToast({ type, title, message })
  const addToast = useCallback((toastOrMessage, maybeType = 'info') => {
    let type = 'info';
    let title = '';
    let message = '';

    if (typeof toastOrMessage === 'string') {
      message = toastOrMessage;
      type = typeof maybeType === 'string' ? maybeType : 'info';
      title = type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Notice' : 'Information';
    } else if (toastOrMessage && typeof toastOrMessage === 'object') {
      type = toastOrMessage.type || 'info';
      title = toastOrMessage.title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Notice' : 'Information');
      message = toastOrMessage.message || '';
    }

    if (!message && !title) return;

    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    const newToast = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after 3.5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // Listen to Firebase auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        localStorage.setItem('dreamkit_logged_in', 'true');
        // If user is logged in but currently on landing or login, route to saved tool or dashboard
        setActiveTool((current) => {
          if (current === 'landing' || current === 'login') {
            const saved = localStorage.getItem('dreamkit_active_tool');
            return (saved && saved !== 'landing' && saved !== 'login') ? saved : 'dashboard';
          }
          return current;
        });
      } else {
        localStorage.removeItem('dreamkit_logged_in');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      localStorage.removeItem('dreamkit_logged_in');
      localStorage.setItem('dreamkit_active_tool', 'landing');
      setActiveTool('landing');
      addToast('Signed out of account', 'info');
    } catch {
      addToast('Failed to sign out', 'error');
    }
  }, [addToast]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Standalone Login View
  if (activeTool === 'login') {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#060911] text-[#F8FAFC]' : 'bg-[#FAFBFC] text-slate-900'} selection:bg-indigo-500 selection:text-white transition-colors duration-200`}>
        <LoginPage
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            localStorage.setItem('dreamkit_logged_in', 'true');
            const saved = localStorage.getItem('dreamkit_active_tool');
            const targetTool = (saved && saved !== 'landing' && saved !== 'login') ? saved : 'dashboard';
            setActiveTool(targetTool);
            addToast(`Signed in as ${user.displayName || user.email}`, 'success');
          }}
          onBackToHome={() => setActiveTool('landing')}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <ToastNotification toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  // Standalone Primary Landing Page View
  if (activeTool === 'landing') {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#060911] text-[#F8FAFC]' : 'bg-[#FAFBFC] text-slate-900'} selection:bg-indigo-500 selection:text-white transition-colors duration-200`}>
        <LandingPage
          onLaunchApp={() => setActiveTool('dashboard')}
          onSelectTool={(toolId) => setActiveTool(toolId)}
          theme={theme}
          onToggleTheme={toggleTheme}
          currentUser={currentUser}
          onLogin={() => setActiveTool('login')}
          onLogout={handleLogout}
          onOpenProfileSettings={() => setProfileModalOpen(true)}
        />

        {/* Command Palette Quick Switcher Modal */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onSelectTool={setActiveTool}
        />

        {/* Profile & Account Settings Modal */}
        <ProfileSettingsModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          currentUser={currentUser}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNotify={addToast}
        />

        {/* Toast Notification Container */}
        <ToastNotification toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#080C14] text-[#0F172A] dark:text-[#F8FAFC] selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Interactive Hostinger-Style Sidebar */}
      <Sidebar
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onOpenProfileSettings={() => setProfileModalOpen(true)}
      />

      {/* Main Content Area (shifted based on desktop sidebar width) */}
      <div
        className={`flex-1 flex flex-col min-h-screen w-full transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-[320px]'
        }`}
      >
        {/* Top Sticky Admin Navbar */}
        <AdminNavbar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          currentUser={currentUser}
          onLogin={() => setActiveTool('login')}
          onLogout={handleLogout}
          onOpenProfileSettings={() => setProfileModalOpen(true)}
        />

        {/* Dynamic Tool Workspace */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTool === 'dashboard' ? (
            <DashboardOverview onSelectTool={setActiveTool} />
          ) : (
            <section className="space-y-4">
              <ToolNavigation activeTool={activeTool} setActiveTool={setActiveTool} />
              
              {activeTool === 'formatter' && (
                <JsonFormatter theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'minifier' && (
                <JsonMinifier theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'json_xml' && (
                <JsonXmlConverter theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'json_csv' && (
                <JsonCsvConverter theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'yaml_formatter' && (
                <YamlFormatter theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'xml_formatter' && (
                <XmlFormatter theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'html_formatter' && (
                <HtmlFormatter theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'css_formatter' && (
                <CssFormatter theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'js_formatter' && (
                <JsFormatter theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'sql_formatter' && (
                <SqlFormatter theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'html_table' && (
                <HtmlTableGenerator theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'base64' && (
                <Base64Tool theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'url_encoder' && (
                <UrlEncoderTool theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'uuid_generator' && (
                <UuidGenerator theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'lorem_ipsum' && (
                <LoremIpsumGenerator theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'regex_tester' && (
                <RegexTester theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'jwt_debugger' && (
                <JwtDecoder theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'http_status' && (
                <HttpStatusCodeLookup theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'serp_preview' && (
                <SerpPreview theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'robots_sitemap' && (
                <RobotsSitemapSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'schema_markup' && (
                <SchemaMarkupSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'image_compressor' && (
                <ImageCompressorSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'image_resizer' && (
                <ImageResizerCropperSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'image_converter' && (
                <ImageFormatConverterSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'image_watermark' && (
                <ImageWatermarkSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'image_grayscale' && (
                <ImageGrayscaleSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'image_blur' && (
                <ImageBlurSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'image_pixelator' && (
                <ImagePixelatorSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'social_media_resizer' && (
                <SocialMediaResizerSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'favicon_generator' && (
                <FaviconAppIconSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'svg_optimizer' && (
                <SvgOptimizerSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'placeholder_image' && (
                <PlaceholderGeneratorSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'word_counter' && (
                <WordCounterSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'qr_code_generator' && (
                <QrCodeGeneratorSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'seo_audit' && (
                <SeoAuditSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'pdf_compressor' && (
                <PdfCompressorSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'pdf_merger' && (
                <PdfMergerSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'pdf_splitter' && (
                <PdfSplitterSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'pdf_reorder' && (
                <PdfReorderSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'pdf_converter' && (
                <PdfConverterSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'pdf_watermark' && (
                <PdfWatermarkSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'pdf_signature' && (
                <PdfSignatureSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'pdf_ocr' && (
                <PdfOcrSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'pdf_grayscale' && (
                <PdfGrayscaleSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'audio_extractor' && (
                <AudioExtractorSuite theme={theme} onNotify={addToast} />
              )}
              {activeTool === 'color_palette' && (
                <ColorPaletteSuite theme={theme} onNotify={addToast} />
              )}
            </section>
          )}
        </main>

        {/* Footer */}
        <Footer onSelectTool={setActiveTool} />
      </div>

      {/* Command Palette Quick Switcher Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectTool={setActiveTool}
      />

      {/* Profile & Account Settings Modal */}
      <ProfileSettingsModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNotify={addToast}
      />

      {/* Toast Notification Container */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
