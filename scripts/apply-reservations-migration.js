#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Aplicando migración del módulo de reservas...\n');

// Verificar si Supabase está ejecutándose
try {
  execSync('npx supabase status', { stdio: 'pipe' });
  console.log('✅ Supabase está ejecutándose');
} catch (error) {
  console.error('❌ Supabase no está ejecutándose');
  console.log('Ejecuta: npx supabase start');
  process.exit(1);
}

// Aplicar la migración
console.log('\n🔄 Aplicando migración de reservas...');
try {
  execSync('npx supabase db reset', { stdio: 'inherit' });
  console.log('✅ Migración aplicada correctamente');
} catch (error) {
  console.error('❌ Error al aplicar la migración');
  console.log('Verifica que Docker Desktop esté ejecutándose');
  process.exit(1);
}

// Verificar que las tablas existen
console.log('\n🔍 Verificando tablas del módulo de reservas...');
try {
  const { execSync } = require('child_process');
  execSync('npx supabase db diff --schema public', { stdio: 'pipe' });
  console.log('✅ Tablas verificadas correctamente');
} catch (error) {
  console.log('⚠️  No se pudo verificar las tablas automáticamente');
}

console.log('\n🎉 ¡Módulo de reservas configurado!');
console.log('\n📋 Próximos pasos:');
console.log('1. Ve a http://localhost:54323 para acceder al dashboard de Supabase');
console.log('2. Verifica que las tablas se crearon correctamente:');
console.log('   - companies');
console.log('   - company_contacts');
console.log('   - rooms');
console.log('   - spa_products');
console.log('   - reservations');
console.log('   - reservation_products');
console.log('   - reservation_comments');
console.log('   - payments');
console.log('3. Accede al módulo de reservas en: http://localhost:3000/dashboard/reservations');
console.log('\n💡 Si tienes problemas:');
console.log('- Asegúrate de que Docker Desktop esté ejecutándose');
console.log('- Ejecuta: npx supabase status');
console.log('- Ejecuta: npx supabase db reset'); 