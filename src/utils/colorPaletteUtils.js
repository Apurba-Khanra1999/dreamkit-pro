/**
 * Color Palette Generator Utilities
 * Pure client-side color science, harmony generation, WCAG contrast accessibility,
 * color naming, shades & tints ladder, image extraction, and multi-format exporters.
 */

export const PALETTES_STORAGE_KEY = 'dreamkit_color_palettes_saved';

/**
 * Curated Named Colors Dictionary for Nearest Color Search
 */
export const NAMED_COLORS = [
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Snow White', hex: '#FFFAFA' },
  { name: 'Ghost White', hex: '#F8F8FF' },
  { name: 'Pure Black', hex: '#000000' },
  { name: 'Slate 900', hex: '#0F172A' },
  { name: 'Charcoal', hex: '#1E293B' },
  { name: 'Dark Slate', hex: '#334155' },
  { name: 'Cool Gray', hex: '#64748B' },
  { name: 'Silver Gray', hex: '#94A3B8' },
  { name: 'Light Slate', hex: '#CBD5E1' },
  { name: 'Soft Gray', hex: '#E2E8F0' },
  { name: 'Off White', hex: '#F1F5F9' },
  { name: 'Crimson', hex: '#DC2626' },
  { name: 'Rose Red', hex: '#E11D48' },
  { name: 'Ruby', hex: '#BE123C' },
  { name: 'Scarlet', hex: '#FF2400' },
  { name: 'Coral Red', hex: '#F43F5E' },
  { name: 'Blush Pink', hex: '#FB7185' },
  { name: 'Pastel Pink', hex: '#FDA4AF' },
  { name: 'Sunset Orange', hex: '#EA580C' },
  { name: 'Burnt Orange', hex: '#C2410C' },
  { name: 'Tangerine', hex: '#F97316' },
  { name: 'Coral', hex: '#FB923C' },
  { name: 'Peach', hex: '#FDBA74' },
  { name: 'Amber Gold', hex: '#D97706' },
  { name: 'Warm Amber', hex: '#B45309' },
  { name: 'Marigold', hex: '#F59E0B' },
  { name: 'Honey Yellow', hex: '#FBBF24' },
  { name: 'Lemon Yellow', hex: '#FDE047' },
  { name: 'Cyber Yellow', hex: '#EAB308' },
  { name: 'Lime Green', hex: '#84CC16' },
  { name: 'Olive Green', hex: '#65A30D' },
  { name: 'Chartreuse', hex: '#A3E635' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Forest Green', hex: '#047857' },
  { name: 'Pine Green', hex: '#064E3B' },
  { name: 'Mint Green', hex: '#34D399' },
  { name: 'Seafoam', hex: '#6EE7B7' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Dark Teal', hex: '#0F766E' },
  { name: 'Deep Aqua', hex: '#115E59' },
  { name: 'Turquoise', hex: '#2DD4BF' },
  { name: 'Aquamarine', hex: '#5EEAD4' },
  { name: 'Cyan Blue', hex: '#06B6D4' },
  { name: 'Electric Cyan', hex: '#00F0FF' },
  { name: 'Sky Blue', hex: '#0EA5E9' },
  { name: 'Ocean Blue', hex: '#0284C7' },
  { name: 'Baby Blue', hex: '#38BDF8' },
  { name: 'Cobalt Blue', hex: '#2563EB' },
  { name: 'Royal Blue', hex: '#1D4ED8' },
  { name: 'Midnight Blue', hex: '#1E3A8A' },
  { name: 'Indigo', hex: '#4F46E5' },
  { name: 'Electric Indigo', hex: '#4338CA' },
  { name: 'Deep Indigo', hex: '#312E81' },
  { name: 'Periwinkle', hex: '#818CF8' },
  { name: 'Violet', hex: '#7C3AED' },
  { name: 'Deep Purple', hex: '#6D28D9' },
  { name: 'Electric Violet', hex: '#8B5CF6' },
  { name: 'Lavender', hex: '#A78BFA' },
  { name: 'Lilac', hex: '#C4B5FD' },
  { name: 'Fuchsia', hex: '#C026D3' },
  { name: 'Magenta', hex: '#D946EF' },
  { name: 'Hot Pink', hex: '#E879F9' },
  { name: 'Orchid', hex: '#F0ABFC' },
  { name: 'Espresso', hex: '#3E2723' },
  { name: 'Warm Chocolate', hex: '#5D4037' },
  { name: 'Mocha', hex: '#795548' },
  { name: 'Caramel', hex: '#A1887F' },
  { name: 'Latte', hex: '#D7CCC8' },
  { name: 'Cyber Neon Green', hex: '#39FF14' },
  { name: 'Cyber Neon Pink', hex: '#FF007F' }
];

/**
 * Preset Palette Categories for Interactive Filtering
 */
export const PRESET_CATEGORIES = [
  { id: 'all', label: 'All Combinations' },
  { id: 'ui_dark', label: 'UI & Dark Themes' },
  { id: 'neon_vibrant', label: 'Neon & Cyberpunk' },
  { id: 'nature_earth', label: 'Nature & Earth' },
  { id: 'pastels_minimal', label: 'Pastel & Minimal' },
  { id: 'warm_cozy', label: 'Warm & Cozy' },
  { id: 'brand_luxury', label: 'Brand & Luxury' }
];

/**
 * 36 Curated Designer Palettes with Category Metadata
 */
export const CURATED_PALETTES = [
  // --- Category: UI & Dark Themes ---
  {
    id: 'nord',
    name: 'Nordic Frost',
    category: 'ui_dark',
    description: 'An arctic, north-bluish clean palette inspired by polar landscapes.',
    colors: ['#2E3440', '#3B4252', '#4C566A', '#88C0D0', '#81A1C1', '#5E81AC']
  },
  {
    id: 'dracula',
    name: 'Dracula Dark',
    category: 'ui_dark',
    description: 'The iconic high-contrast dark theme for night-owl developers.',
    colors: ['#282A36', '#44475A', '#6272A4', '#BD93F9', '#FF79C6', '#50FA7B']
  },
  {
    id: 'monokai_pro',
    name: 'Monokai Pro',
    category: 'ui_dark',
    description: 'Classic code syntax palette with punchy warm and cool accents.',
    colors: ['#2D2A2E', '#FC9867', '#FFD866', '#A9DC76', '#78DCE8', '#AB9DF2']
  },
  {
    id: 'catppuccin_mocha',
    name: 'Catppuccin Mocha',
    category: 'ui_dark',
    description: 'Soothing pastel-infused dark theme loved by Linux and terminal users.',
    colors: ['#1E1E2E', '#313244', '#89B4FA', '#F5C2E7', '#A6E3A1', '#F9E2AF']
  },
  {
    id: 'tokyo_night',
    name: 'Tokyo Night',
    category: 'ui_dark',
    description: 'Deep midnight blue with luminous neon lavender and cyan reflections.',
    colors: ['#1A1B26', '#24283B', '#7AA2F7', '#BB9AF7', '#7DCFFF', '#9ECE6A']
  },
  {
    id: 'one_dark_pro',
    name: 'One Dark Pro',
    category: 'ui_dark',
    description: 'Atom and VS Code standard dark syntax palette with balanced hues.',
    colors: ['#282C34', '#3E4451', '#61AFEF', '#C678DD', '#98C379', '#E5C07B']
  },
  {
    id: 'github_dark',
    name: 'GitHub Dimmed',
    category: 'ui_dark',
    description: 'GitHub official dark theme with clean slate and vibrant state tags.',
    colors: ['#1C2128', '#2D333B', '#539BF5', '#57AB5A', '#F47067', '#C69026']
  },
  {
    id: 'synthwave_84',
    name: "Synthwave '84",
    category: 'ui_dark',
    description: 'Outrun retro neon with glowing magenta, cyan, and laser grid vibes.',
    colors: ['#262335', '#2A2139', '#FF7EDB', '#36F9F6', '#FE4450', '#72F1B8']
  },

  // --- Category: Neon & Cyberpunk ---
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    category: 'neon_vibrant',
    description: 'Futuristic high-energy neon colors against deep electric night.',
    colors: ['#0D0221', '#0F084B', '#26408B', '#A6CFE2', '#FF007F', '#00F0FF']
  },
  {
    id: 'miami_vice',
    name: 'Miami Vice 80s',
    category: 'neon_vibrant',
    description: 'Sun-drenched palm trees, retro sports cars, hot pink, and teal.',
    colors: ['#0E0F19', '#1F2232', '#FF2A85', '#00F5D4', '#7B2CBF', '#FEE440']
  },
  {
    id: 'electric_aurora',
    name: 'Electric Aurora',
    category: 'neon_vibrant',
    description: 'Striking northern lights dancing across deep black sub-zero skies.',
    colors: ['#0B0C10', '#1F2833', '#45A29E', '#66FCF1', '#C5C6C7', '#FF0055']
  },
  {
    id: 'acid_lime',
    name: 'Acid Lime & Violet',
    category: 'neon_vibrant',
    description: 'Ultra-contemporary rave palette mixing punchy chartreuse and deep purple.',
    colors: ['#121212', '#1F1B24', '#CCFF00', '#7B2CBF', '#9D4EDD', '#00F5FF']
  },
  {
    id: 'solar_flare',
    name: 'Solar Flare',
    category: 'neon_vibrant',
    description: 'Energetic radioactive plasma explosions radiating cosmic brilliance.',
    colors: ['#1A0000', '#4A0E17', '#FF3366', '#FF6B35', '#F7C59F', '#EFEFD0']
  },
  {
    id: 'hyperpop',
    name: 'Hyperpop Bubblegum',
    category: 'neon_vibrant',
    description: 'Maximalist internet culture explosion of candy, cobalt, and hot coral.',
    colors: ['#1B1464', '#0652DD', '#FF3838', '#FF9FF3', '#54A0FF', '#1DD1A1']
  },

  // --- Category: Nature & Earth ---
  {
    id: 'forest',
    name: 'Forest Sanctuary',
    category: 'nature_earth',
    description: 'Calming organic pine, deep moss, and lush foliage greens.',
    colors: ['#1B4332', '#2D6A4F', '#40916C', '#52B788', '#74C69D', '#D8F3DC']
  },
  {
    id: 'botanical_moss',
    name: 'Botanical Moss',
    category: 'nature_earth',
    description: 'Earthy terrarium olive, golden ochre, and warm cream textures.',
    colors: ['#283618', '#606C38', '#DDA15E', '#BC6C25', '#FEFAE0', '#2B2D42']
  },
  {
    id: 'deep_ocean',
    name: 'Mariana Trench',
    category: 'nature_earth',
    description: 'From bottomless oceanic depths to crystalline Caribbean teal.',
    colors: ['#03045E', '#023E8A', '#0077B6', '#0096C7', '#00B4D8', '#90E0EF']
  },
  {
    id: 'desert_dune',
    name: 'Desert Mirage',
    category: 'nature_earth',
    description: 'Sunbaked sandstone canyon cliffs, warm terracotta, and sage oasis.',
    colors: ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51', '#F3ECE2']
  },
  {
    id: 'coral_reef',
    name: 'Coral Lagoon',
    category: 'nature_earth',
    description: 'Vibrant tropical living coral reef surrounded by aquamarine currents.',
    colors: ['#1D3557', '#457B9D', '#A8DADC', '#F1FAEE', '#E63946', '#FFA69E']
  },
  {
    id: 'autumn_harvest',
    name: 'Autumn Harvest',
    category: 'nature_earth',
    description: 'Crisp October maple leaves, roasted chestnuts, and spiced cider.',
    colors: ['#3D0C11', '#6B1D2F', '#B23A48', '#E06D53', '#F9B282', '#FED9B7']
  },

  // --- Category: Pastel & Minimal ---
  {
    id: 'pastel_dream',
    name: 'Pastel Confectionery',
    category: 'pastels_minimal',
    description: 'Gentle, soothing candy confectionery tones with low saturation.',
    colors: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#D7BAFF']
  },
  {
    id: 'minimal_slate',
    name: 'Minimal Slate UI',
    category: 'pastels_minimal',
    description: 'Neutral modern UI design system palette with pristine hierarchy.',
    colors: ['#0F172A', '#1E293B', '#334155', '#64748B', '#94A3B8', '#F8FAFC']
  },
  {
    id: 'cotton_candy',
    name: 'Cotton Candy Clouds',
    category: 'pastels_minimal',
    description: 'Dreamy carnival fairy floss with soft baby blue and blush hues.',
    colors: ['#2B2D42', '#8D99AE', '#EDF2F4', '#FFCAD4', '#B5E2FA', '#C5A3FF']
  },
  {
    id: 'mint_macaron',
    name: 'Mint Macaron',
    category: 'pastels_minimal',
    description: 'Refreshing French patisserie pistachio and crisp garden spearmint.',
    colors: ['#D8F3DC', '#B7E4C7', '#95D5B2', '#74C69D', '#52B788', '#2D6A4F']
  },
  {
    id: 'lavender_haze',
    name: 'Lavender Haze',
    category: 'pastels_minimal',
    description: 'Intimate twilight botanical mist with delicate mauve undertones.',
    colors: ['#231942', '#5E548E', '#9F86C0', '#BE95C4', '#E0B1CB', '#FBF5F8']
  },
  {
    id: 'paper_ink',
    name: 'Editorial Monochrome',
    category: 'pastels_minimal',
    description: 'Classic luxury print publishing palette of newsprint and carbon ink.',
    colors: ['#111111', '#333333', '#666666', '#999999', '#E6E6E6', '#FBFBF9']
  },

  // --- Category: Warm & Cozy ---
  {
    id: 'coffee_cream',
    name: 'Artisan Roast',
    category: 'warm_cozy',
    description: 'Cozy artisan roast coffee, rich caramel, and steamed milk warmth.',
    colors: ['#2C1B18', '#4A2E2B', '#774936', '#A26744', '#C89666', '#EDC9AF']
  },
  {
    id: 'sunset',
    name: 'Velvet Sunset',
    category: 'warm_cozy',
    description: 'Warm dusk twilight gradient from deep berry to golden sun.',
    colors: ['#2B0938', '#5F134B', '#941B4B', '#C63D32', '#E8702A', '#F5A623']
  },
  {
    id: 'tuscan_vineyard',
    name: 'Tuscan Vineyard',
    category: 'warm_cozy',
    description: 'Sun-ripened Chianti grapes, aged oak casks, and terracotta stone.',
    colors: ['#240046', '#3C096C', '#5A189A', '#7B2CBF', '#E0A96D', '#F8EDEB']
  },
  {
    id: 'amber_hearth',
    name: 'Amber Fireside',
    category: 'warm_cozy',
    description: 'Cracking pine embers and glowing amber flames on a winter night.',
    colors: ['#210904', '#421208', '#78290F', '#FF7D00', '#FFB703', '#FFF3B0']
  },
  {
    id: 'spiced_chai',
    name: 'Spiced Chai & Vanilla',
    category: 'warm_cozy',
    description: 'Cinnamon sticks, crushed cardamom pods, and creamy frothy foam.',
    colors: ['#2B1E16', '#593D2C', '#8C5E3C', '#BF8958', '#E5C39E', '#F7EDE2']
  },
  {
    id: 'terracotta_warmth',
    name: 'Terracotta Pottery',
    category: 'warm_cozy',
    description: 'Handcrafted Mediterranean ceramic pottery warmed under the sun.',
    colors: ['#3C1518', '#69140E', '#A44200', '#D58936', '#F2C57C', '#F7F4EA']
  },

  // --- Category: Brand & Luxury ---
  {
    id: 'royal_indigo',
    name: 'Royal Sovereign',
    category: 'brand_luxury',
    description: 'Majestic deep indigo velvet and electric imperial purple authority.',
    colors: ['#0B091A', '#1A163B', '#4338CA', '#6366F1', '#A5B4FC', '#E0E7FF']
  },
  {
    id: 'emerald_gold',
    name: 'Imperial Emerald & Gold',
    category: 'brand_luxury',
    description: 'Precious gemstone green paired with lustrous 24-karat gold leaf.',
    colors: ['#06281E', '#0D4A38', '#10B981', '#D4AF37', '#F5D77F', '#FBF8EE']
  },
  {
    id: 'rose_gold_luxe',
    name: 'Rose Gold Haute',
    category: 'brand_luxury',
    description: 'Opulent high-fashion champagne blush, velvet plum, and rose metals.',
    colors: ['#1C1417', '#3A232A', '#8C4F5E', '#C98293', '#E8B4B8', '#FDF5F6']
  },
  {
    id: 'azure_cyan',
    name: 'Cloudflare Horizon',
    category: 'brand_luxury',
    description: 'Enterprise developer cloud aesthetics with midnight navy and cyan.',
    colors: ['#0A192F', '#172A45', '#303C55', '#64FFDA', '#8892B0', '#CCD6F6']
  }
];


// ==========================================
// COLOR CONVERSIONS & MATH
// ==========================================

/**
 * Normalize and sanitize a hex string
 */
export function sanitizeHex(hex) {
  if (!hex) return '#000000';
  let cleaned = String(hex).trim().replace(/^#/, '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map(c => c + c).join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return '#6366F1';
  }
  return '#' + cleaned.toUpperCase();
}

/**
 * Convert HEX to RGB { r, g, b } (0-255)
 */
export function hexToRgb(hex) {
  const sanitized = sanitizeHex(hex).slice(1);
  const num = parseInt(sanitized, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/**
 * Convert RGB to HEX (#RRGGBB)
 */
export function rgbToHex(r, g, b) {
  const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = v => clamp(v).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert RGB to HSL { h: 0-360, s: 0-100, l: 0-100 }
 */
export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Convert HSL to RGB { r, g, b }
 */
export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Convert HSL to HEX
 */
export function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

/**
 * Convert RGB to HSV { h: 0-360, s: 0-100, v: 0-100 }
 */
export function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100)
  };
}

/**
 * Convert RGB to CMYK { c: 0-100, m: 0-100, y: 0-100, k: 0-100 }
 */
export function rgbToCmyk(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const k = 1 - Math.max(r, g, b);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100)
  };
}

