/**
 * Social Media Image Resizer Utilities
 * 100% Client-Side Web Canvas Engine
 * Supports Instagram, YouTube, Twitter/X, Facebook, LinkedIn, TikTok, Pinterest, Twitch, and Discord.
 * Offers Cover (Smart Crop), Contain (Blurred Mirror / Color / Gradient), and Custom Resizing.
 */

export const SOCIAL_PLATFORMS = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    color: '#E1306C',
    gradient: 'from-pink-500 via-purple-500 to-amber-500',
    description: 'Square, portrait 4:5, stories, reels, and profile specs.',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    color: '#FF0000',
    gradient: 'from-red-600 to-red-700',
    description: 'Video thumbnails, channel banners, Shorts, and profile avatars.',
  },
  twitter: {
    id: 'twitter',
    name: 'Twitter / X',
    color: '#000000',
    gradient: 'from-slate-800 to-black',
    description: 'In-stream posts, header banners, and avatars.',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    gradient: 'from-blue-600 to-blue-700',
    description: 'Feed landscape, square, stories, and page cover banners.',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    gradient: 'from-sky-700 to-blue-800',
    description: 'Feed graphics, company covers, and professional banners.',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    color: '#000000',
    gradient: 'from-slate-900 via-rose-950 to-teal-950',
    description: 'Full-screen 9:16 vertical videos, stories, and icons.',
  },
  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    color: '#BD081C',
    gradient: 'from-red-600 to-rose-700',
    description: 'Standard 2:3 vertical pins, square, and long pins.',
  },
  twitch: {
    id: 'twitch',
    name: 'Twitch',
    color: '#9146FF',
    gradient: 'from-purple-600 to-indigo-700',
    description: 'Profile banners and 16:9 offline video screens.',
  },
  discord: {
    id: 'discord',
    name: 'Discord',
    color: '#5865F2',
    gradient: 'from-indigo-600 to-violet-700',
    description: 'Server icons and wide community banners.',
  },
};

