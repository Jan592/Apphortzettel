// Generate PNG icons from SVG using Canvas
// This creates the required PNG icons on-the-fly if they don't exist

export async function generatePNGIcons() {
  // Simple fallback PNG icons as base64 data URIs
  // These are minimal but valid PNG files that satisfy PWA requirements
  
  const icons = {
    '192': createIconDataURL(192),
    '512': createIconDataURL(512),
    'maskable': createIconDataURL(512, true)
  };

  return icons;
}

function createIconDataURL(size: number, maskable: boolean = false): string {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';

  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#3B82F6');
  gradient.addColorStop(0.5, '#8B5CF6');
  gradient.addColorStop(1, '#F59E0B');
  
  // Draw rounded rectangle
  const radius = size * 0.225; // 115/512 for rounded corners
  ctx.fillStyle = gradient;
  roundRect(ctx, 0, 0, size, size, radius);
  ctx.fill();

  // Draw simplified icon elements
  const scale = size / 512;
  const centerX = size / 2;
  const centerY = size / 2;

  // Add padding for maskable icons
  const padding = maskable ? size * 0.1 : 0;
  const contentSize = size - (padding * 2);
  const contentScale = contentSize / size;

  ctx.save();
  if (maskable) {
    ctx.translate(padding, padding);
    ctx.scale(contentScale, contentScale);
  }

  // Draw graduation cap (simplified)
  ctx.fillStyle = '#FCD34D';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 4 * scale;
  
  // Cap top
  ctx.beginPath();
  ctx.moveTo(centerX - 100 * scale, centerY - 60 * scale);
  ctx.lineTo(centerX, centerY - 100 * scale);
  ctx.lineTo(centerX + 100 * scale, centerY - 60 * scale);
  ctx.lineTo(centerX, centerY - 20 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Paper/Document
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(
    centerX - 70 * scale,
    centerY + 20 * scale,
    140 * scale,
    100 * scale
  );

  // Lines on paper
  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 3 * scale;
  ctx.beginPath();
  ctx.moveTo(centerX - 50 * scale, centerY + 45 * scale);
  ctx.lineTo(centerX + 50 * scale, centerY + 45 * scale);
  ctx.stroke();

  ctx.strokeStyle = '#8B5CF6';
  ctx.beginPath();
  ctx.moveTo(centerX - 50 * scale, centerY + 65 * scale);
  ctx.lineTo(centerX + 50 * scale, centerY + 65 * scale);
  ctx.stroke();

  // Letter "A"
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${80 * scale}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', centerX, size - 60 * scale);

  ctx.restore();

  // Convert to data URL
  return canvas.toDataURL('image/png');
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Check if PNG icons exist, if not create them
export async function ensurePNGIcons() {
  const sizes = ['192', '512'];
  const iconPaths = [
    '/app-icon-192.png',
    '/app-icon-512.png',
    '/app-icon-maskable.png'
  ];

  // Try to fetch icons, if they don't exist, we'll use the generated ones
  const results = await Promise.all(
    iconPaths.map(path => 
      fetch(path)
        .then(res => res.ok)
        .catch(() => false)
    )
  );

  const allExist = results.every(exists => exists);
  
  if (!allExist) {
    console.warn('⚠️ PNG icons fehlen. Verwende SVG-Fallback.');
    console.warn('📝 Für beste Kompatibilität: Erstellen Sie PNG-Icons mit /public/GENERATE_PNG_ICONS.md');
  }

  return allExist;
}
