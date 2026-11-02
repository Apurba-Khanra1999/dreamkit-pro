/**
 * Professional, Theme-Aware Lorem Ipsum Generation Engine
 * Supports Classic Latin (Cicero), Modern Tech, Hipster, Pirate, and Corporate Jargon vocabularies.
 */

export const LOREM_FLAVORS = [
  {
    id: 'classic',
    name: 'Classic Latin',
    description: 'Canonical Cicero de Finibus Bonorum et Malorum placeholder text.',
    starter: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
  },
  {
    id: 'tech',
    name: 'Tech & Cloud',
    description: 'Modern developer buzzwords, cloud infrastructure, AI, and microservices.',
    starter: 'Serverless microservices orchestrate distributed kubernetes clusters with zero-trust observability at the edge.'
  },
  {
    id: 'hipster',
    name: 'Hipster & Artisanal',
    description: 'Pour-over coffee, beard oil, cold-pressed kombucha, and vinyl records.',
    starter: 'Artisanal pour-over kombucha microdosing cold-pressed beard oil across reclaimed raw denim fixies.'
  },
  {
    id: 'pirate',
    name: 'Pirate & Buccaneer',
    description: 'Swashbuckling sea shanties, doubloons, Davy Jones, and black powder.',
    starter: 'Ahoy matey, hoist the skull and crossbones, batten down the hatches, and sail across Davy Jones locker.'
  },
  {
    id: 'corporate',
    name: 'Corporate & Executive',
    description: 'Synergistic deliverables, holistic paradigms, bandwidth, and agile velocity.',
    starter: 'Synergize scalable deliverables to leverage core competencies and disrupt holistic enterprise paradigms.'
  }
];

