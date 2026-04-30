// PWA Utilities for Service Worker Registration and Install Prompt

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    // Silently skip if Service Worker is not supported (e.g., in development environment)
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registriert:', registration.scope);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
      })
      .catch((error) => {
        // Only log if it's a real error, not just unsupported environment
        if (error.message && !error.message.includes('not supported')) {
          console.log('Service Worker: Nicht verfügbar in dieser Umgebung');
        }
      });
  });
}

export function checkPWAInstallable() {
  let deferredPrompt: any = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    console.log('✅ App kann installiert werden');
  });

  return {
    canInstall: () => deferredPrompt !== null,
    promptInstall: async () => {
      if (!deferredPrompt) {
        console.log('❌ Kein Install Prompt verfügbar');
        return false;
      }

      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);

      // Clear the deferredPrompt
      deferredPrompt = null;

      return outcome === 'accepted';
    }
  };
}

export function isPWAInstalled() {
  // Check if the app is running in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone ||
                       document.referrer.includes('android-app://');
  
  if (isStandalone) {
    console.log('✅ PWA läuft im Standalone-Modus');
  }
  
  return isStandalone;
}

export function getInstallInstructions() {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /ipad|iphone|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
  const isChrome = /chrome/.test(userAgent) && !/edg/.test(userAgent);
  const isEdge = /edg/.test(userAgent);

  if (isIOS) {
    return {
      platform: 'iOS',
      browser: isSafari ? 'Safari' : 'Anderer Browser',
      steps: [
        'Öffnen Sie diese Seite in Safari',
        'Tippen Sie unten auf das "Teilen"-Symbol 📤',
        'Scrollen Sie nach unten und tippen Sie auf "Zum Home-Bildschirm"',
        'Tippen Sie oben rechts auf "Hinzufügen"',
        'Die App erscheint auf Ihrem Startbildschirm'
      ]
    };
  } else if (isAndroid) {
    return {
      platform: 'Android',
      browser: isChrome ? 'Chrome' : 'Anderer Browser',
      steps: [
        'Öffnen Sie diese Seite in Chrome',
        'Tippen Sie auf die drei Punkte ⋮ oben rechts',
        'Wählen Sie "App installieren" oder "Zum Startbildschirm"',
        'Tippen Sie auf "Installieren"',
        'Die App wird auf Ihrem Gerät installiert'
      ]
    };
  } else {
    const browserName = isChrome ? 'Chrome' : isEdge ? 'Edge' : 'Ihrem Browser';
    return {
      platform: 'Desktop',
      browser: browserName,
      steps: [
        `Öffnen Sie diese Seite in ${browserName}`,
        'Suchen Sie das Install-Symbol ⊕ in der Adressleiste',
        'Oder: Klicken Sie auf ⋮ Menü → "Installieren"',
        'Klicken Sie auf "Installieren" im Dialog',
        'Die App wird als Desktop-Anwendung installiert'
      ]
    };
  }
}

// Check if browser supports PWA installation
export function supportsPWAInstall() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const supportsManifest = 'onbeforeinstallprompt' in window;
  const isStandalone = isPWAInstalled();
  
  // iOS supports PWA via Add to Home Screen in Safari
  // Other browsers support it via beforeinstallprompt
  return !isStandalone && (isIOS || supportsManifest);
}
