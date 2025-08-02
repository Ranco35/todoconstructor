#!/usr/bin/env node

/**
 * Script para probar la página básica que debe funcionar 100%
 */

const https = require('https');

const LATEST_URL = 'https://admintermas-nhn8jolru-eduardo-probostes-projects.vercel.app';

console.log('🎯 PROBANDO PÁGINA BÁSICA - DEBE FUNCIONAR');
console.log('==========================================\n');

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
          hasHTML: data.includes('<html>') || data.includes('<div'),
          hasTitle: data.includes('FUNCIONA') || data.includes('Admintermas'),
          hasBasicContent: data.includes('Vercel: Funcionando'),
          contentLength: data.length,
          snippet: data.length < 200 ? data : data.substring(0, 200) + '...'
        };
        
        console.log(`   Status: ${result.status} ${result.ok ? '✅' : '❌'}`);
        console.log(`   Content-Type: ${result.contentType}`);
        console.log(`   Has Content: ${result.hasHTML ? '✅' : '❌'}`);
        console.log(`   Basic Page: ${result.hasBasicContent ? '✅' : '❌'}`);
        console.log(`   Size: ${result.contentLength} bytes`);
        
        if (result.ok && (result.hasHTML || result.hasBasicContent)) {
          console.log(`   🎉 ¡ÉXITO! Esta página está funcionando`);
        } else {
          console.log(`   📄 Snippet: ${result.snippet}`);
        }
        
        console.log('');
        resolve(result);
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}\n`);
      resolve({ path, status: 'ERROR', ok: false, error: error.message });
    });
    
    req.setTimeout(15000, () => {
      req.destroy();
      console.log(`   ⏱️ Timeout después de 15s\n`);
      resolve({ path, status: 'TIMEOUT', ok: false });
    });
    
    req.end();
  });
}

async function testBasicPage() {
  const testPaths = [
    '/basic',        // Nuestra página ultra básica (DEBE funcionar)
    '/',             // Página principal  
    '/test-simple',  // Página de prueba
    '/login',        // Login
    '/dashboard'     // Dashboard
  ];
  
  console.log('🎯 Probando en orden de prioridad...\n');
  
  let successCount = 0;
  
  for (const path of testPaths) {
    const result = await testURL(LATEST_URL, path);
    
    if (result.ok && (result.hasHTML || result.hasBasicContent)) {
      successCount++;
      console.log(`🎊 ¡RUTA FUNCIONANDO! ${LATEST_URL}${path}`);
      
      if (result.hasBasicContent) {
        console.log('✅ Página básica confirmada - ¡Vercel está funcionando!\n');
      } else {
        console.log('✅ Página con contenido HTML válido\n');
      }
    }
  }
  
  console.log('📊 RESULTADO FINAL:');
  console.log(`✅ Rutas funcionando: ${successCount}/${testPaths.length}`);
  
  if (successCount > 0) {
    console.log('\n🎉 ¡ÉXITO CONFIRMADO!');
    console.log('✅ Vercel puede servir contenido');
    console.log('✅ El problema de protección se resolvió');
    console.log('✅ Next.js está funcionando');
    console.log(`\n🌐 ABRE EN TU NAVEGADOR:`);
    console.log(`   ${LATEST_URL}/basic`);
    console.log(`   ${LATEST_URL}`);
  } else {
    console.log('\n❌ AÚN HAY PROBLEMAS');
    console.log('💡 Si esto falla, el problema es más fundamental');
    console.log('🔄 Puede necesitar unos minutos para propagarse');
    console.log('⏰ Intenta abrir manualmente en el navegador');
  }
}

testBasicPage(); 