// ==========================================
// WCAG 2.1 ACCESSIBILITY CONTRAST
// ==========================================

/**
 * Calculate relative luminance according to WCAG 2.1 spec
 */
export function getRelativeLuminance(r, g, b) {
  const transform = v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

/**
 * Calculate contrast ratio between two hex colors (1:1 to 21:1)
 */
export function getContrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  const ratio = (brightest + 0.05) / (darkest + 0.05);
  return parseFloat(ratio.toFixed(2));
}

/**
 * Get WCAG AA and AAA pass/fail status
 */
export function getWcagStatus(contrastRatio) {
  return {
    normalAa: contrastRatio >= 4.5,
    normalAaa: contrastRatio >= 7.0,
    largeAa: contrastRatio >= 3.0,
    largeAaa: contrastRatio >= 4.5
  };
}

/**
 * Determine whether white (#FFFFFF) or dark slate (#0F172A) offers better readability
 */
export function getBestTextColor(bgHex) {
  const ratioWhite = getContrastRatio(bgHex, '#FFFFFF');
  const ratioDark = getContrastRatio(bgHex, '#0F172A');
  return ratioWhite >= ratioDark ? '#FFFFFF' : '#0F172A';
}

// ==========================================
// COLOR NAMING (NEAREST EUCLIDEAN MATCH)
// ==========================================

