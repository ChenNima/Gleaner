interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;

const listeners = new Set<() => void>();

export function initInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((fn) => fn());
  });

  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredPrompt = null;
    listeners.forEach((fn) => fn());
  });

  // Detect if already running as installed PWA
  if (window.matchMedia('(display-mode: standalone)').matches) {
    installed = true;
  }
}

export function canInstall(): boolean {
  return deferredPrompt !== null && !installed;
}

export function isInstalled(): boolean {
  return installed;
}

export async function installPWA(): Promise<boolean> {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  deferredPrompt = null;
  listeners.forEach((fn) => fn());
  return result.outcome === 'accepted';
}

export function onInstallChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
