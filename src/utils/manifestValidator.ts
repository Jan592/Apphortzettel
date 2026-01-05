/**
 * Manifest Validator & Debugger
 * 
 * Hilft beim Debuggen von PWA Manifest-Problemen
 */

export async function validateManifest(): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
  manifestData?: any;
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // 1. Check if manifest link exists
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      errors.push('Kein <link rel="manifest"> im HTML gefunden');
      return { isValid: false, errors, warnings };
    }
    
    const manifestUrl = (manifestLink as HTMLLinkElement).href;
    console.log('📄 Manifest URL:', manifestUrl);
    
    // 2. Try to fetch manifest
    const response = await fetch(manifestUrl);
    if (!response.ok) {
      errors.push(`Manifest konnte nicht geladen werden: HTTP ${response.status}`);
      return { isValid: false, errors, warnings };
    }
    
    // 3. Parse JSON
    const manifestData = await response.json();
    console.log('✅ Manifest geladen:', manifestData);
    
    // 4. Validate required fields
    if (!manifestData.name) {
      errors.push('Feld "name" fehlt im Manifest');
    }
    
    if (!manifestData.short_name) {
      warnings.push('Feld "short_name" fehlt (empfohlen)');
    }
    
    if (!manifestData.start_url) {
      errors.push('Feld "start_url" fehlt im Manifest');
    }
    
    if (!manifestData.display) {
      warnings.push('Feld "display" fehlt (empfohlen)');
    }
    
    if (!manifestData.icons || manifestData.icons.length === 0) {
      errors.push('Keine Icons im Manifest definiert');
    } else {
      // Validate icons
      let has192 = false;
      let has512 = false;
      
      manifestData.icons.forEach((icon: any, index: number) => {
        if (!icon.src) {
          errors.push(`Icon ${index} hat keine "src" Eigenschaft`);
        }
        if (!icon.sizes) {
          warnings.push(`Icon ${index} hat keine "sizes" Eigenschaft`);
        }
        
        if (icon.sizes && icon.sizes.includes('192')) {
          has192 = true;
        }
        if (icon.sizes && icon.sizes.includes('512')) {
          has512 = true;
        }
      });
      
      if (!has192) {
        warnings.push('Kein 192x192 Icon gefunden (empfohlen für Android)');
      }
      if (!has512) {
        warnings.push('Kein 512x512 Icon gefunden (empfohlen für Android)');
      }
    }
    
    // 5. Check theme_color
    if (!manifestData.theme_color) {
      warnings.push('Feld "theme_color" fehlt (empfohlen)');
    }
    
    // 6. Check background_color
    if (!manifestData.background_color) {
      warnings.push('Feld "background_color" fehlt (empfohlen)');
    }
    
    const isValid = errors.length === 0;
    
    return {
      isValid,
      errors,
      warnings,
      manifestData
    };
    
  } catch (error: any) {
    errors.push(`Fehler beim Validieren: ${error.message}`);
    return { isValid: false, errors, warnings };
  }
}

/**
 * Logs manifest validation results to console
 */
export async function debugManifest() {
  console.group('🔍 PWA Manifest Debugging');
  
  const result = await validateManifest();
  
  if (result.isValid) {
    console.log('✅ Manifest ist gültig!');
  } else {
    console.error('❌ Manifest hat Fehler!');
  }
  
  if (result.errors.length > 0) {
    console.group('❌ Fehler:');
    result.errors.forEach(error => console.error('  •', error));
    console.groupEnd();
  }
  
  if (result.warnings.length > 0) {
    console.group('⚠️ Warnungen:');
    result.warnings.forEach(warning => console.warn('  •', warning));
    console.groupEnd();
  }
  
  if (result.manifestData) {
    console.log('📋 Manifest Daten:', result.manifestData);
  }
  
  // Check Service Worker
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      console.log('✅ Service Worker registriert');
      console.log('   Scope:', registration.scope);
      console.log('   Status:', registration.active ? 'Aktiv' : 'Inaktiv');
    } else {
      console.warn('⚠️ Service Worker nicht registriert');
    }
  } else {
    console.error('❌ Service Worker nicht unterstützt');
  }
  
  // Check if PWA is installable
  if ('onbeforeinstallprompt' in window) {
    console.log('✅ Browser unterstützt PWA-Installation');
  } else if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    console.log('ℹ️ iOS - Installation über "Zum Home-Bildschirm"');
  } else {
    console.warn('⚠️ PWA-Installation möglicherweise nicht unterstützt');
  }
  
  console.groupEnd();
  
  return result;
}

/**
 * Auto-fix common manifest issues
 */
export function autoFixManifest() {
  // Check if manifest link exists
  let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
  
  if (!manifestLink) {
    console.log('🔧 Erstelle Manifest Link...');
    manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/manifest.json';
    document.head.appendChild(manifestLink);
    console.log('✅ Manifest Link hinzugefügt');
  }
  
  // Check theme-color meta tag
  let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
  if (!themeColorMeta) {
    console.log('🔧 Erstelle theme-color Meta Tag...');
    themeColorMeta = document.createElement('meta');
    themeColorMeta.name = 'theme-color';
    themeColorMeta.content = '#3B82F6';
    document.head.appendChild(themeColorMeta);
    console.log('✅ Theme-color Meta Tag hinzugefügt');
  }
  
  // Check viewport meta tag
  let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
  if (!viewportMeta) {
    console.log('🔧 Erstelle viewport Meta Tag...');
    viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    viewportMeta.content = 'width=device-width, initial-scale=1';
    document.head.appendChild(viewportMeta);
    console.log('✅ Viewport Meta Tag hinzugefügt');
  }
  
  console.log('✅ Auto-Fix abgeschlossen');
}