/**
 * Get closest human-friendly name for any arbitrary hex color
 */
export function getColorName(hex) {
  const target = hexToRgb(hex);
  let minDistance = Infinity;
  let closestName = 'Custom Tone';

  for (const item of NAMED_COLORS) {
    const candidate = hexToRgb(item.hex);
    // Redmean color difference for human eye perception
    const rmean = (target.r + candidate.r) / 2;
    const dr = target.r - candidate.r;
    const dg = target.g - candidate.g;
    const db = target.b - candidate.b;

    const dist = Math.sqrt(
      (2 + rmean / 256) * dr * dr +
      4 * dg * dg +
      (2 + (255 - rmean) / 256) * db * db
    );

    if (dist < minDistance) {
      minDistance = dist;
      closestName = item.name;
    }
  }

  return closestName;
}

// ==========================================
// SHADES & TINTS (TAILWIND STYLE SCALE)
// ==========================================

/**
 * Generate 10-tier tonal scale (50 to 950) for a given color
 */
export function generateShadesAndTints(hex) {
  const { h, s, l } = rgbToHsl(...Object.values(hexToRgb(hex)));
  const steps = [
    { label: '50', lightness: 97, satFactor: 0.7 },
    { label: '100', lightness: 93, satFactor: 0.8 },
    { label: '200', lightness: 84, satFactor: 0.85 },
    { label: '300', lightness: 73, satFactor: 0.9 },
    { label: '400', lightness: 60, satFactor: 0.95 },
    { label: '500', lightness: l, satFactor: 1.0 }, // Base color
    { label: '600', lightness: Math.max(12, Math.round(l * 0.82)), satFactor: 1.0 },
    { label: '700', lightness: Math.max(10, Math.round(l * 0.65)), satFactor: 1.0 },
    { label: '800', lightness: Math.max(8, Math.round(l * 0.48)), satFactor: 1.0 },
    { label: '900', lightness: Math.max(6, Math.round(l * 0.32)), satFactor: 0.95 },
    { label: '950', lightness: Math.max(4, Math.round(l * 0.18)), satFactor: 0.9 }
  ];

  return steps.map(step => {
    const adjLight = step.label === '500' ? l : step.lightness;
    const adjSat = Math.min(100, Math.round(s * step.satFactor));
    const stepHex = step.label === '500' ? sanitizeHex(hex) : hslToHex(h, adjSat, adjLight);
    return {
      label: step.label,
      hex: stepHex,
      contrast: getContrastRatio(stepHex, '#FFFFFF'),
      textColor: getBestTextColor(stepHex)
    };
  });
}

