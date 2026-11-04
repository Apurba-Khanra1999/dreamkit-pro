/**
 * DreamKit Pro — Dynamic SEO & Deep Linking Helper
 * Updates document title, meta tags, OpenGraph, canonical links, and URL query params
 * dynamically as tools are navigated.
 */

import { TOOLS_REGISTRY } from '../config/toolsRegistry';

const SITE_NAME = 'DreamKit Pro';
const BASE_URL = 'https://dreamkit-pro.vercel.app';
const DEFAULT_TITLE = 'DreamKit Pro — 40+ Free Online Developer, Media & PDF Tools';
const DEFAULT_DESC =
  'DreamKit Pro is the ultimate free, all-in-one developer productivity platform. Over 40+ browser-based tools: JSON formatters, PDF suite, image studio, regex, JWT, converters & SEO tools with zero server uploads.';

/**
 * Get active tool from current browser URL query parameters (?tool=...) or hash (#...)
 */
export function getToolFromUrl() {
  if (typeof window === 'undefined') return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const queryTool = params.get('tool');
    if (queryTool) return queryTool;

    // Fallback: check hash like #/tool/formatter or #formatter
    const hash = window.location.hash.replace(/^#\/?/, '').replace(/^tool\//, '');
    if (hash) return hash;
  } catch {
    // ignore
  }

  return null;
}

/**
 * Synchronize browser URL with currently active tool
 */
export function syncUrlWithTool(toolId) {
  if (typeof window === 'undefined' || !window.history) return;

  try {
    const currentUrl = new URL(window.location.href);
    const currentToolParam = currentUrl.searchParams.get('tool');

    if (toolId === 'landing') {
      if (currentToolParam) {
        currentUrl.searchParams.delete('tool');
        window.history.replaceState({ tool: 'landing' }, '', currentUrl.pathname + (currentUrl.search || ''));
      }
    } else {
      if (currentToolParam !== toolId) {
        currentUrl.searchParams.set('tool', toolId);
        window.history.replaceState({ tool: toolId }, '', currentUrl.pathname + '?' + currentUrl.searchParams.toString());
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Update document title and all relevant SEO meta tags dynamically
 */
export function updateDocumentSeo(toolId) {
  if (typeof document === 'undefined') return;

  let title = DEFAULT_TITLE;
  let description = DEFAULT_DESC;
  let canonicalUrl = BASE_URL + '/';

  if (toolId && toolId !== 'landing') {
    const tool = TOOLS_REGISTRY.find((t) => t.id === toolId);
    if (tool) {
      title = `${tool.title} — ${SITE_NAME}`;
      description = tool.description || DEFAULT_DESC;
      canonicalUrl = `${BASE_URL}/?tool=${tool.id}`;
    } else if (toolId === 'login') {
      title = `Sign In / Register — ${SITE_NAME}`;
      description = 'Sign in or register for DreamKit Pro developer cloud sync and preferences.';
      canonicalUrl = `${BASE_URL}/?tool=login`;
    } else if (toolId === 'dashboard') {
      title = `Developer Dashboard Overview — ${SITE_NAME}`;
      description = 'Quick access launcher, system statistics, and developer productivity directory.';
      canonicalUrl = `${BASE_URL}/?tool=dashboard`;
    }
  }

  // 1. Update Document Title
  document.title = title;

  // 2. Helper to set meta attribute
  const setMeta = (selector, attr, value) => {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      if (selector.startsWith('meta[name=')) {
        const name = selector.match(/meta\[name="([^"]+)"\]/)?.[1];
        if (name) el.setAttribute('name', name);
      } else if (selector.startsWith('meta[property=')) {
        const prop = selector.match(/meta\[property="([^"]+)"\]/)?.[1];
        if (prop) el.setAttribute('property', prop);
      }
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  };

  // 3. Update Standard Meta Tags
  setMeta('meta[name="title"]', 'content', title);
  setMeta('meta[name="description"]', 'content', description);

  // 4. Update OpenGraph Tags
  setMeta('meta[property="og:title"]', 'content', title);
  setMeta('meta[property="og:description"]', 'content', description);
  setMeta('meta[property="og:url"]', 'content', canonicalUrl);

  // 5. Update Twitter Tags
  setMeta('meta[name="twitter:title"]', 'content', title);
  setMeta('meta[name="twitter:description"]', 'content', description);
  setMeta('meta[name="twitter:url"]', 'content', canonicalUrl);

  // 6. Update Canonical Link
  let canonicalEl = document.querySelector('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', canonicalUrl);
}