export const SOCIAL_PRESETS = [
  // --- INSTAGRAM ---
  {
    id: 'ig_portrait',
    platform: 'instagram',
    platformName: 'Instagram',
    name: 'Portrait Feed Post',
    width: 1080,
    height: 1350,
    aspectRatio: '4:5',
    category: 'Feed',
    badge: 'Top Engagement',
    description: 'Best performing format on Instagram mobile feeds. Maximizes vertical screen real estate.',
  },
  {
    id: 'ig_square',
    platform: 'instagram',
    platformName: 'Instagram',
    name: 'Square Feed Post',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    category: 'Feed',
    badge: 'Classic',
    description: 'Standard 1:1 square photo for balanced grid appearance.',
  },
  {
    id: 'ig_story',
    platform: 'instagram',
    platformName: 'Instagram',
    name: 'Story & Reel',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    category: 'Vertical',
    badge: 'Full Screen',
    description: 'Full-bleed 9:16 vertical format for Stories, Reels, and highlights.',
    safeArea: { top: 220, bottom: 420 },
  },
  {
    id: 'ig_landscape',
    platform: 'instagram',
    platformName: 'Instagram',
    name: 'Landscape Feed Post',
    width: 1080,
    height: 566,
    aspectRatio: '1.91:1',
    category: 'Feed',
    description: 'Wide horizontal format for cinematic landscapes and wide photography.',
  },
  {
    id: 'ig_profile',
    platform: 'instagram',
    platformName: 'Instagram',
    name: 'Profile Picture',
    width: 320,
    height: 320,
    aspectRatio: '1:1',
    category: 'Profile',
    description: 'Circular cropped profile photo for user avatars.',
  },

  // --- YOUTUBE ---
  {
    id: 'yt_thumbnail',
    platform: 'youtube',
    platformName: 'YouTube',
    name: 'Video Thumbnail',
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
    category: 'Video',
    badge: 'Essential HD',
    description: 'High-definition 16:9 thumbnail for video click-through rates. Under 2MB.',
  },
  {
    id: 'yt_shorts',
    platform: 'youtube',
    platformName: 'YouTube',
    name: 'Shorts Video Cover',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    category: 'Vertical',
    badge: 'Trending',
    description: 'Vertical 9:16 cover for YouTube Shorts algorithm feeds.',
  },
  {
    id: 'yt_banner',
    platform: 'youtube',
    platformName: 'YouTube',
    name: 'Channel Banner',
    width: 2560,
    height: 1440,
    aspectRatio: '16:9',
    category: 'Channel',
    badge: 'Multi-Device',
    description: 'TV/Desktop channel art. Central safe area for text & logo: 1546 × 423 px.',
    safeArea: { x: 507, y: 508, width: 1546, height: 423 },
  },
  {
    id: 'yt_profile',
    platform: 'youtube',
    platformName: 'YouTube',
    name: 'Channel Profile Icon',
    width: 800,
    height: 800,
    aspectRatio: '1:1',
    category: 'Channel',
    description: 'Square channel icon displayed next to your videos and comments.',
  },

  // --- TWITTER / X ---
  {
    id: 'x_post',
    platform: 'twitter',
    platformName: 'Twitter / X',
    name: 'In-Stream Single Image',
    width: 1200,
    height: 675,
    aspectRatio: '16:9',
    category: 'Feed',
    badge: 'Recommended',
    description: 'Optimal horizontal image size for high readability in timeline feeds.',
  },
  {
    id: 'x_header',
    platform: 'twitter',
    platformName: 'Twitter / X',
    name: 'Profile Header Banner',
    width: 1500,
    height: 500,
    aspectRatio: '3:1',
    category: 'Profile',
    badge: 'Panoramic',
    description: 'Top profile header cover photo across web and mobile apps.',
  },
  {
    id: 'x_avatar',
    platform: 'twitter',
    platformName: 'Twitter / X',
    name: 'Profile Avatar',
    width: 400,
    height: 400,
    aspectRatio: '1:1',
    category: 'Profile',
    description: 'Square avatar photo, rendered as circle on profile and tweets.',
  },

  // --- FACEBOOK ---
  {
    id: 'fb_post_landscape',
    platform: 'facebook',
    platformName: 'Facebook',
    name: 'Feed Post (Landscape)',
    width: 1200,
    height: 630,
    aspectRatio: '1.91:1',
    category: 'Feed',
    badge: 'Standard',
    description: 'Standard link preview and image share dimension for Facebook News Feed.',
  },
  {
    id: 'fb_post_square',
    platform: 'facebook',
    platformName: 'Facebook',
    name: 'Feed Post (Square)',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    category: 'Feed',
    description: 'Square 1:1 post for cross-posting between Instagram and Facebook.',
  },
  {
    id: 'fb_cover',
    platform: 'facebook',
    platformName: 'Facebook',
    name: 'Page / Profile Cover',
    width: 820,
    height: 312,
    aspectRatio: '2.63:1',
    category: 'Profile',
    description: 'Displays 820×312 px on desktop and 640×360 px on smartphones.',
  },
  {
    id: 'fb_event',
    platform: 'facebook',
    platformName: 'Facebook',
    name: 'Event Cover Banner',
    width: 1920,
    height: 1005,
    aspectRatio: '16:9',
    category: 'Events',
    description: 'High-resolution cover for public or private event invitations.',
  },

  // --- LINKEDIN ---
  {
    id: 'li_post',
    platform: 'linkedin',
    platformName: 'LinkedIn',
    name: 'Feed Shared Image',
    width: 1200,
    height: 627,
    aspectRatio: '1.91:1',
    category: 'Feed',
    badge: 'Professional',
    description: 'Standard aspect ratio for article link previews and feed announcements.',
  },
  {
    id: 'li_company_cover',
    platform: 'linkedin',
    platformName: 'LinkedIn',
    name: 'Company Page Cover',
    width: 1128,
    height: 191,
    aspectRatio: '5.9:1',
    category: 'Company',
    description: 'Ultra-wide banner displayed across company organization pages.',
  },
  {
    id: 'li_profile_cover',
    platform: 'linkedin',
    platformName: 'LinkedIn',
    name: 'Personal Background Banner',
    width: 1584,
    height: 396,
    aspectRatio: '4:1',
    category: 'Profile',
    description: 'Header background behind personal member profile photo.',
  },

  // --- TIKTOK ---
  {
    id: 'tt_video',
    platform: 'tiktok',
    platformName: 'TikTok',
    name: 'Vertical Video / Story',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    category: 'Feed',
    badge: 'Viral',
    description: 'Full-bleed 9:16 mobile canvas for TikTok videos, stories, and carousels.',
  },

  // --- PINTEREST ---
  {
    id: 'pin_standard',
    platform: 'pinterest',
    platformName: 'Pinterest',
    name: 'Standard Pin (2:3)',
    width: 1000,
    height: 1500,
    aspectRatio: '2:3',
    category: 'Pins',
    badge: 'Best Algorithm',
    description: 'Officially recommended ratio (2:3) for maximum distribution on Pinterest boards.',
  },
  {
    id: 'pin_square',
    platform: 'pinterest',
    platformName: 'Pinterest',
    name: 'Square Pin (1:1)',
    width: 1000,
    height: 1000,
    aspectRatio: '1:1',
    category: 'Pins',
    description: 'Square pin format, great for product photos and quick saves.',
  },

  // --- TWITCH ---
  {
    id: 'twitch_banner',
    platform: 'twitch',
    platformName: 'Twitch',
    name: 'Profile Banner',
    width: 1200,
    height: 480,
    aspectRatio: '5:2',
    category: 'Streamer',
    description: 'Header banner displayed across live stream channels.',
  },
  {
    id: 'twitch_offline',
    platform: 'twitch',
    platformName: 'Twitch',
    name: 'Video Offline Banner',
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    category: 'Streamer',
    description: 'Display screen shown when channel is currently offline.',
  },

  // --- DISCORD ---
  {
    id: 'discord_icon',
    platform: 'discord',
    platformName: 'Discord',
    name: 'Server Icon',
    width: 512,
    height: 512,
    aspectRatio: '1:1',
    category: 'Community',
    description: 'Square server icon displayed in sidebar servers list.',
  },
  {
    id: 'discord_banner',
    platform: 'discord',
    platformName: 'Discord',
    name: 'Server Banner',
    width: 960,
    height: 540,
    aspectRatio: '16:9',
    category: 'Community',
    description: 'Level 2 server banner displayed at top of channel listings.',
  },
];

