// Client-side Icon Generator
// Generates PNG icons from SVG using Canvas API

const SVG_ICON = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#8B5CF6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F59E0B;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="capGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FBBF24;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F59E0B;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="8"/>
      <feOffset dx="0" dy="4" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="512" height="512" rx="115" fill="url(#bgGradient)"/>
  <g transform="translate(256, 256)" filter="url(#shadow)">
    <path d="M -100 -60 L 0 -100 L 100 -60 L 0 -20 Z" fill="url(#capGradient)" stroke="#FFFFFF" stroke-width="4"/>
    <ellipse cx="0" cy="-60" rx="110" ry="25" fill="#FCD34D" opacity="0.9"/>
    <g transform="translate(100, -100)">
      <line x1="0" y1="0" x2="0" y2="40" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
      <circle cx="0" cy="45" r="8" fill="#FFFFFF"/>
    </g>
    <g transform="translate(0, 20)">
      <rect x="-70" y="0" width="140" height="100" rx="8" fill="#FFFFFF" opacity="0.95"/>
      <line x1="-50" y1="25" x2="50" y2="25" stroke="#3B82F6" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
      <line x1="-50" y1="45" x2="50" y2="45" stroke="#8B5CF6" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
      <line x1="-50" y1="65" x2="30" y2="65" stroke="#F59E0B" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
    </g>
    <g transform="translate(45, 60) rotate(25)">
      <rect x="-4" y="-45" width="8" height="50" fill="#F59E0B" rx="2"/>
      <polygon points="-4,-45 4,-45 0,-55" fill="#FCD34D"/>
      <rect x="-4" y="3" width="8" height="4" fill="#1F2937"/>
    </g>
  </g>
  <text x="256" y="440" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="#FFFFFF" text-anchor="middle" opacity="0.9">A</text>
</svg>`;

// Generate a PNG icon from SVG using Canvas
export function generatePNGIcon(size: number, maskable: boolean = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([SVG_ICON], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        if (maskable) {
          // For maskable icons, add padding (safe zone)
          const padding = size * 0.1; // 10% padding
          const scaledSize = size - (padding * 2);
          ctx.drawImage(img, padding, padding, scaledSize, scaledSize);
        } else {
          ctx.drawImage(img, 0, 0, size, size);
        }

        URL.revokeObjectURL(url);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG'));
    };

    img.src = url;
  });
}

// Generate all required icons
export async function generateAllIcons(): Promise<{
  icon192: string;
  icon512: string;
  iconMaskable: string;
}> {
  try {
    const [icon192, icon512, iconMaskable] = await Promise.all([
      generatePNGIcon(192, false),
      generatePNGIcon(512, false),
      generatePNGIcon(512, true),
    ]);

    return { icon192, icon512, iconMaskable };
  } catch (error) {
    console.error('Error generating icons:', error);
    throw error;
  }
}

// Register Service Worker with dynamic icons
export async function registerServiceWorkerWithIcons() {
  if ('serviceWorker' in navigator) {
    try {
      // Generate icons first
      console.log('🎨 Generating PWA icons...');
      const icons = await generateAllIcons();
      
      // Store icons in sessionStorage for service worker to use
      sessionStorage.setItem('pwa-icon-192', icons.icon192);
      sessionStorage.setItem('pwa-icon-512', icons.icon512);
      sessionStorage.setItem('pwa-icon-maskable', icons.iconMaskable);
      
      console.log('✅ PWA icons generated and cached');

      // Register service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('✅ Service Worker registered:', registration.scope);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour

      return registration;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      throw error;
    }
  } else {
    console.warn('⚠️ Service Workers not supported');
    return null;
  }
}