// ==========================================
// COLOR HARMONY GENERATOR
// ==========================================

/**
 * Generate a harmonious palette from a base color or random aesthetic
 * @param {string} harmonyType - 'analogous' | 'monochromatic' | 'triadic' | 'complementary' | 'split_complementary' | 'tetradic' | 'golden_ratio' | 'shades' | 'random'
 * @param {string} baseHex - Hex string
 * @param {number} count - Number of colors (3 to 10)
 */
export function generateHarmonyPalette(harmonyType = 'analogous', baseHex = null, count = 5) {
  let { h, s, l } = baseHex
    ? rgbToHsl(...Object.values(hexToRgb(baseHex)))
    : {
        h: Math.floor(Math.random() * 360),
        s: Math.floor(Math.random() * 35) + 65,
        l: Math.floor(Math.random() * 25) + 45
      };

  const results = [];
  const safeCount = Math.max(3, Math.min(10, count));

  switch (harmonyType) {
    case 'monochromatic': {
      const minL = 20;
      const maxL = 88;
      const step = (maxL - minL) / (safeCount - 1);
      for (let i = 0; i < safeCount; i++) {
        const curL = Math.round(minL + i * step);
        const curS = Math.round(Math.max(20, Math.min(95, s + (i % 2 === 0 ? 5 : -5))));
        results.push(hslToHex(h, curS, curL));
      }
      break;
    }

    case 'analogous': {
      const spread = 60;
      const step = spread / (safeCount - 1);
      const startH = h - spread / 2;
      for (let i = 0; i < safeCount; i++) {
        const curH = (startH + i * step + 360) % 360;
        const curL = Math.round(Math.max(30, Math.min(75, l + (i - Math.floor(safeCount / 2)) * 5)));
        results.push(hslToHex(curH, s, curL));
      }
      break;
    }

    case 'triadic': {
      const angles = [0, 120, 240];
      for (let i = 0; i < safeCount; i++) {
        const baseAngle = angles[i % 3];
        const shift = Math.floor(i / 3) * 15;
        const curH = (h + baseAngle + shift) % 360;
        const curL = Math.max(30, Math.min(75, l + (i % 2 === 0 ? 0 : 12)));
        results.push(hslToHex(curH, s, curL));
      }
      break;
    }

    case 'complementary': {
      for (let i = 0; i < safeCount; i++) {
        const isComplement = i >= Math.ceil(safeCount / 2);
        const curH = isComplement ? (h + 180) % 360 : h;
        const progress = isComplement
          ? (i - Math.ceil(safeCount / 2)) / (safeCount - Math.ceil(safeCount / 2) || 1)
          : i / (Math.ceil(safeCount / 2) || 1);
        const curL = Math.round(Math.max(25, Math.min(80, l + (progress - 0.5) * 35)));
        results.push(hslToHex(curH, s, curL));
      }
      break;
    }

    case 'split_complementary': {
      const angles = [0, 150, 210];
      for (let i = 0; i < safeCount; i++) {
        const angle = angles[i % 3];
        const offset = Math.floor(i / 3) * 20;
        const curH = (h + angle + offset) % 360;
        const curL = Math.max(28, Math.min(78, l + (i % 2 === 0 ? -6 : 10)));
        results.push(hslToHex(curH, s, curL));
      }
      break;
    }

    case 'tetradic': {
      const angles = [0, 90, 180, 270];
      for (let i = 0; i < safeCount; i++) {
        const angle = angles[i % 4];
        const curH = (h + angle) % 360;
        const curL = Math.max(30, Math.min(75, l + (i >= 4 ? 12 : 0)));
        results.push(hslToHex(curH, s, curL));
      }
      break;
    }

    case 'golden_ratio': {
      const goldenAngle = 137.508;
      for (let i = 0; i < safeCount; i++) {
        const curH = (h + i * goldenAngle) % 360;
        const curL = Math.max(32, Math.min(72, 45 + ((i * 13) % 25)));
        results.push(hslToHex(curH, s, curL));
      }
      break;
    }

    case 'shades': {
      const minL = 15;
      const maxL = 92;
      const step = (maxL - minL) / (safeCount - 1);
      for (let i = 0; i < safeCount; i++) {
        const curL = Math.round(minL + i * step);
        results.push(hslToHex(h, s, curL));
      }
      break;
    }

    case 'random':
    default: {
      const mood = Math.random();
      for (let i = 0; i < safeCount; i++) {
        let curH = (h + i * (360 / safeCount) + (Math.random() * 20 - 10) + 360) % 360;
        let curS, curL;

        if (mood < 0.25) {
          curS = Math.floor(Math.random() * 30) + 50;
          curL = Math.floor(Math.random() * 15) + 75;
        } else if (mood < 0.5) {
          curS = Math.floor(Math.random() * 20) + 80;
          curL = Math.floor(Math.random() * 25) + 45;
        } else if (mood < 0.75) {
          curS = Math.floor(Math.random() * 30) + 70;
          curL = i === 0 ? 12 : Math.floor(Math.random() * 40) + 35;
        } else {
          curS = Math.floor(Math.random() * 35) + 40;
          curL = Math.floor(Math.random() * 40) + 30;
        }

        results.push(hslToHex(curH, curS, curL));
      }
      break;
    }
  }

  return results.map(hex => formatColorObject(hex));
}

