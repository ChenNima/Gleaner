interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
let swRegistration: ServiceWorkerRegistration | null = null;

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'up-to-date';
let updateStatus: UpdateStatus = 'idle';

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

/* --- SW Update --- */

export function setSWRegistration(reg: ServiceWorkerRegistration) {
  swRegistration = reg;
}

export function getUpdateStatus(): UpdateStatus {
  return updateStatus;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (swRegistration) return swRegistration;
  // Fallback: try to get the ready registration from the browser
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      swRegistration = reg;
      return reg;
    }
  } catch { /* no SW support */ }
  return null;
}

export async function checkForUpdate(): Promise<UpdateStatus> {
  updateStatus = 'checking';
  listeners.forEach((fn) => fn());

  const reg = await getRegistration();
  if (!reg) {
    updateStatus = 'up-to-date';
    listeners.forEach((fn) => fn());
    resetStatusLater();
    return updateStatus;
  }

  try {
    await reg.update();

    // If a new SW is waiting or installing, an update is available
    if (reg.waiting || reg.installing) {
      updateStatus = 'available';
    } else {
      updateStatus = 'up-to-date';
    }
  } catch {
    updateStatus = 'up-to-date';
  }

  listeners.forEach((fn) => fn());
  resetStatusLater();
  return updateStatus;
}

function resetStatusLater() {
  setTimeout(() => {
    if (updateStatus === 'up-to-date') {
      updateStatus = 'idle';
      listeners.forEach((fn) => fn());
    }
  }, 5000);
}