// Curated vocabulary dictionaries
const VOCABULARY = {
  classic: [
    'ad', 'adipiscing', 'aliqua', 'aliquam', 'aliquet', 'amet', 'ante', 'arcu', 'at', 'auctor',
    'augue', 'bibendum', 'blandit', 'commodo', 'condimentum', 'congue', 'consectetur', 'consequat',
    'convallis', 'cras', 'cubilia', 'curabitur', 'cursus', 'dapibus', 'diam', 'dictum', 'dignissim',
    'dolor', 'dolore', 'donec', 'dui', 'duis', 'efficitur', 'eget', 'eleifend', 'elementum', 'elit',
    'enim', 'erat', 'eros', 'est', 'et', 'etiam', 'eu', 'euismod', 'facilisi', 'facilisis', 'fames',
    'faucibus', 'felis', 'fermentum', 'feugiat', 'fringilla', 'fusce', 'gravida', 'habitant', 'hendrerit',
    'iaculis', 'id', 'imperdiet', 'in', 'inceptos', 'integer', 'interdum', 'ipsum', 'justo', 'lacinia',
    'lacus', 'laoreet', 'lectus', 'leo', 'libero', 'ligula', 'lobortis', 'lorem', 'luctus', 'maecenas',
    'magna', 'malesuada', 'massa', 'mattis', 'mauris', 'metus', 'mi', 'molestie', 'mollis', 'morbi',
    'nam', 'nec', 'neque', 'netus', 'nibh', 'nisi', 'nisl', 'non', 'nostra', 'nulla', 'nullam', 'nunc',
    'odio', 'orci', 'ornare', 'pellentesque', 'pharetra', 'phasellus', 'placerat', 'porta', 'porttitor',
    'posuere', 'potenti', 'praesent', 'pretium', 'proin', 'pulvinar', 'purus', 'quam', 'quis', 'quisque',
    'rhoncus', 'risus', 'rutrum', 'sagittis', 'sapien', 'scelerisque', 'sed', 'sem', 'semper', 'senectus',
    'sit', 'sociis', 'sodales', 'sollicitudin', 'suscipit', 'suspendisse', 'taciti', 'tellus', 'tempor',
    'tempus', 'tincidunt', 'torquent', 'tortor', 'tristique', 'turpis', 'ullamcorper', 'ultrices',
    'ultricies', 'urna', 'ut', 'varius', 'vehicula', 'vel', 'velit', 'venenatis', 'vestibulum', 'vitae',
    'vivamus', 'viverra', 'volutpat', 'vulputate'
  ],
  tech: [
    'kubernetes', 'docker', 'microservices', 'serverless', 'lambda', 'graphql', 'rest', 'websocket',
    'redis', 'postgres', 'kafka', 'event-driven', 'telemetry', 'observability', 'prometheus', 'grafana',
    'zero-trust', 'encryption', 'neural-network', 'transformer', 'machine-learning', 'inference', 'latency',
    'throughput', 'concurrency', 'asynchronous', 'promises', 'event-loop', 'garbage-collection', 'compiler',
    'bytecode', 'webassembly', 'v8-engine', 'monorepo', 'ci-cd', 'pipeline', 'deployment', 'canary',
    'blue-green', 'failover', 'high-availability', 'idempotent', 'distributed', 'consensus', 'raft',
    'blockchain', 'cryptographic', 'oauth2', 'jwt', 'payload', 'middleware', 'gateway', 'load-balancer',
    'reverse-proxy', 'ingress', 'service-mesh', 'istio', 'envoy', 'sharding', 'replica-set', 'mutation',
    'indexing', 'partition', 'caching', 'cdn', 'edge-computing', 'typescript', 'rust', 'golang', 'python',
    'react', 'vite', 'tailwind', 'monad', 'functor', 'immutable', 'state-machine', 'resilience', 'circuit-breaker'
  ],
  hipster: [
    'artisanal', 'kombucha', 'cold-brew', 'pour-over', 'aeropress', 'single-origin', 'farm-to-table',
    'organic', 'bespoke', 'selvage-denim', 'beard-oil', 'tote-bag', 'vinyl-records', 'cassette-tape',
    'polaroid', 'typewriter', 'succulents', 'monstera', 'crucifix-choker', 'normcore', 'vaporwave',
    'thrift-store', 'upcycled', 'ironic', 'mustache', 'flannel', 'microdosing', 'matcha', 'sourdough',
    'fermented', 'kimchi', 'avocado-toast', 'gluten-free', 'vegan', 'biodynamic', 'ethical', 'sustainable',
    'foraged', 'heirloom', 'portland', 'brooklyn', 'shoreditch', 'cruiser-bike', 'fixie', 'raw-denim',
    'locavore', 'slow-carb', 'charcoal-latte', 'chambray', 'distillery', 'botanical', 'craft-beer'
  ],
  pirate: [
    'ahoy', 'matey', 'avast', 'aye', 'scurvy', 'buccaneer', 'galleon', 'frigate', 'corsair', 'swashbuckler',
    'doubloons', 'pieces-of-eight', 'booty', 'treasure-chest', 'plunder', 'cutlass', 'musket', 'blunderbuss',
    'broadside', 'cannonball', 'black-powder', 'jolly-roger', 'skull-and-crossbones', 'crow-nest', 'mainmast',
    'starboard', 'portside', 'scuttle', 'keelhaul', 'walk-the-plank', 'davy-jones', 'locker', 'kraken',
    'sea-serpent', 'rum', 'grog', 'hard-tack', 'peg-leg', 'eye-patch', 'hook-hand', 'parrot', 'quartermaster',
    'first-mate', 'captain', 'marooned', 'mutiny', 'high-seas', 'caribbean', 'tortuga', 'anchors-aweigh',
    'weigh-anchor', 'shiver-me-timbers', 'dead-men-tell-no-tales', 'yo-ho-ho', 'compass', 'spyglass'
  ],
  corporate: [
    'synergize', 'leverage', 'bandwidth', 'deliverables', 'paradigm-shift', 'core-competency', 'deep-dive',
    'touch-base', 'circle-back', 'offline', 'table-this', 'low-hanging-fruit', 'actionable-insights',
    'key-performance-indicators', 'okrs', 'roi', 'value-proposition', 'market-penetration', 'scalability',
    'stakeholder-buy-in', 'holistic-approach', 'pivot', 'disrupt', 'game-changer', 'bleeding-edge',
    'mission-critical', 'cross-functional', 'swimlanes', 'elevator-pitch', 'pipeline', 'funnel-conversion',
    'customer-centric', 'frictionless-onboarding', 'best-of-breed', 'run-rate', 'burn-rate', 'runway',
    'venture-capital', 'enterprise-grade', 'c-suite', 'thought-leadership', 'agile-velocity', 'scrum-ceremonies',
    'sprint-backlog', 'standup', 'retrospective', 'north-star-metric', 'flywheel-effect', 'omnichannel'
  ]
};

// Helper: Pick pseudo-random element
function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper: Capitalize string
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper: Convert string to Title Case
function toTitleCase(str) {
  return str
    .split(' ')
    .map(word => {
      const lower = word.toLowerCase();
      // Minor words lowercase unless first
      const minor = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet'];
      return minor.includes(lower) ? lower : capitalize(lower);
    })
    .join(' ');
}

/**
 * Generates an organic sentence with variable length and natural commas.
 */