/**
 * Format a single hex color into a complete descriptor object
 */
export function formatColorObject(hex, locked = false) {
  const sanitized = sanitizeHex(hex);
  const rgb = hexToRgb(sanitized);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
  const name = getColorName(sanitized);
  const contrastWithWhite = getContrastRatio(sanitized, '#FFFFFF');
  const contrastWithDark = getContrastRatio(sanitized, '#0F172A');
  const bestTextColor = getBestTextColor(sanitized);

  return {
    id: `color_${sanitized.slice(1)}_${Math.random().toString(36).slice(2, 7)}`,
    hex: sanitized,
    rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    rgbObj: rgb,
    hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    hslObj: hsl,
    hsv: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,
    cmyk: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
    name,
    bestTextColor,
    contrastWithWhite,
    contrastWithDark,
    wcagStatus: getWcagStatus(Math.max(contrastWithWhite, contrastWithDark)),
    locked
  };
}

// ==========================================
// IMAGE COLOR EXTRACTION
// ==========================================

/**
 * Extract dominant colors from an image File or URL
 */
export async function extractColorsFromImage(imageSource, numColors = 5) {
  return new Promise((resolve, reject) => {
    if (typeof Image === 'undefined') {
      return reject(new Error('Image extraction requires a browser environment.'));
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 2D context unavailable.');
        }

        const maxDim = 120;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h).data;
        const colorBuckets = {};

        for (let i = 0; i < imgData.length; i += 4) {
          const a = imgData[i + 3];
          if (a < 128) continue;

          const r = Math.round(imgData[i] / 16) * 16;
          const g = Math.round(imgData[i + 1] / 16) * 16;
          const b = Math.round(imgData[i + 2] / 16) * 16;

          const key = `${r},${g},${b}`;
          colorBuckets[key] = (colorBuckets[key] || 0) + 1;
        }

        const sorted = Object.entries(colorBuckets)
          .sort((a, b) => b[1] - a[1])
          .map(([key]) => {
            const [r, g, b] = key.split(',').map(Number);
            return rgbToHex(r, g, b);
          });

        const distinctColors = [];
        for (const hex of sorted) {
          const isTooClose = distinctColors.some(existing => {
            const c1 = hexToRgb(hex);
            const c2 = hexToRgb(existing);
            const dist = Math.hypot(c1.r - c2.r, c1.g - c2.g, c1.b - c2.b);
            return dist < 45;
          });

          if (!isTooClose) {
            distinctColors.push(hex);
          }

          if (distinctColors.length >= numColors) break;
        }

        while (distinctColors.length < numColors) {
          const base = distinctColors[distinctColors.length - 1] || '#4F46E5';
          const { h, s, l } = rgbToHsl(...Object.values(hexToRgb(base)));
          distinctColors.push(hslToHex((h + 40) % 360, s, Math.min(85, l + 15)));
        }

        const colorObjects = distinctColors.slice(0, numColors).map(hex => formatColorObject(hex));
        resolve(colorObjects);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for color extraction.'));
    };

    if (imageSource instanceof File || imageSource instanceof Blob) {
      img.src = URL.createObjectURL(imageSource);
    } else {
      img.src = imageSource;
    }
  });
}

