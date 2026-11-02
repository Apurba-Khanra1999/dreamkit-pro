/**
 * Text Counter & Content Analysis Utilities
 * Comprehensive in-browser word, character, sentence, paragraph, readability, and social limit analysis.
 */

// Common English stop words for meaningful keyword density analysis
export const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t',
  'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each',
  'few', 'for', 'from', 'further',
  'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s',
  'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself',
  'let\'s',
  'me', 'more', 'most', 'mustn\'t', 'my', 'myself',
  'no', 'nor', 'not',
  'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such',
  'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up',
  'very',
  'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t',
  'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
]);

// Social Media & Platform Limits
export const PLATFORM_LIMITS = [
  { id: 'twitter_post', name: 'X / Twitter Post', limit: 280, icon: 'Twitter', recommended: 'Up to 250 chars', category: 'social' },
  { id: 'twitter_bio', name: 'X / Twitter Bio', limit: 160, icon: 'User', recommended: '120-150 chars', category: 'social' },
  { id: 'linkedin_post', name: 'LinkedIn Post', limit: 3000, icon: 'Linkedin', recommended: '1,000-2,000 chars', category: 'social' },
  { id: 'instagram_caption', name: 'Instagram Caption', limit: 2200, icon: 'Instagram', recommended: '125-150 chars (above fold)', category: 'social' },
  { id: 'instagram_bio', name: 'Instagram Bio', limit: 150, icon: 'User', recommended: 'Under 140 chars', category: 'social' },
  { id: 'tiktok_caption', name: 'TikTok Caption', limit: 2200, icon: 'Video', recommended: '100-300 chars', category: 'social' },
  { id: 'facebook_status', name: 'Facebook Status', limit: 63206, icon: 'Facebook', recommended: '40-80 chars (highest engagement)', category: 'social' },
  { id: 'youtube_title', name: 'YouTube Video Title', limit: 100, icon: 'Youtube', recommended: '60-70 chars (avoids cutoff)', category: 'video' },
  { id: 'youtube_desc', name: 'YouTube Description', limit: 5000, icon: 'FileText', recommended: 'First 150 chars key for SEO', category: 'video' },
  { id: 'pinterest_pin', name: 'Pinterest Description', limit: 500, icon: 'Pin', recommended: 'First 50 chars visible in feed', category: 'social' },
  { id: 'google_title', name: 'Google SERP Title Tag', limit: 60, icon: 'Search', recommended: '50-60 chars (~600px)', category: 'seo' },
  { id: 'google_meta', name: 'Google Meta Description', limit: 160, icon: 'Search', recommended: '150-158 chars (~960px)', category: 'seo' },
  { id: 'sms_segment', name: 'SMS (1 Segment GSM 7-bit)', limit: 160, icon: 'MessageSquare', recommended: '160 chars', category: 'messaging' },
];

/**
 * Word count with Unicode word boundaries
 */
