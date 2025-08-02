#!/usr/bin/env node

/**
 * Script para probar la URL más reciente con página de prueba
 */

const https = require('https');

const LATEST_URL = 'https://admintermas-mrglg13vq-eduardo-probostes-projects.vercel.app';

console.log('🧪 PROBANDO URL MÁS RECIENTE');
console.log('===========================\n');
console.log(`🎯 URL: ${LATEST_URL}\n`);

function testURL(url, path = '') {
  const fullUrl = url + path;
  return new Promise((resolve) => {
    console.log(`🔍 Probando: ${fullUrl}`);
    
    const req = https.request(fullUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const result = {
          path,
          status: res.statusCode,
          ok: res.statusCode < 400,
          contentType: res.headers['content-type'] || 'unknown',
          hasHTML: data.includes('<html>'),
          hasTitle: data.includes('<title>'),
          hasAdmintermas: data.includes('Admintermas') || data.includes('Admin Termas'),
          hasTestPage: data.includes('Test Simple'),
          contentLength: data.length,
          content: data.length < 500 ? data : data.substring(0, 400) + '...'
        };
        
        console.log(`   Status: ${result.status} ${result.ok ? '✅' : '❌'}`);
        console.log(`   Content-Type: ${result.contentType}`);
        console.log(`   HTML: ${result.hasHTML ? '✅' : '❌'}`);
        console.log(`   Title: ${result.hasTitle ? '✅' : '❌'}`);
        console.log(`   Admintermas: ${result.hasAdmintermas ? '✅' : '❌'}`);
        console.log(`   Test Page: ${result.hasTestPage ? '✅' : '❌'}`);
        console.log(`   Size: ${result.contentLength} bytes`);
        
        if (result.ok && result.hasHTML) {
          console.log(`   🎉 ¡FUNCIONA! Contenido HTML válido servido`);
        } else if (!result.ok) {
          console.log(`   📄 Content: ${result.content}`);
        }
        
        console.log('');
        resolve(result);
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}\n`);
      resolve({ path, status: 'ERROR', ok: false, error: error.message });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`   ⏱️ Timeout\n`);
      resolve({ path, status: 'TIMEOUT', ok: false });
    });
    
    req.end();
  });
}

async function testLatestURL() {
  const paths = [
    '/test-simple',  // Nuestra página de prueba (debería funcionar)
    '',              // Página principal
    '/login',        // Login
    '/dashboard',    // Dashboard
    '/api/test'      // API de prueba
  ];
  
  console.log('🎯 Probando todas las rutas incluyendo página de prueba...\n');
  
  let hasWorking = false;
  
  for (const path of paths) {
    const result = await testURL(LATEST_URL, path);
    
    if (result.ok && result.hasHTML) {
      hasWorking = true;
      console.log(`🎉 ¡RUTA FUNCIONANDO! ${LATEST_URL}${path}`);
      
      if (result.hasTestPage) {
        console.log('✅ Página de prueba funcionando - Vercel puede servir contenido\n');
      } else if (result.hasAdmintermas) {
        console.log('✅ Aplicación principal funcionando\n');
      }
    }
  }
  
  if (hasWorking) {
    console.log('🚀 RESULTADO POSITIVO:');
    console.log('✅ Al menos una ruta está funcionando');
    console.log('✅ Vercel puede servir contenido HTML');
    console.log('✅ El problema de protección se resolvió');
    console.log(`\n🌐 Abre en el navegador: ${LATEST_URL}`);
    console.log('🔄 Si la página principal aún da 404, usa: /test-simple');
  } else {
    console.log('❌ PROBLEMA PERSISTENTE:');
    console.log('⚠️ Ninguna ruta está funcionando');
    console.log('💡 Esto indica un problema de configuración de Vercel');
    console.log('🔄 Puede necesitar unos minutos para propagarse');
  }
}

testLatestURL(); 