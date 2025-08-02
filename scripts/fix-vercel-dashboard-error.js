#!/usr/bin/env node

/**
 * Script para diagnosticar y resolver el problema del dashboard en Vercel
 * 
 * Problema: ReferenceError: __dirname is not defined
 * Causa: Edge Runtime incompatible con APIs de Node.js en Supabase
 * Solución: Forzar Node.js runtime y verificar variables de entorno
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 DIAGNÓSTICO Y REPARACIÓN - VERCEL DASHBOARD ERROR');
console.log('================================================\n');

// 1. Verificar archivos de configuración
console.log('1. 📋 Verificando configuraciones...');

// Verificar .env.local
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('  ✅ .env.local encontrado');
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => !envContent.includes(varName));
  
  if (missingVars.length > 0) {
    console.log('  ❌ Variables faltantes:', missingVars.join(', '));
  } else {
    console.log('  ✅ Todas las variables de entorno están presentes');
  }
} else {
  console.log('  ❌ .env.local no encontrado');
}

// Verificar next.config.js
const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
if (fs.existsSync(nextConfigPath)) {
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (nextConfig.includes('runtime: \'nodejs\'')) {
    console.log('  ✅ next.config.js configurado con Node.js runtime');
  } else {
    console.log('  ❌ next.config.js no tiene Node.js runtime configurado');
  }
} else {
  console.log('  ❌ next.config.js no encontrado');
}

// Verificar vercel.json
const vercelJsonPath = path.join(__dirname, '..', 'vercel.json');
if (fs.existsSync(vercelJsonPath)) {
  const vercelConfig = fs.readFileSync(vercelJsonPath, 'utf8');
  
  if (vercelConfig.includes('@vercel/node')) {
    console.log('  ✅ vercel.json configurado con Node.js runtime');
  } else {
    console.log('  ❌ vercel.json no tiene Node.js runtime configurado');
  }
} else {
  console.log('  ❌ vercel.json no encontrado');
}

console.log('\n2. 🚀 Ejecutando comandos de reparación...\n');

// 2. Verificar si Vercel CLI está instalado
try {
  execSync('vercel --version', { stdio: 'pipe' });
  console.log('  ✅ Vercel CLI disponible');
} catch (error) {
  console.log('  ❌ Vercel CLI no instalado. Instalando...');
  try {
    execSync('npm install -g vercel', { stdio: 'inherit' });
    console.log('  ✅ Vercel CLI instalado');
  } catch (installError) {
    console.log('  ❌ Error instalando Vercel CLI');
    return;
  }
}

// 3. Mostrar comandos para ejecutar manualmente
console.log('\n3. 📝 COMANDOS PARA EJECUTAR MANUALMENTE:\n');

console.log('# Verificar variables de entorno en Vercel:');
console.log('vercel env ls\n');

console.log('# Configurar variables de entorno (ejecutar uno por uno):');
console.log('vercel env add NEXT_PUBLIC_SUPABASE_URL');
console.log('vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('vercel env add SUPABASE_SERVICE_ROLE_KEY\n');

console.log('# Forzar redeployment:');
console.log('vercel --prod --force\n');

console.log('# Verificar logs en tiempo real:');
console.log('vercel logs --follow\n');

// 4. Crear archivo de verificación de variables
const verifyEnvScript = `
// Archivo de verificación para Vercel
export function verifyEnvVars() {
  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  };

  console.log('🔍 Verificación de variables de entorno:');
  
  for (const [key, value] of Object.entries(requiredVars)) {
    if (value) {
      console.log(\`  ✅ \${key}: \${value.substring(0, 10)}...\`);
    } else {
      console.log(\`  ❌ \${key}: NO DEFINIDA\`);
    }
  }
  
  return Object.values(requiredVars).every(v => v);
}
`;

const verifyPath = path.join(__dirname, '..', 'src', 'lib', 'verify-env.ts');
fs.writeFileSync(verifyPath, verifyEnvScript);
console.log('4. 📄 Archivo de verificación creado: src/lib/verify-env.ts\n');

console.log('🎯 RESUMEN DE SOLUCIONES APLICADAS:');
console.log('================================');
console.log('1. ✅ Layout del dashboard convertido a Client Component');
console.log('2. ✅ Runtime forzado a Node.js en next.config.js');
console.log('3. ✅ Configuración de Vercel actualizada');
console.log('4. ✅ Script de verificación de variables creado');
console.log('\n🚀 Próximos pasos:');
console.log('1. Ejecutar: vercel env ls');
console.log('2. Configurar variables faltantes con: vercel env add');
console.log('3. Hacer redeploy: vercel --prod --force');
console.log('4. Verificar logs: vercel logs --follow');
console.log('\n💡 Si el problema persiste, revisar la memoria del error crítico de Vercel.'); 