// ==========================================
// EXPORT FORMATTERS
// ==========================================

/**
 * Export palette as CSS Custom Properties (Variables)
 */
export function exportAsCssVariables(colors, paletteName = 'DreamKit Palette') {
  const lines = [
    `/* ${paletteName} - Generated by DreamKit Color Studio */`,
    `:root {`
  ];
  colors.forEach((c, idx) => {
    const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    lines.push(`  --color-${idx + 1}-${slug}: ${c.hex}; /* ${c.rgb} */`);
  });
  lines.push(`}`);
  return lines.join('\n');
}

/**
 * Export palette as Tailwind CSS theme extension
 */
export function exportAsTailwind(colors, paletteName = 'palette') {
  const slugName = paletteName.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'custom';
  const colorMap = {};
  colors.forEach((c, idx) => {
    const key = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '_') || `shade_${idx + 1}`;
    colorMap[key] = c.hex;
  });

  return `// Tailwind CSS Config Theme Extension
module.exports = {
  theme: {
    extend: {
      colors: {
        '${slugName}': ${JSON.stringify(colorMap, null, 2).replace(/\n/g, '\n      ')}
      }
    }
  }
};`;
}

/**
 * Export palette as SCSS Variables
 */
export function exportAsScss(colors) {
  return colors.map((c, idx) => {
    const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `$color-${idx + 1}-${slug}: ${c.hex};`;
  }).join('\n');
}

