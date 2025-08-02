// SCRIPT PARA RESETEAR COMPLETAMENTE FILTROS DE PRODUCTOS
// Ejecutar en consola del navegador (F12)

console.log('🧹 INICIANDO LIMPIEZA COMPLETA DE FILTROS...');

// 1. Limpiar localStorage completamente
console.log('📱 Limpiando localStorage...');
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (
    key.includes('product') ||
    key.includes('filter') ||
    key.includes('search') ||
    key.includes('category') ||
    key.includes('warehouse') ||
    key.includes('column')
  )) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log(`❌ Eliminado: ${key}`);
});

// 2. Limpiar sessionStorage
console.log('💾 Limpiando sessionStorage...');
const sessionKeysToRemove = [];
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key && (
    key.includes('product') ||
    key.includes('filter') ||
    key.includes('search') ||
    key.includes('category') ||
    key.includes('warehouse') ||
    key.includes('column')
  )) {
    sessionKeysToRemove.push(key);
  }
}

sessionKeysToRemove.forEach(key => {
  sessionStorage.removeItem(key);
  console.log(`❌ Eliminado de session: ${key}`);
});

// 3. Limpiar URL
console.log('🔗 Limpiando URL...');
if (window.location.search) {
  const newUrl = window.location.pathname;
  window.history.replaceState({}, document.title, newUrl);
  console.log(`✅ URL limpiada: ${newUrl}`);
}

// 4. Recargar página
console.log('🔄 Recargando página...');
setTimeout(() => {
  window.location.reload();
}, 1000);

console.log('✅ LIMPIEZA COMPLETA TERMINADA - Recargando...'); 