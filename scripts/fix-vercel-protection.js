#!/usr/bin/env node

/**
 * Script para diagnosticar y solucionar el problema de 
 * protección por password en Vercel
 * 
 * Problema: Error 401 "Authentication Required" en todas las rutas
 * Causa: Vercel tiene configurada protección por password/SSO
 */

const { execSync } = require('child_process');

console.log('🔐 SOLUCIONADOR DE PROTECCIÓN VERCEL - ADMINTERMAS');
console.log('=================================================\n');

function runCommand(command, description) {
  console.log(`🔍 ${description}...`);
  try {
    const result = execSync(command, { encoding: 'utf8' });
    console.log(result);
    return result;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

function fixVercelProtection() {
  console.log('🎯 PROBLEMA IDENTIFICADO:');
  console.log('  Error 401 "Authentication Required" en todas las rutas');
  console.log('  Cookies _vercel_sso_nonce detectadas');
  console.log('  Vercel tiene protección activada\n');
  
  // 1. Ver configuración actual del proyecto
  console.log('1. 📋 VERIFICANDO CONFIGURACIÓN DEL PROYECTO\n');
  
  const projectInfo = runCommand('vercel project ls', 'Listando proyectos');
  
  // 2. Intentar obtener información específica del proyecto
  console.log('\n2. 🔧 VERIFICANDO PROTECCIÓN DEL PROYECTO\n');
  
  // Intentar diferentes comandos para ver la configuración de protección
  const commands = [
    'vercel project --help',
    'vercel domains',
    'vercel alias'
  ];
  
  for (const cmd of commands) {
    runCommand(cmd, `Ejecutando: ${cmd}`);
    console.log('');
  }
  
  console.log('3. 🚀 SOLUCIONES PASO A PASO:\n');
  
  console.log('📝 OPCIÓN 1 - DESACTIVAR PROTECCIÓN DESDE DASHBOARD:');
  console.log('  1. Ve a: https://vercel.com/eduardo-probostes-projects/admintermas');
  console.log('  2. Ve a la pestaña "Settings"');
  console.log('  3. Busca "Password Protection" o "Deployment Protection"');
  console.log('  4. Desactiva la protección por password');
  console.log('  5. Guarda los cambios\n');
  
  console.log('📝 OPCIÓN 2 - VERIFICAR PROTECCIÓN DESDE CLI:');
  console.log('  vercel env ls                    # Ver variables protegidas');
  console.log('  vercel secrets ls                # Ver secretos');
  console.log('  vercel domains                   # Ver configuración de dominios\n');
  
  console.log('📝 OPCIÓN 3 - REDEPLOY SIN PROTECCIÓN:');
  console.log('  vercel --prod --force            # Nuevo deployment');
  console.log('  # Asegúrate de no tener variables que activen protección\n');
  
  console.log('📝 OPCIÓN 4 - VERIFICAR TEAM SETTINGS:');
  console.log('  1. Ve a: https://vercel.com/teams/eduardo-probostes-projects/settings');
  console.log('  2. Revisa "Deployment Protection"');
  console.log('  3. Desactiva protección automática\n');
  
  console.log('🔍 COMANDOS DE VERIFICACIÓN:');
  console.log('  curl -I https://admintermas-ffo5jkxm4-eduardo-probostes-projects.vercel.app');
  console.log('  # Debería devolver 200 en lugar de 401\n');
  
  console.log('📊 INFORMACIÓN DETECTADA:');
  console.log('  🌐 URL Problemática: https://admintermas-ffo5jkxm4-eduardo-probostes-projects.vercel.app');
  console.log('  ❌ Status Actual: 401 Authentication Required');
  console.log('  🎯 Status Esperado: 200 OK');
  console.log('  🔐 Causa: Vercel Deployment Protection activada');
  
  console.log('\n⚡ PRÓXIMOS PASOS RECOMENDADOS:');
  console.log('1. Abrir el dashboard de Vercel en el navegador');
  console.log('2. Ir a configuración del proyecto admintermas');
  console.log('3. Desactivar cualquier protección por password');
  console.log('4. Ejecutar: node scripts/quick-verify.js');
  console.log('5. Verificar que las URLs devuelvan 200 en lugar de 401');
  
  console.log('\n🎉 Una vez desactivada la protección, la aplicación funcionará correctamente');
  console.log('   sin necesidad de más cambios en el código.');
}

// Ejecutar el solucionador
fixVercelProtection(); 