// Este hook se ejecuta antes que cualquier ruta/SSR/ISR en Node.js
export async function register() {
  if (typeof globalThis !== 'undefined' && typeof (globalThis as any).self === 'undefined') {
    (globalThis as any).self = globalThis as any;
  }
}