/**
 * Export palette as formatted JSON
 */
export function exportAsJson(colors, paletteName = 'DreamKit Palette') {
  const data = {
    paletteName,
    exportedAt: new Date().toISOString(),
    totalColors: colors.length,
    colors: colors.map((c, idx) => ({
      index: idx + 1,
      name: c.name,
      hex: c.hex,
      rgb: c.rgb,
      hsl: c.hsl,
      cmyk: c.cmyk,
      bestTextColor: c.bestTextColor,
      contrastWithWhite: c.contrastWithWhite,
      contrastWithDark: c.contrastWithDark
    }))
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Export palette as an SVG color swatch graphic
 */
export function exportAsSvg(colors, paletteName = 'Color Palette') {
  const cardWidth = 140;
  const cardHeight = 220;
  const totalWidth = colors.length * cardWidth + 40;
  const totalHeight = cardHeight + 80;

  const cardsSvg = colors.map((c, i) => {
    const x = 20 + i * cardWidth;
    const y = 60;
    return `
      <g transform="translate(${x}, ${y})">
        <rect width="${cardWidth - 8}" height="${cardHeight}" rx="12" fill="${c.hex}" />
        <rect x="0" y="${cardHeight - 68}" width="${cardWidth - 8}" height="68" rx="12" fill="#0F172A" fill-opacity="0.85" />
        <text x="12" y="${cardHeight - 42}" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="12" font-weight="700">${c.hex}</text>
        <text x="12" y="${cardHeight - 24}" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="10" font-weight="500">${c.name}</text>
        <text x="12" y="${cardHeight - 8}" fill="#64748B" font-family="system-ui, sans-serif" font-size="9">${c.rgb}</text>
      </g>
    `;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">
  <rect width="100%" height="100%" fill="#090D16" rx="16" />
  <text x="24" y="38" fill="#F8FAFC" font-family="system-ui, sans-serif" font-size="16" font-weight="700">${paletteName}</text>
  <text x="${totalWidth - 24}" y="38" fill="#64748B" font-family="system-ui, sans-serif" font-size="11" text-anchor="end">DreamKit Color Studio</text>
  ${cardsSvg}
</svg>`;
}

/**
 * Generate high-resolution PNG image of the palette swatch card via Canvas
 */
export async function generatePalettePng(colors, paletteName = 'DreamKit Palette') {
  if (typeof document === 'undefined') {
    throw new Error('Canvas PNG generation requires a browser DOM environment.');
  }

  const cardWidth = 180;
  const cardHeight = 280;
  const padding = 32;
  const headerHeight = 70;
  const canvasWidth = colors.length * cardWidth + padding * 2;
  const canvasHeight = cardHeight + headerHeight + padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not acquire 2D context.');

  ctx.fillStyle = '#0F172A';
  ctx.roundRect(0, 0, canvasWidth, canvasHeight, 20);
  ctx.fill();

  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillText(paletteName, padding, padding + 28);

  ctx.fillStyle = '#64748B';
  ctx.font = '13px system-ui, -apple-system, sans-serif';
  ctx.fillText('DreamKit Studio • 100% Client-Side Color Suite', padding, padding + 48);

  colors.forEach((c, i) => {
    const x = padding + i * cardWidth;
    const y = padding + headerHeight;
    const w = cardWidth - 12;
    const h = cardHeight;

    ctx.fillStyle = c.hex;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 14);
    ctx.fill();

    const pillH = 75;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(x, y + h - pillH, w, pillH, [0, 0, 14, 14]);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px system-ui, monospace';
    ctx.fillText(c.hex, x + 12, y + h - 48);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillText(c.name.slice(0, 18), x + 12, y + h - 28);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px system-ui, monospace';
    ctx.fillText(c.rgb, x + 12, y + h - 12);
  });

  return new Promise(resolve => {
    canvas.toBlob(blob => {
      resolve({
        blob,
        url: URL.createObjectURL(blob),
        filename: `${paletteName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_palette.png`
      });
    }, 'image/png');
  });
}

// ==========================================
// STORAGE & FAVORITES MANAGEMENT
// ==========================================

export function getSavedPalettes() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const saved = localStorage.getItem(PALETTES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function savePaletteToStorage(palette) {
  if (typeof localStorage === 'undefined') return [];
  try {
    const list = getSavedPalettes();
    const existingIndex = list.findIndex(p => p.id === palette.id);
    const itemToSave = {
      ...palette,
      savedAt: Date.now()
    };
    if (existingIndex >= 0) {
      list[existingIndex] = itemToSave;
    } else {
      list.unshift(itemToSave);
    }
    localStorage.setItem(PALETTES_STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
    return list;
  } catch (err) {
    console.error('Failed to save palette to localStorage:', err);
    return [];
  }
}

export function deleteSavedPalette(id) {
  if (typeof localStorage === 'undefined') return [];
  try {
    const list = getSavedPalettes().filter(p => p.id !== id);
    localStorage.setItem(PALETTES_STORAGE_KEY, JSON.stringify(list));
    return list;
  } catch {
    return [];
  }
}

export function clearSavedPalettes() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(PALETTES_STORAGE_KEY);
  } catch {
    // Ignore error
  }
}

// ==========================================
// COLOR BLINDNESS SIMULATION (WCAG PRO)
// ==========================================

/**
 * Simulate how a color appears under common color vision deficiencies
 * @param {string} hex - Color hex string
 * @param {string} type - 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'
 */
export function simulateColorBlindness(hex, type = 'normal') {
  if (!hex || type === 'normal') return hex;
  const rgb = hexToRgb(hex);
  let { r, g, b } = rgb;

  switch (type) {
    case 'protanopia': {
      // Red-blind (L-cone absent)
      const rP = 0.56667 * r + 0.43333 * g;
      const gP = 0.55833 * r + 0.44167 * g;
      const bP = 0.24167 * g + 0.75833 * b;
      r = rP; g = gP; b = bP;
      break;
    }
    case 'deuteranopia': {
      // Green-blind (M-cone absent)
      const rD = 0.625 * r + 0.375 * g;
      const gD = 0.700 * r + 0.300 * g;
      const bD = 0.300 * g + 0.700 * b;
      r = rD; g = gD; b = bD;
      break;
    }
    case 'tritanopia': {
      // Blue-blind (S-cone absent)
      const rT = 0.950 * r + 0.050 * g;
      const gT = 0.43333 * g + 0.56667 * b;
      const bT = 0.475 * g + 0.525 * b;
      r = rT; g = gT; b = bT;
      break;
    }
    case 'achromatopsia': {
      // Complete color blindness (monochrome)
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray; g = gray; b = gray;
      break;
    }
    default:
      break;
  }

  const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
  return rgbToHex(clamp(r), clamp(g), clamp(b));
}

// ==========================================
// PALETTE SORTING & ORDER REORGANIZATION
// ==========================================

/**
 * Sort a palette by visual properties (hue, lightness, saturation, reverse)
 */
export function sortPalette(colors, mode = 'hue') {
  if (!Array.isArray(colors)) return [];
  const copy = [...colors];

  switch (mode) {
    case 'hue':
      return copy.sort((a, b) => (a.hslObj?.h ?? 0) - (b.hslObj?.h ?? 0));
    case 'lightness_asc':
      return copy.sort((a, b) => (a.hslObj?.l ?? 0) - (b.hslObj?.l ?? 0));
    case 'lightness_desc':
      return copy.sort((a, b) => (b.hslObj?.l ?? 0) - (a.hslObj?.l ?? 0));
    case 'saturation':
      return copy.sort((a, b) => (b.hslObj?.s ?? 0) - (a.hslObj?.s ?? 0));
    case 'reverse':
      return copy.reverse();
    default:
      return copy;
  }
}

// ==========================================
// CROSS-PALETTE CONTRAST PAIR MATRIX
// ==========================================

/**
 * Generate full NxN contrast matrix between every pair of colors in the palette
 */
export function getCrossContrastMatrix(colors) {
  if (!Array.isArray(colors)) return [];
  return colors.map((rowColor, rowIdx) => {
    return {
      color: rowColor,
      index: rowIdx,
      contrasts: colors.map((colColor, colIdx) => {
        if (rowIdx === colIdx) {
          return { ratio: 1.0, isSelf: true, aa: false, aaa: false };
        }
        const ratio = getContrastRatio(rowColor.hex, colColor.hex);
        return {
          ratio,
          isSelf: false,
          aa: ratio >= 4.5,
          aaa: ratio >= 7.0
        };
      })
    };
  });
}

