// Dynamic PNG Icon Generator for PWA
// This module generates PNG icons on-the-fly from SVG

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

// Function to convert SVG to PNG using canvas-based rendering
// Note: This is a server-side implementation using Deno's capabilities
export async function generatePNGIcon(size: number, maskable: boolean = false): Promise<Blob> {
  try {
    // For Deno environment, we'll use the resvg library for SVG to PNG conversion
    // Import resvg-js for server-side SVG rendering
    const { Resvg } = await import('npm:@resvg/resvg-js');
    
    let svgString = SVG_ICON;
    
    // If maskable, add safe zone padding (10% on each side)
    if (maskable) {
      const padding = size * 0.1;
      const innerSize = size - (padding * 2);
      svgString = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(${padding}, ${padding}) scale(${innerSize / 512})">
          ${SVG_ICON.replace(/<svg[^>]*>|<\/svg>/g, '')}
        </g>
      </svg>`;
    } else if (size !== 512) {
      // Scale the SVG to the requested size
      svgString = SVG_ICON.replace('width="512" height="512"', `width="${size}" height="${size}"`);
    }
    
    const resvg = new Resvg(svgString, {
      fitTo: {
        mode: 'width',
        value: size,
      },
    });
    
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    
    return new Blob([pngBuffer], { type: 'image/png' });
  } catch (error) {
    console.error('Error generating PNG icon:', error);
    
    // Fallback: Return SVG as-is if PNG generation fails
    return new Blob([SVG_ICON], { type: 'image/svg+xml' });
  }
}

// Function to get or generate icon
export async function getIcon(filename: string): Promise<Response> {
  try {
    let size = 512;
    let maskable = false;
    
    // Parse filename to determine size and type
    if (filename === 'app-icon-192.png') {
      size = 192;
    } else if (filename === 'app-icon-512.png') {
      size = 512;
    } else if (filename === 'app-icon-maskable.png') {
      size = 512;
      maskable = true;
    } else {
      return new Response('Invalid icon filename', { status: 404 });
    }
    
    console.log(`Generating ${filename} (${size}x${size}, maskable: ${maskable})`);
    
    const blob = await generatePNGIcon(size, maskable);
    
    return new Response(blob, {
      headers: {
        'Content-Type': blob.type,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error in getIcon:', error);
    return new Response('Error generating icon', { status: 500 });
  }
}