export function countWords(text) {
  if (!text || !text.trim()) return 0;
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('en', { granularity: 'word' });
    let count = 0;
    for (const segment of segmenter.segment(text)) {
      if (segment.isWordLike) count++;
    }
    return count;
  }
  const matches = text.match(/[\p{L}\p{N}]+(?:['’_-][\p{L}\p{N}]+)*/gu);
  return matches ? matches.length : 0;
}

/**
 * Sentence count with smart abbreviation and decimal protection
 */
export function countSentences(text) {
  if (!text || !text.trim()) return 0;
  const cleaned = text
    .replace(/\b(mr|mrs|ms|dr|prof|sr|jr|vs|etc|e\.g|i\.e|u\.s|u\.s\.a|inc|ltd)\./gi, '$1_abbr_')
    .replace(/(\d+)\.(\d+)/g, '$1_dec_$2')
    .replace(/\.{3,}/g, '_ellipsis_');

  const sentences = cleaned
    .split(/(?:[.!?]+(?:\s+|$)|(?:\r?\n){2,})/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !/^['"’”)]}+$/.test(s));

  return Math.max(1, sentences.length);
}

/**
 * Paragraph count (blocks separated by empty lines or double line-breaks)
 */
export function countParagraphs(text) {
  if (!text || !text.trim()) return 0;
  const blocks = text
    .split(/(?:\r?\n\s*){2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return blocks.length > 0 ? blocks.length : 1;
}

/**
 * Estimate syllables in a single word using English phonetic rules
 */
export function countSyllablesInWord(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;

  // Suffix reduction
  const processed = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '');

  // Count contiguous vowel groups
  const matches = processed.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

/**
 * Total syllables across all words
 */
export function countTotalSyllables(text) {
  if (!text || !text.trim()) return 0;
  const words = text.match(/[\p{L}\p{N}]+(?:['’_-][\p{L}\p{N}]+)*/gu) || [];
  return words.reduce((acc, w) => acc + countSyllablesInWord(w), 0);
}

/**
 * Format duration in seconds into human-readable minutes and seconds
 */
export function formatDuration(totalSeconds) {
  if (totalSeconds < 1) return '< 1 sec';
  if (totalSeconds < 60) return `${totalSeconds} sec`;
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (secs === 0) return `${mins} min`;
  return `${mins}m ${secs}s`;
}

/**
 * Calculate comprehensive text statistics and metrics
 */
export function analyzeText(text, options = {}) {
  const {
    readingWpm = 225,
    speakingWpm = 135,
    handwritingWpm = 22,
    wordsPerPage = 250,
  } = options;

  if (!text || !text.trim()) {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      charactersGraphemes: 0,
      sentences: 0,
      paragraphs: 0,
      lines: 0,
      nonEmptyLines: 0,
      spaces: 0,
      letters: 0,
      digits: 0,
      punctuation: 0,
      specialChars: 0,
      pages: 0,
      readingTimeSec: 0,
      readingTimeString: '0 sec',
      speakingTimeSec: 0,
      speakingTimeString: '0 sec',
      handwritingTimeSec: 0,
      handwritingTimeString: '0 sec',
      uniqueWords: 0,
      lexicalDiversity: 0,
      averageWordLength: 0,
      averageSentenceLength: 0,
      longestWord: '',
      longestSentence: '',
      syllables: 0,
      complexWords: 0,
      readability: {
        fleschEase: 100,
        fleschGrade: 0,
        gunningFog: 0,
        ari: 0,
        colemanLiau: 0,
        easeLabel: 'Very Easy',
        gradeLabel: '5th Grade or Below',
        badgeColor: 'emerald'
      }
    };
  }

  // Basic Character Counts
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const charactersGraphemes = Array.from(text).length;
  const spaces = (text.match(/\s/g) || []).length;
  const letters = (text.match(/\p{L}/gu) || []).length;
  const digits = (text.match(/\p{N}/gu) || []).length;
  const punctuation = (text.match(/\p{P}/gu) || []).length;
  const specialChars = (text.match(/[\p{S}]/gu) || []).length;

  // Lines
  const lineArray = text.split(/\r?\n/);
  const lines = lineArray.length;
  const nonEmptyLines = lineArray.filter(l => l.trim().length > 0).length;

  // Words, Sentences, Paragraphs
  const words = countWords(text);
  const sentences = countSentences(text);
  const paragraphs = countParagraphs(text);

  // Time Estimations
  const readingTimeSec = words > 0 ? Math.ceil((words / readingWpm) * 60) : 0;
  const speakingTimeSec = words > 0 ? Math.ceil((words / speakingWpm) * 60) : 0;
  const handwritingTimeSec = words > 0 ? Math.ceil((words / handwritingWpm) * 60) : 0;

  const readingTimeString = formatDuration(readingTimeSec);
  const speakingTimeString = formatDuration(speakingTimeSec);
  const handwritingTimeString = formatDuration(handwritingTimeSec);

  // Pages
  const pages = words > 0 ? Number((words / wordsPerPage).toFixed(1)) : 0;

  // Words List for lexical metrics
  const wordTokens = (text.match(/[\p{L}\p{N}]+(?:['’_-][\p{L}\p{N}]+)*/gu) || []).map(w => w.toLowerCase());
  const uniqueWordsSet = new Set(wordTokens);
  const uniqueWords = uniqueWordsSet.size;
  const lexicalDiversity = words > 0 ? Number(((uniqueWords / words) * 100).toFixed(1)) : 0;

  // Average word length
  const totalLettersInWords = wordTokens.reduce((sum, w) => sum + w.length, 0);
  const averageWordLength = words > 0 ? Number((totalLettersInWords / words).toFixed(1)) : 0;

  // Average sentence length
  const averageSentenceLength = sentences > 0 ? Number((words / sentences).toFixed(1)) : 0;

  // Longest word
  let longestWord = '';
  for (const w of wordTokens) {
    if (w.length > longestWord.length) longestWord = w;
  }

  // Longest sentence
  const rawSentences = text
    .split(/(?:[.!?]+(?:\s+|$)|(?:\r?\n){2,})/)
    .map(s => s.trim())
    .filter(Boolean);

  let longestSentence = '';
  let maxSentenceWords = 0;
  for (const s of rawSentences) {
    const swCount = countWords(s);
    if (swCount > maxSentenceWords) {
      maxSentenceWords = swCount;
      longestSentence = s;
    }
  }

  // Syllables and Readability
  const syllables = countTotalSyllables(text);

  // Complex words count (words with 3 or more syllables)
  let complexWords = 0;
  for (const w of wordTokens) {
    if (countSyllablesInWord(w) >= 3) complexWords++;
  }

  // Flesch Reading Ease
  // Formula: 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
  const easeRaw = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  const fleschEase = Math.max(0, Math.min(100, Math.round(easeRaw * 10) / 10));

  // Flesch-Kincaid Grade Level
  // Formula: 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
  const gradeRaw = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  const fleschGrade = Math.max(0, Math.round(gradeRaw * 10) / 10);

  // Automated Readability Index (ARI)
  // Formula: 4.71 * (charactersNoSpaces / words) + 0.5 * (words / sentences) - 21.43
  const ariRaw = 4.71 * (charactersNoSpaces / words) + 0.5 * (words / sentences) - 21.43;
  const ari = Math.max(0, Math.round(ariRaw * 10) / 10);

  // Gunning Fog Index
  // Formula: 0.4 * ((words / sentences) + 100 * (complexWords / words))
  const fogRaw = 0.4 * ((words / sentences) + (words > 0 ? 100 * (complexWords / words) : 0));
  const gunningFog = Math.max(0, Math.round(fogRaw * 10) / 10);

  // Coleman-Liau Index
  // L = avg letters per 100 words, S = avg sentences per 100 words
  // CLI = 0.0588 * L - 0.296 * S - 15.8
  const L = words > 0 ? (letters / words) * 100 : 0;
  const S = words > 0 ? (sentences / words) * 100 : 0;
  const colemanRaw = 0.0588 * L - 0.296 * S - 15.8;
  const colemanLiau = Math.max(0, Math.round(colemanRaw * 10) / 10);

  // Readability Interpretation
  let easeLabel = 'Standard';
  let gradeLabel = '8th & 9th Grade';
  let badgeColor = 'indigo';

  if (fleschEase >= 90) {
    easeLabel = 'Very Easy';
    gradeLabel = '5th Grade (Conversational)';
    badgeColor = 'emerald';
  } else if (fleschEase >= 80) {
    easeLabel = 'Easy';
    gradeLabel = '6th Grade (Plain English)';
    badgeColor = 'emerald';
  } else if (fleschEase >= 70) {
    easeLabel = 'Fairly Easy';
    gradeLabel = '7th Grade';
    badgeColor = 'teal';
  } else if (fleschEase >= 60) {
    easeLabel = 'Standard';
    gradeLabel = '8th & 9th Grade';
    badgeColor = 'indigo';
  } else if (fleschEase >= 50) {
    easeLabel = 'Fairly Difficult';
    gradeLabel = '10th to 12th Grade (High School)';
    badgeColor = 'amber';
  } else if (fleschEase >= 30) {
    easeLabel = 'Difficult';
    gradeLabel = 'College Student';
    badgeColor = 'orange';
  } else {
    easeLabel = 'Very Difficult';
    gradeLabel = 'College Graduate / Professional';
    badgeColor = 'rose';
  }

  return {
    words,
    characters,
    charactersNoSpaces,
    charactersGraphemes,
    sentences,
    paragraphs,
    lines,
    nonEmptyLines,
    spaces,
    letters,
    digits,
    punctuation,
    specialChars,
    pages,
    readingTimeSec,
    readingTimeString,
    speakingTimeSec,
    speakingTimeString,
    handwritingTimeSec,
    handwritingTimeString,
    uniqueWords,
    lexicalDiversity,
    averageWordLength,
    averageSentenceLength,
    longestWord,
    longestSentence,
    syllables,
    complexWords,
    readability: {
      fleschEase,
      fleschGrade,
      gunningFog,
      ari,
      colemanLiau,
      easeLabel,
      gradeLabel,
      badgeColor
    }
  };
}

/**
 * Keyword frequency and density analysis
 */
export function getKeywordDensity(text, options = {}) {
  const { minLength = 2, filterStopWords = true, maxResults = 15 } = options;
  if (!text || !text.trim()) return [];

  const tokens = (text.match(/[\p{L}\p{N}]+(?:['’_-][\p{L}\p{N}]+)*/gu) || []).map(w => w.toLowerCase());
  const totalTokens = tokens.length;
  if (totalTokens === 0) return [];

  const freqMap = new Map();
  for (const token of tokens) {
    if (token.length < minLength) continue;
    if (filterStopWords && STOP_WORDS.has(token)) continue;
    if (/^\d+$/.test(token)) continue;

    freqMap.set(token, (freqMap.get(token) || 0) + 1);
  }

  const results = Array.from(freqMap.entries())
    .map(([word, count]) => ({
      word,
      count,
      density: Number(((count / totalTokens) * 100).toFixed(2))
    }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));

  return results.slice(0, maxResults);
}

/**
 * 2-Word and 3-Word Phrase (N-Gram) Density Analysis
 */
export function getPhraseDensity(text, n = 2, maxResults = 10, filterStopWords = false) {
  if (!text || !text.trim() || n < 2) return [];

  const tokens = (text.match(/[\p{L}\p{N}]+(?:['’_-][\p{L}\p{N}]+)*/gu) || []).map(w => w.toLowerCase());
  if (tokens.length < n) return [];

  const phraseMap = new Map();
  const totalPhrases = tokens.length - n + 1;

  for (let i = 0; i <= tokens.length - n; i++) {
    const slice = tokens.slice(i, i + n);
    if (filterStopWords && slice.every(w => STOP_WORDS.has(w))) continue;
    const phrase = slice.join(' ');
    phraseMap.set(phrase, (phraseMap.get(phrase) || 0) + 1);
  }

  return Array.from(phraseMap.entries())
    .filter(([, count]) => count > 1)
    .map(([phrase, count]) => ({
      phrase,
      count,
      density: Number(((count / totalPhrases) * 100).toFixed(2))
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxResults);
}

/**
 * Check social media limits
 */
export function checkSocialLimits(text) {
  const charCount = text ? text.length : 0;
  return PLATFORM_LIMITS.map(item => {
    const remaining = item.limit - charCount;
    const percent = Math.min(100, Math.round((charCount / item.limit) * 100));
    let status = 'safe';
    if (remaining < 0) {
      status = 'overflow';
    } else if (remaining <= Math.max(10, item.limit * 0.15)) {
      status = 'warning';
    }

    return {
      ...item,
      current: charCount,
      remaining,
      percent,
      status
    };
  });
}

/**
 * Text Transformation & Clean-Up Functions
 */
export function toUpper(text) {
  return text.toUpperCase();
}

export function toLower(text) {
  return text.toLowerCase();
}

export function toTitleCase(text) {
  return text.replace(/\b[\p{L}\p{N}]+/gu, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
  });
}

export function toSentenceCase(text) {
  return text
    .toLowerCase()
    .replace(/(^\s*|\.\s*|\?\s*|!\s*|\n\s*)([\p{L}])/gu, (_, prefix, char) => {
      return prefix + char.toUpperCase();
    });
}

export function toCamelCase(text) {
  return text
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^([A-Z])/, (_, chr) => chr.toLowerCase());
}

export function toPascalCase(text) {
  return text
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^([a-z])/, (_, chr) => chr.toUpperCase());
}

export function toSnakeCase(text) {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s\W-]+/g, '_')
    .toLowerCase()
    .replace(/^_+|_+$/g, '');
}

export function toKebabCase(text) {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s\W_]+/g, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '');
}

export function toConstantCase(text) {
  return toSnakeCase(text).toUpperCase();
}

export function toAlternatingCase(text) {
  return Array.from(text)
    .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
    .join('');
}

export function removeExtraSpaces(text) {
  return text
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/^[^\S\r\n]+|[^\S\r\n]+$/gm, '')
    .trim();
}

export function removeEmptyLines(text) {
  return text
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0)
    .join('\n');
}

export function removePunctuation(text) {
  return text.replace(/[\p{P}\p{S}]/gu, '');
}

export function stripHtmlTags(text) {
  return text.replace(/<\/?[^>]+(>|$)/g, '');
}

export function reverseCharacters(text) {
  return Array.from(text).reverse().join('');
}

export function reverseWords(text) {
  return text.split(/\s+/).reverse().join(' ');
}

export function sortLinesAsc(text) {
  return text.split(/\r?\n/).sort((a, b) => a.localeCompare(b)).join('\n');
}

export function sortLinesDesc(text) {
  return text.split(/\r?\n/).sort((a, b) => b.localeCompare(a)).join('\n');
}

/**
 * Curated Sample Texts
 */
export const SAMPLE_TEXTS = [
  {
    id: 'ai_overview',
    title: 'Technology & AI (Technical Essay)',
    description: 'An analytical overview of artificial intelligence, edge computing, and privacy.',
    text: `Artificial intelligence and machine learning have transitioned from theoretical laboratory pursuits into ubiquitous cornerstones of modern software engineering. High-performance client-side compute, powered by WebAssembly, WebGPU, and modern JavaScript engines, enables developers to run complex neural inference and vector mathematics directly inside user browsers.

This paradigm shift yields unprecedented advantages for data privacy. Rather than transmitting sensitive customer payloads over public networks to centralized cloud datacenters, computation occurs strictly on local edge devices. Latency drops to near-zero, bandwidth expenses diminish, and compliance with stringent data protection frameworks such as GDPR and CCPA becomes straightforward.

As generative architectures and autonomous agents continue to evolve, the demand for transparent, deterministic developer tools will only accelerate. The future of software is distributed, privacy-first, and delightfully responsive.`
  },
  {
    id: 'marketing_pitch',
    title: 'B2B Product Launch (Marketing Email)',
    description: 'High-converting sales copy with clear value propositions and call-to-action.',
    text: `Subject: Introducing DreamKit 2.0 — The Ultimate Developer Productivity Suite 🚀

Hey Alex,

Are you tired of jumping between fifteen different browser tabs just to format JSON, debug JWTs, compress images, and optimize SVGs?

Meet DreamKit: thirty-two professional developer tools in one blazing-fast, privacy-first web application.

Here is what makes DreamKit stand out:
• 100% Client-Side Execution: Your data never leaves your device. No cloud storage, zero tracking, total privacy.
• Instant Micro-Interactions: Built with zero bloat and optimized for rapid keyboard shortcuts.
• Comprehensive Toolkit: From AST-level SVG optimization to multi-resolution favicon generation and real-time regex testing.

Join over 50,000 engineers and designers who streamline their daily development workflows with DreamKit.

Claim your free lifetime developer workspace today:
👉 https://dreamkit.dev/launch

Best regards,
The DreamKit Team`
  },
  {
    id: 'social_thread',
    title: 'Viral Tech Thread (Social Media Post)',
    description: 'Bite-sized social media tips with hashtags, emojis, and engagement hooks.',
    text: `10 Web Development Tips That Will Save You 100+ Hours in 2026 🧵👇

1/ Stop sending sensitive payloads to random web converters. Use client-side browser utilities to format JSON, decode JWT tokens, and compress assets locally.

2/ Modern CSS 'subgrid' and container queries have made 80% of legacy layout hacks obsolete. Embrace native responsive primitives.

3/ Optimize your vector graphics! SVGs straight from design software often carry 60-80% useless editor metadata, unused namespaces, and redundant nested groups.

4/ Master keyboard navigation: Command Palette (Cmd + K) is your superpower.

5/ Always test your copy for readability before publishing. Clear, concise writing wins every single time.

Which workflow tip resonated most with you? Drop your thoughts below! 💬✨

#WebDev #Frontend #CodingTips #JavaScript #Productivity #DeveloperLife`
  },
  {
    id: 'classic_literature',
    title: 'Literary Excerpt (Fiction / Storytelling)',
    description: 'Rich descriptive narrative showcasing complex sentence structures and vocabulary.',
    text: `It was a crisp autumn twilight in the ancient coastal metropolis. A silver mist drifted softly over the cobalt waters of the harbor, veiling the towering silhouettes of merchant vessels as they swayed with the incoming tide.

In the quiet library atop the clocktower, candlelight flickered against leather-bound volumes and gilded parchment maps. Master Thorne adjusted his brass spectacles, carefully studying the cryptic astronomical inscriptions etched along the celestial sphere. Every star, every constellation appeared precisely calibrated to an ancient celestial rhythm that had baffled scholars for centuries.

Somewhere in the labyrinthine cobblestone alleys below, a church bell struck eight. The night had only just begun, yet within the timeless silence of the tower, centuries felt like moments.`
  }
];