/**
 * Format bytes into human-readable string
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(dm))} ${sizes[idx]}`;
}

/**
 * Helper to load image via FileReader data URL as resilient fallback
 */
function loadViaFileReader(blob) {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      return reject(new Error('FileReader is unavailable in this environment'));
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to decode image from data URL.'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file as data URL.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Load HTMLImageElement from File, Blob, ImageBitmap, HTMLCanvasElement, or URL
 * @param {HTMLImageElement|ImageBitmap|HTMLCanvasElement|File|Blob|string} src
 * @returns {Promise<HTMLImageElement|ImageBitmap|HTMLCanvasElement>}
 */
export function loadImage(src) {
  // If already an HTMLImageElement
  if (typeof HTMLImageElement !== 'undefined' && src instanceof HTMLImageElement) {
    if (src.complete && src.naturalWidth > 0) {
      return Promise.resolve(src);
    }
    return new Promise((resolve, reject) => {
      const onLoad = () => {
        src.removeEventListener('load', onLoad);
        src.removeEventListener('error', onError);
        resolve(src);
      };
      const onError = () => {
        src.removeEventListener('load', onLoad);
        src.removeEventListener('error', onError);
        reject(new Error('Failed to decode source image element.'));
      };
      src.addEventListener('load', onLoad);
      src.addEventListener('error', onError);
    });
  }

  // If already an HTMLCanvasElement or ImageBitmap
  if (
    (typeof HTMLCanvasElement !== 'undefined' && src instanceof HTMLCanvasElement) ||
    (typeof ImageBitmap !== 'undefined' && src instanceof ImageBitmap)
  ) {
    return Promise.resolve(src);
  }

  // If File or Blob
  if (src instanceof Blob || src instanceof File) {
    return new Promise((resolve, reject) => {
      let objectUrl = null;
      try {
        objectUrl = URL.createObjectURL(src);
      } catch {
        // Fallback directly to FileReader
        loadViaFileReader(src).then(resolve).catch(reject);
        return;
      }

      const img = new Image();
      // Notice: Do NOT set crossOrigin on local blob URLs (causes issues in WebKit/Safari/file sandboxes)

      const cleanup = () => {
        img.onload = null;
        img.onerror = null;
      };

      img.onload = () => {
        cleanup();
        setTimeout(() => {
          try {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
          } catch {}
        }, 10000);
        resolve(img);
      };

      img.onerror = () => {
        cleanup();
        try {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        } catch {}
        // Fallback: try reading as data URL if blob URL load failed
        loadViaFileReader(src)
          .then(resolve)
          .catch(() => {
            reject(new Error('Failed to decode source image. The file may be unsupported or corrupted.'));
          });
      };

      img.src = objectUrl;
    });
  }

  // If string URL (data:, blob:, http:, or relative)
  if (typeof src === 'string') {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const isRemote = src.startsWith('http://') || src.startsWith('https://');

      // Only set crossOrigin on remote HTTP/HTTPS URLs
      if (isRemote) {
        img.crossOrigin = 'anonymous';
      }

      const cleanUp = () => {
        img.onload = null;
        img.onerror = null;
      };

      img.onload = () => {
        cleanUp();
        resolve(img);
      };

      img.onerror = () => {
        cleanUp();
        // If remote image failed with CORS anonymous, retry once without CORS
        if (isRemote && img.crossOrigin) {
          const fallbackImg = new Image();
          fallbackImg.onload = () => resolve(fallbackImg);
          fallbackImg.onerror = () => {
            reject(new Error('Failed to decode source image from remote URL.'));
          };
          fallbackImg.src = src;
          return;
        }

        reject(new Error('Failed to decode source image. URL may be invalid, revoked, or unsupported.'));
      };

      img.src = src;
    });
  }

  return Promise.reject(new Error('Invalid image source type: expected File, Blob, Image, Canvas, or URL string.'));
}

