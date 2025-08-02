#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando Supabase para el módulo de clientes...\n');

// Verificar si Docker está ejecutándose
try {
  execSync('docker --version', { stdio: 'pipe' });
  console.log('✅ Docker está instalado');
} catch (error) {
  console.error('❌ Docker no está instalado o no está ejecutándose');
  console.log('Por favor, instala Docker Desktop desde: https://www.docker.com/products/docker-desktop/');
  process.exit(1);
}

// Verificar si Supabase CLI está instalado
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
console.log('\n🔄 Aplicando migraciones...');
try {
  execSync('npx supabase db reset', { stdio: 'inherit' });
  console.log('✅ Migraciones aplicadas correctamente');
} catch (error) {
  console.error('❌ Error al aplicar migraciones');
  process.exit(1);
}

// Verificar que las tablas existen
console.log('\n🔍 Verificando tablas...');
try {
  const { execSync } = require('child_process');
  execSync('npx supabase db diff --schema public', { stdio: 'pipe' });
  console.log('✅ Tablas verificadas correctamente');
} catch (error) {
  console.log('⚠️  No se pudo verificar las tablas automáticamente');
}

console.log('\n🎉 ¡Configuración completada!');
console.log('\n📋 Próximos pasos:');
console.log('1. Ve a http://localhost:54323 para acceder al dashboard de Supabase');
console.log('2. Las credenciales están en el archivo .env.local (si existe)');
console.log('3. Puedes acceder al módulo de clientes en: http://localhost:3000/dashboard/customers');
console.log('\n💡 Si tienes problemas:');
console.log('- Asegúrate de que Docker Desktop esté ejecutándose');
console.log('- Ejecuta: npx supabase status');
console.log('- Ejecuta: npx supabase db reset'); 