function createSentence(wordPool, minWords = 8, maxWords = 16) {
  const length = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
  const words = [];

  for (let i = 0; i < length; i++) {
    words.push(pickRandom(wordPool));
  }

  // Capitalize first word
  words[0] = capitalize(words[0]);

  // Insert a comma in longer sentences (if length >= 12)
  if (length >= 12 && Math.random() > 0.4) {
    const commaIndex = Math.floor(length / 2) + Math.floor(Math.random() * 3) - 1;
    if (commaIndex > 1 && commaIndex < length - 2) {
      words[commaIndex] = words[commaIndex] + ',';
    }
  }

  // Random end punctuation: mostly period, rarely exclamation or question mark
  const r = Math.random();
  const endChar = r > 0.96 ? '?' : r > 0.92 ? '!' : '.';

  return words.join(' ') + endChar;
}

/**
 * Generates an organic paragraph (3 to 6 sentences).
 */
function createParagraph(wordPool, minSentences = 3, maxSentences = 6) {
  const sentenceCount = Math.floor(Math.random() * (maxSentences - minSentences + 1)) + minSentences;
  const sentences = [];

  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(createSentence(wordPool));
  }

  return sentences.join(' ');
}

/**
 * Main Generator Function
 * @param {Object} options Configuration parameters
 */
export function generateLoremIpsum({
  unit = 'paragraphs', // 'paragraphs' | 'sentences' | 'words' | 'characters' | 'lists' | 'headings'
  count = 5,
  flavor = 'classic',
  startWithLorem = true,
  format = 'plain', // 'plain' | 'html' | 'markdown' | 'json'
  htmlTag = 'p' // 'p' | 'div' | 'blockquote'
}) {
  const pool = VOCABULARY[flavor] || VOCABULARY.classic;
  const flavorConfig = LOREM_FLAVORS.find(f => f.id === flavor) || LOREM_FLAVORS[0];
  const safeCount = Math.max(1, Math.min(count, 5000));

  let rawItems = [];

  switch (unit) {
    case 'words': {
      const words = [];
      if (startWithLorem && flavor === 'classic') {
        const canonical = ['Lorem', 'ipsum', 'dolor', 'sit', 'amet,', 'consectetur', 'adipiscing', 'elit,'];
        for (let i = 0; i < Math.min(safeCount, canonical.length); i++) {
          words.push(canonical[i].replace(',', ''));
        }
      }

      while (words.length < safeCount) {
        words.push(pickRandom(pool));
      }

      // Capitalize first word
      if (words.length > 0) {
        words[0] = capitalize(words[0]);
      }

      rawItems = [words.join(' ')];
      break;
    }

    case 'sentences': {
      for (let i = 0; i < safeCount; i++) {
        if (i === 0 && startWithLorem) {
          rawItems.push(flavorConfig.starter);
        } else {
          rawItems.push(createSentence(pool));
        }
      }
      break;
    }

    case 'headings': {
      for (let i = 0; i < safeCount; i++) {
        const wordCount = Math.floor(Math.random() * 5) + 3; // 3 to 7 words
        const words = [];
        for (let j = 0; j < wordCount; j++) {
          words.push(pickRandom(pool));
        }
        rawItems.push(toTitleCase(capitalize(words.join(' '))));
      }
      break;
    }

    case 'lists': {
      for (let i = 0; i < safeCount; i++) {
        const length = Math.floor(Math.random() * 7) + 5; // 5 to 11 words
        const words = [];
        for (let j = 0; j < length; j++) {
          words.push(pickRandom(pool));
        }
        words[0] = capitalize(words[0]);
        rawItems.push(words.join(' '));
      }
      break;
    }

    case 'characters': {
      // Build text until count is reached
      let text = '';
      if (startWithLorem && flavor === 'classic') {
        text = flavorConfig.starter;
      }

      while (text.length < safeCount) {
        text += (text.length > 0 ? ' ' : '') + createParagraph(pool);
      }

      // Slice precisely to requested length
      let sliced = text.slice(0, safeCount);
      // Ensure sentence ends cleanly without exceeding safeCount limit
      if (safeCount > 5 && !/[.!?]$/.test(sliced)) {
        sliced = sliced.slice(0, safeCount - 1).replace(/[,;:\s]+$/, '') + '.';
      }

      rawItems = [sliced];
      break;
    }

    case 'paragraphs':
    default: {
      for (let i = 0; i < safeCount; i++) {
        if (i === 0 && startWithLorem) {
          const starterSentence = flavorConfig.starter;
          const additionalSentences = [];
          const extraCount = Math.floor(Math.random() * 3) + 2; // 2 to 4 extra sentences
          for (let s = 0; s < extraCount; s++) {
            additionalSentences.push(createSentence(pool));
          }
          rawItems.push(starterSentence + ' ' + additionalSentences.join(' '));
        } else {
          rawItems.push(createParagraph(pool));
        }
      }
      break;
    }
  }

  // Format into requested syntax representation
  return formatGeneratedOutput(rawItems, unit, format, htmlTag);
}