/**
 * Convert canvas to Blob
 */
export function canvasToBlob(canvas, mimeType = 'image/png', quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create image blob from canvas'));
      },
      mimeType,
      quality
    );
  });
}

/**
 * Resize and fit image to social media specifications
 * @param {HTMLImageElement|ImageBitmap|HTMLCanvasElement|File|Blob|string} sourceImage
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function resizeSocialMediaImage(sourceImage, options = {}) {
  const startTime = performance.now();
  const img = (sourceImage instanceof HTMLImageElement && sourceImage.complete && sourceImage.naturalWidth > 0)
    ? sourceImage
    : await loadImage(sourceImage);

  const srcWidth = img.naturalWidth || img.width;
  const srcHeight = img.naturalHeight || img.height;

  if (!srcWidth || !srcHeight || srcWidth <= 0 || srcHeight <= 0) {
    throw new Error('Invalid source image dimensions (0x0).');
  }

  const {
    targetWidth = 1080,
    targetHeight = 1080,
    fitMode = 'cover', // 'cover' | 'contain' | 'stretch'
    anchor = 'center', // 'center' | 'top' | 'bottom' | 'left' | 'right'
    paddingType = 'blur', // 'blur' | 'color' | 'gradient' | 'transparent'
    paddingColor = '#000000',
    gradientType = 'dark', // 'dark' | 'sunset' | 'ocean' | 'neon'
    blurStrength = 30, // 5 to 60 px
    format = 'image/png',
    quality = 0.92,
    presetName = 'social-media',
  } = options;

  const tw = Math.max(16, Math.round(targetWidth));
  const th = Math.max(16, Math.round(targetHeight));

  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (fitMode === 'stretch') {
    // Non-proportional stretch
    ctx.drawImage(img, 0, 0, tw, th);
  } else if (fitMode === 'contain') {
    // 1. Draw Background Padding
    if (paddingType === 'blur') {
      // Blurred Mirror Background
      ctx.save();
      // Draw zoomed copy of source image into canvas with blur filter
      ctx.filter = `blur(${Math.max(5, blurStrength)}px) brightness(0.8)`;
      // Scale up to cover canvas completely
      const scaleBg = Math.max(tw / srcWidth, th / srcHeight) * 1.25;
      const bw = srcWidth * scaleBg;
      const bh = srcHeight * scaleBg;
      const bx = (tw - bw) / 2;
      const by = (th - bh) / 2;
      ctx.drawImage(img, bx, by, bw, bh);
      ctx.restore();

      // Subtle dark vignette to make foreground pop
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(0, 0, tw, th);
    } else if (paddingType === 'color') {
      ctx.fillStyle = paddingColor;
      ctx.fillRect(0, 0, tw, th);
    } else if (paddingType === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, tw, th);
      if (gradientType === 'sunset') {
        grad.addColorStop(0, '#f97316');
        grad.addColorStop(0.5, '#ec4899');
        grad.addColorStop(1, '#8b5cf6');
      } else if (gradientType === 'ocean') {
        grad.addColorStop(0, '#0284c7');
        grad.addColorStop(0.5, '#0d9488');
        grad.addColorStop(1, '#064e3b');
      } else if (gradientType === 'neon') {
        grad.addColorStop(0, '#7928ca');
        grad.addColorStop(1, '#ff0080');
      } else {
        // Dark metallic gradient
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.5, '#1e293b');
        grad.addColorStop(1, '#090d16');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, tw, th);
    }
    // (If paddingType === 'transparent', canvas starts transparent)

    // 2. Draw Proportionally Scaled Foreground Image Inside Canvas
    const scale = Math.min(tw / srcWidth, th / srcHeight);
    const fw = srcWidth * scale;
    const fh = srcHeight * scale;
    const fx = (tw - fw) / 2;
    const fy = (th - fh) / 2;

    // Optional gentle drop shadow for blurred containment
    if (paddingType === 'blur' || paddingType === 'gradient') {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;
      ctx.drawImage(img, fx, fy, fw, fh);
      ctx.restore();
    } else {
      ctx.drawImage(img, fx, fy, fw, fh);
    }
  } else {
    // 'cover' - Scale to fill entire target canvas, cropping excess
    const scale = Math.max(tw / srcWidth, th / srcHeight);
    const scaledW = srcWidth * scale;
    const scaledH = srcHeight * scale;

    let dx = (tw - scaledW) / 2;
    let dy = (th - scaledH) / 2;

    if (anchor === 'top') {
      dy = 0;
    } else if (anchor === 'bottom') {
      dy = th - scaledH;
    } else if (anchor === 'left') {
      dx = 0;
    } else if (anchor === 'right') {
      dx = tw - scaledW;
    }

    ctx.drawImage(img, dx, dy, scaledW, scaledH);
  }

  const blob = await canvasToBlob(canvas, format, quality);
  const url = URL.createObjectURL(blob);
  const durationMs = Math.round(performance.now() - startTime);

  let ext = 'png';
  if (format === 'image/jpeg') ext = 'jpg';
  if (format === 'image/webp') ext = 'webp';

  const origName = (sourceImage && sourceImage.name) || options.filename || 'image';
  const baseName = origName.replace(/\.[^/.]+$/, '');
  const cleanPreset = presetName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const filename = `${baseName}-${cleanPreset}-${tw}x${th}.${ext}`;

  return {
    blob,
    url,
    name: filename,
    width: tw,
    height: th,
    size: blob.size,
    format,
    durationMs,
  };
}

/**
 * Generate synthetic colorful demo images for instant testing
 */
