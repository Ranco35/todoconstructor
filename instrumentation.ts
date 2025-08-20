// Hook global para Node.js: se ejecuta antes que cualquier SSR/ISR/API
export async function register() {
  if (typeof globalThis !== 'undefined' && typeof (globalThis as any).self === 'undefined') {
    (globalThis as any).self = globalThis as any;
  }
}


