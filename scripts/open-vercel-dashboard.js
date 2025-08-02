#!/usr/bin/env node

/**
 * Script para abrir automáticamente el dashboard de Vercel
 * y proporcionar instrucciones específicas para desactivar la protección
 */

const { execSync } = require('child_process');
const os = require('os');

console.log('🚀 ABRIENDO DASHBOARD DE VERCEL - SOLUCIÓN DIRECTA');
console.log('================================================\n');

function openURL(url) {
  const platform = os.platform();
  let command;
  
  switch (platform) {
    case 'darwin': // macOS
      command = `open "${url}"`;
      break;
    case 'win32': // Windows
      command = `start "" "${url}"`;
      break;
    case 'linux': // Linux
      command = `xdg-open "${url}"`;
      break;
    default:
      console.log(`⚠️  No se puede abrir automáticamente en ${platform}`);
      console.log(`🔗 Abre manualmente: ${url}`);
      return false;
  }
  
  try {
    execSync(command);
    return true;
  } catch (error) {
    console.log(`❌ Error abriendo URL: ${error.message}`);
    console.log(`🔗 Abre manualmente: ${url}`);
    return false;
  }
}

function openVercelDashboard() {
  console.log('🎯 PROBLEMA: Error 401 "Authentication Required"');
  console.log('🔐 CAUSA: Vercel Deployment Protection activada');
  console.log('✅ SOLUCIÓN: Desactivar protección desde dashboard\n');
  
  const urls = [
    {
      name: 'Configuración del Proyecto',
      url: 'https://vercel.com/eduardo-probostes-projects/admintermas/settings',
      description: 'Settings del proyecto admintermas'
    },
    {
      name: 'Configuración del Team',
      url: 'https://vercel.com/teams/eduardo-probostes-projects/settings',
      description: 'Settings del team eduardo-probostes-projects'
    }
  ];
  
  console.log('🌐 ABRIENDO DASHBOARDS DE VERCEL...\n');
  
  for (const { name, url, description } of urls) {
    console.log(`📋 ${name}:`);
    console.log(`   ${description}`);
    console.log(`   🔗 ${url}`);
    
    if (openURL(url)) {
      console.log(`   ✅ Abierto en el navegador`);
    }
    console.log('');
  }
  
  console.log('📝 INSTRUCCIONES PASO A PASO:\n');
  
  console.log('🔧 EN EL DASHBOARD DEL PROYECTO:');
  console.log('  1. Busca la sección "Deployment Protection"');
  console.log('  2. Busca "Password Protection" o "Vercel Authentication"');
  console.log('  3. DESACTIVA cualquier toggle/checkbox de protección');
  console.log('  4. Guarda los cambios\n');
  
  console.log('🔧 EN EL DASHBOARD DEL TEAM (si es necesario):');
  console.log('  1. Ve a "Security" o "Deployment Protection"');
  console.log('  2. Revisa configuración de protección automática');
  console.log('  3. Desactiva protección para nuevos deployments\n');
  
  console.log('✅ VERIFICACIÓN DESPUÉS DE LOS CAMBIOS:');
  console.log('  node scripts/quick-verify.js');
  console.log('  # Debería mostrar status 200 en lugar de 401\n');
  
  console.log('🎯 URLs PARA VERIFICAR:');
  console.log('  https://admintermas-ffo5jkxm4-eduardo-probostes-projects.vercel.app');
  console.log('  https://admintermas-ffo5jkxm4-eduardo-probostes-projects.vercel.app/login');
  console.log('  https://admintermas-ffo5jkxm4-eduardo-probostes-projects.vercel.app/dashboard\n');
  
  console.log('⏱️  TIEMPO ESTIMADO: 2-5 minutos');
  console.log('🎉 Una vez desactivada la protección, ¡la aplicación funcionará perfectamente!');
}

openVercelDashboard(); 