export async function createSocialMediaSampleImage(type = 'creator') {
  const width = 1920;
  const height = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  let filename = 'sample-creator-thumbnail.jpg';

  if (type === 'creator') {
    filename = 'gaming-podcast-creator.jpg';

    // Deep dark synthwave background
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#090d16');
    bg.addColorStop(0.5, '#1e1b4b');
    bg.addColorStop(1, '#431407');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Glowing energy circles
    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.beginPath();
    ctx.arc(width * 0.75, height * 0.5, 360, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
    ctx.beginPath();
    ctx.arc(width * 0.25, height * 0.4, 280, 0, Math.PI * 2);
    ctx.fill();

    // Bold YouTube-style banner text
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 92px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 6;
    ctx.fillText('NEXT-GEN PODCAST', 140, 360);

    ctx.fillStyle = '#facc15';
    ctx.font = '900 84px system-ui, -apple-system, sans-serif';
    ctx.fillText('EPISODE 42 • LIVE SHOW', 140, 470);

    // Pill badge
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(140, 210, 240, 56, 14);
    } else {
      ctx.rect(140, 210, 240, 56);
    }
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXCLUSIVE 4K', 260, 248);

    // Mic / Headphones icon placeholder graphic
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(width - 400, height * 0.5, 140, Math.PI, 0, false);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(width - 560, height * 0.48, 40, 100);
    ctx.fillRect(width - 280, height * 0.48, 40, 100);
  } else if (type === 'brand') {
    filename = 'brand-product-showcase.jpg';

    // Sleek studio product gradient
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#f8fafc');
    bg.addColorStop(0.5, '#e2e8f0');
    bg.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Luxury product podium pedestal
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(width / 2, height * 0.72, 420, 110, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;

    // Center product box (smartphone or cosmetics)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(width / 2 - 120, height * 0.28, 240, 420, 36);
    } else {
      ctx.rect(width / 2 - 120, height * 0.28, 240, 420);
    }
    ctx.fill();

    // Product screen glare
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(width / 2 - 105, height * 0.31, 210, 370, 24);
    } else {
      ctx.rect(width / 2 - 105, height * 0.31, 210, 370);
    }
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 54px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AURORA PRO 2026', width / 2, 180);
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Available Worldwide • Multi-Platform Campaign Asset', width / 2, 230);
  } else {
    filename = 'sunset-travel-photography.jpg';

    // Cinematic landscape sunset
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.65);
    sky.addColorStop(0, '#1e1b4b');
    sky.addColorStop(0.4, '#c026d3');
    sky.addColorStop(0.8, '#f97316');
    sky.addColorStop(1, '#fde047');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height * 0.65);

    // Giant golden sun
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.52, 110, 0, Math.PI * 2);
    ctx.fill();

    // Mountain silhouettes
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.65);
    ctx.lineTo(width * 0.2, height * 0.38);
    ctx.lineTo(width * 0.45, height * 0.58);
    ctx.lineTo(width * 0.7, height * 0.34);
    ctx.lineTo(width, height * 0.65);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Water reflection
    const water = ctx.createLinearGradient(0, height * 0.65, 0, height);
    water.addColorStop(0, '#312e81');
    water.addColorStop(1, '#0f172a');
    ctx.fillStyle = water;
    ctx.fillRect(0, height * 0.65, width, height * 0.35);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic bold 52px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 16;
    ctx.fillText('Wanderlust Horizons', width / 2, height - 90);
    ctx.font = '20px sans-serif';
    ctx.fillText('Perfect for Instagram Reels, YouTube Covers & Pinterest Pins', width / 2, height - 50);
  }

  const mime = 'image/jpeg';
  const blob = await canvasToBlob(canvas, mime, 0.95);
  return new File([blob], filename, { type: mime, lastModified: Date.now() });
}

/**
 * Trigger file download in browser
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