/**
 * Formats array of generated strings into target output format.
 */
function formatGeneratedOutput(items, unit, format, htmlTag = 'p') {
  if (!items || !items.length) return '';

  switch (format) {
    case 'json':
      return JSON.stringify(items, null, 2);

    case 'html': {
      if (unit === 'lists') {
        const listItems = items.map(it => `  <li>${it}</li>`).join('\n');
        return `<ul>\n${listItems}\n</ul>`;
      }
      if (unit === 'headings') {
        return items.map((it, idx) => `<h${(idx % 3) + 2}>${it}</h${(idx % 3) + 2}>`).join('\n');
      }
      const tag = htmlTag || 'p';
      return items.map(it => `<${tag}>${it}</${tag}>`).join('\n\n');
    }

    case 'markdown': {
      if (unit === 'lists') {
        return items.map(it => `- ${it}`).join('\n');
      }
      if (unit === 'headings') {
        return items.map((it, idx) => `${'#'.repeat((idx % 3) + 2)} ${it}`).join('\n\n');
      }
      return items.join('\n\n');
    }

    case 'plain':
    default: {
      if (unit === 'lists') {
        return items.map(it => `• ${it}`).join('\n');
      }
      return items.join('\n\n');
    }
  }
}

/**
 * Calculates real-time text metrics: words, characters, sentences, paragraphs, and reading times.
 */
export function calculateTextMetrics(text) {
  if (!text || !text.trim()) {
    return {
      wordCount: 0,
      charCount: 0,
      charNoSpaces: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      readingTime: '0 sec',
      speakingTime: '0 sec'
    };
  }

  // Strip HTML tags for accurate metrics calculation
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/[#*\-•]/g, ' ').trim();
  const words = clean ? clean.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const charCount = text.length;
  const charNoSpaces = text.replace(/\s/g, '').length;

  // Sentences count based on terminal punctuation (. ! ?)
  const sentences = clean.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;

  // Paragraphs count based on double newlines or HTML paragraph tags
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paragraphCount = Math.max(1, paragraphs.length);

  // Reading time (average 200 words per minute)
  const readMinutes = wordCount / 200;
  const readingTime = readMinutes < 1
    ? `${Math.max(1, Math.round(readMinutes * 60))} sec`
    : `${readMinutes.toFixed(1)} min`;

  // Speaking time (average 130 words per minute)
  const speakMinutes = wordCount / 130;
  const speakingTime = speakMinutes < 1
    ? `${Math.max(1, Math.round(speakMinutes * 60))} sec`
    : `${speakMinutes.toFixed(1)} min`;

  return {
    wordCount,
    charCount,
    charNoSpaces,
    sentenceCount,
    paragraphCount,
    readingTime,
    speakingTime
  };
}

/**
 * Quick generation presets for common developer and designer workflows.
 */
export const LOREM_PRESETS = [
  {
    label: 'Hero Title',
    unit: 'headings',
    count: 1,
    format: 'plain',
    description: 'Punchy 4–6 word headline'
  },
  {
    label: 'Card Excerpt',
    unit: 'words',
    count: 25,
    format: 'plain',
    description: 'Compact 25-word summary'
  },
  {
    label: 'Tweet / SMS',
    unit: 'characters',
    count: 280,
    format: 'plain',
    description: 'Exact 280-character limit'
  },
  {
    label: 'Article (3 Paragraphs)',
    unit: 'paragraphs',
    count: 3,
    format: 'plain',
    description: 'Standard multi-paragraph body'
  },
  {
    label: 'Long Post (5 Paragraphs)',
    unit: 'paragraphs',
    count: 5,
    format: 'plain',
    description: 'Extended article layout'
  },
  {
    label: 'Feature Checklist',
    unit: 'lists',
    count: 5,
    format: 'plain',
    description: '5 bulleted list items'
  },
  {
    label: 'HTML Content Block',
    unit: 'paragraphs',
    count: 3,
    format: 'html',
    description: 'Wrapped in <p>...</p> tags'
  },
  {
    label: 'JSON Mock Array',
    unit: 'paragraphs',
    count: 4,
    format: 'json',
    description: 'Array of strings for API mocks'
  }
];
