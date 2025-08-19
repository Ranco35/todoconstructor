// Server polyfills for SSR/ISR builds to avoid "self is not defined"
if (typeof globalThis !== 'undefined' && typeof globalThis.self === 'undefined') {
  // Define a global self pointing to globalThis for libraries that expect it
  // eslint-disable-next-line no-global-assign
  globalThis.self = globalThis;
}



