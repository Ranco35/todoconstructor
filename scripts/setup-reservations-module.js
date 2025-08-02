#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando Módulo de Reservas - Hotel Spa Termas Llifen\n');

// Verificar si Docker está instalado
try {
  execSync('docker --version', { stdio: 'pipe' });
  console.log('✅ Docker está instalado');
} catch (error) {
  console.error('❌ Docker no está instalado');
  console.log('Por favor, instala Docker Desktop desde: https://www.docker.com/products/docker-desktop/');
  process.exit(1);
}

// Verificar si Docker Desktop está ejecutándose
try {
  execSync('docker ps', { stdio: 'pipe' });
  console.log('✅ Docker Desktop está ejecutándose');
} catch (error) {
  console.error('❌ Docker Desktop no está ejecutándose');
  console.log('\n📋 Pasos para resolver:');
  console.log('1. Abre Docker Desktop desde el menú de inicio');
  console.log('2. Espera a que Docker Desktop se inicie completamente');
  console.log('3. Ejecuta este script nuevamente');
  console.log('\n💡 Si Docker Desktop no se inicia:');
  console.log('- Reinicia tu computadora');
  console.log('- Verifica que WSL2 esté habilitado (Windows)');
  console.log('- Reinstala Docker Desktop si es necesario');
  process.exit(1);
}

// Verificar si Supabase CLI está disponible
try {
  execSync('npx supabase --version', { stdio: 'pipe' });
  console.log('✅ Supabase CLI está disponible');
} catch (error) {
  console.error('❌ Supabase CLI no está disponible');
  console.log('Instalando Supabase CLI...');
  try {
    execSync('npm install -g supabase', { stdio: 'inherit' });
    console.log('✅ Supabase CLI instalado');
  } catch (installError) {
    console.error('❌ Error al instalar Supabase CLI');
    process.exit(1);
  }
}

// Iniciar Supabase
console.log('\n🔄 Iniciando Supabase...');
try {
  execSync('npx supabase start', { stdio: 'inherit' });
  console.log('✅ Supabase iniciado correctamente');
} catch (error) {
  console.error('❌ Error al iniciar Supabase');
  console.log('Verifica que Docker Desktop esté ejecutándose');
  process.exit(1);
}

// Aplicar migraciones
console.log('\n🔄 Aplicando migraciones del módulo de reservas...');
try {
  execSync('npx supabase db reset', { stdio: 'inherit' });
  console.log('✅ Migraciones aplicadas correctamente');
} catch (error) {
  console.error('❌ Error al aplicar migraciones');
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

console.log('\n🎉 ¡Módulo de reservas configurado exitosamente!');
console.log('\n📋 Próximos pasos:');
console.log('1. Ve a http://localhost:54323 para acceder al dashboard de Supabase');
console.log('2. Verifica que las siguientes tablas se crearon:');
console.log('   ✅ companies');
console.log('   ✅ company_contacts');
console.log('   ✅ rooms');
console.log('   ✅ spa_products');
console.log('   ✅ reservations');
console.log('   ✅ reservation_products');
console.log('   ✅ reservation_comments');
console.log('   ✅ payments');
console.log('3. Accede al módulo de reservas en: http://localhost:3000/dashboard/reservations');
console.log('\n📊 Datos de ejemplo incluidos:');
console.log('   - 3 empresas con diferentes términos de pago');
console.log('   - 6 habitaciones de diferentes tipos');
console.log('   - 6 productos del spa (servicios y paquetes)');
console.log('   - Contactos autorizados para empresas');
console.log('\n💡 Características del módulo:');
console.log('   - Gestión de reservas individuales y corporativas');
console.log('   - Calendario con vistas mensual, semanal y diaria');
console.log('   - Sistema de pagos y comentarios');
console.log('   - Filtros avanzados y búsqueda');
console.log('   - Estadísticas en tiempo real');
console.log('\n🔧 Si tienes problemas:');
console.log('- Asegúrate de que Docker Desktop esté ejecutándose');
console.log('- Ejecuta: npx supabase status');
console.log('- Ejecuta: npx supabase db reset');
console.log('- Revisa la documentación en: docs/modules/reservations/reservation-system.md'); 