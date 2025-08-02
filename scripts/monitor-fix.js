#!/usr/bin/env node

/**
 * Script para monitorear la solución del problema de protección 401
 * Verifica cada 30 segundos si la protección fue desactivada
 */

const https = require('https');

console.log('👀 MONITOR DE SOLUCIÓN - ADMINTERMAS');
console.log('===================================\n');

const BASE_URL = 'https://admintermas-ffo5jkxm4-eduardo-probostes-projects.vercel.app';
let checkCount = 0;
const MAX_CHECKS = 20; // 10 minutos máximo

function quickCheck(url) {
  return new Promise((resolve) => {
    const req = https.request(url, (res) => {
      resolve({ 
        status: res.statusCode, 
        ok: res.statusCode < 400,
        headers: res.headers 
      });
    });
    req.on('error', () => resolve({ status: 'ERROR', ok: false }));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ status: 'TIMEOUT', ok: false });
    });
    req.end();
  });
}

async function checkStatus() {
  checkCount++;
  const timestamp = new Date().toLocaleTimeString();
  
  console.log(`🔍 Check #${checkCount} - ${timestamp}`);
  
  try {
    const result = await quickCheck(BASE_URL);
    
    if (result.ok) {
      console.log(`🎉 ¡SOLUCIONADO! Status: ${result.status}`);
      console.log(`✅ La protección ha sido desactivada exitosamente`);
      console.log(`🌐 URL funcionando: ${BASE_URL}`);
      
      // Verificar también login y dashboard
      console.log('\n🔍 Verificando otras URLs...');
      const loginResult = await quickCheck(`${BASE_URL}/login`);
      const dashboardResult = await quickCheck(`${BASE_URL}/dashboard`);
      
      console.log(`📋 Login: ${loginResult.status} ${loginResult.ok ? '✅' : '❌'}`);
      console.log(`📋 Dashboard: ${dashboardResult.status} ${dashboardResult.ok ? '✅' : '❌'}`);
      
      console.log('\n🚀 PRÓXIMOS PASOS:');
      console.log('1. Probar la aplicación en el navegador');
      console.log('2. Verificar login y funcionalidades');
      console.log('3. Ejecutar: node scripts/verify-vercel-deployment.js');
      
      return true; // Éxito - detener monitoreo
    } else {
      console.log(`⏳ Aún protegido - Status: ${result.status}`);
      
      // Verificar si hay cookies de protección
      if (result.headers && result.headers['set-cookie']) {
        const hasSsoNonce = result.headers['set-cookie'].some(cookie => 
          cookie.includes('_vercel_sso_nonce')
        );
        if (hasSsoNonce) {
          console.log('🔐 Protección Vercel SSO aún activa');
        }
      }
      
      return false; // Continuar monitoreando
    }
  } catch (error) {
    console.log(`❌ Error en verificación: ${error.message}`);
    return false;
  }
}

async function monitor() {
  console.log(`🎯 Monitoreando: ${BASE_URL}`);
  console.log(`⏱️  Verificando cada 30 segundos (máximo ${MAX_CHECKS} checks)`);
  console.log('⚡ Presiona Ctrl+C para detener\n');
  
  const isFixed = await checkStatus();
  
  if (isFixed) {
    console.log('\n🎊 MONITOREO COMPLETADO - PROBLEMA RESUELTO');
    process.exit(0);
  }
  
  if (checkCount >= MAX_CHECKS) {
    console.log('\n⏰ Tiempo límite alcanzado');
    console.log('💡 Revisa si completaste los pasos en el dashboard de Vercel');
    console.log('🔗 Dashboard: https://vercel.com/eduardo-probostes-projects/admintermas/settings');
    process.exit(1);
  }
  
  // Continuar monitoreando
  setTimeout(() => {
    monitor();
  }, 30000); // 30 segundos
}

// Información inicial
console.log('📋 ESTADO ACTUAL:');
console.log('  ❌ Error 401 "Authentication Required"');
console.log('  🔐 Vercel Deployment Protection activada');
console.log('  ⚡ Esperando desactivación desde dashboard\n');

console.log('📝 RECORDATORIO:');
console.log('  1. Ve al dashboard que se abrió automáticamente');
console.log('  2. Busca "Deployment Protection" en Settings');
console.log('  3. Desactiva la protección por password');
console.log('  4. Guarda los cambios\n');

// Iniciar monitoreo
monitor(); 