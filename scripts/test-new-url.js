#!/usr/bin/env node

/**
 * Script para probar la nueva URL específica
 */

const https = require('https');

const NEW_URL = 'https://admintermas-9j73k3g0f-eduardo-probostes-projects.vercel.app';

console.log('🧪 PROBANDO NUEVA URL DE DEPLOYMENT');
console.log('=================================\n');
console.log(`🎯 URL: ${NEW_URL}\n`);

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
          hasLogin: data.includes('login') || data.includes('Login'),
          contentLength: data.length,
          content: data.length < 500 ? data : data.substring(0, 300) + '...'
        };
        
        console.log(`   Status: ${result.status} ${result.ok ? '✅' : '❌'}`);
        console.log(`   Content-Type: ${result.contentType}`);
        console.log(`   HTML: ${result.hasHTML ? '✅' : '❌'}`);
        console.log(`   Title: ${result.hasTitle ? '✅' : '❌'}`);
        console.log(`   Admintermas: ${result.hasAdmintermas ? '✅' : '❌'}`);
        console.log(`   Size: ${result.contentLength} bytes`);
        
        if (!result.ok) {
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

async function testNewURL() {
  const paths = ['', '/login', '/dashboard', '/api/test'];
  
  console.log('🎯 Probando múltiples rutas...\n');
  
  for (const path of paths) {
    const result = await testURL(NEW_URL, path);
    
    if (result.ok && result.hasHTML && result.hasAdmintermas) {
      console.log(`🎉 ¡FUNCIONA! ${NEW_URL}${path}`);
      console.log('✅ La aplicación está sirviendo contenido correcto\n');
      
      console.log('🚀 PRÓXIMOS PASOS:');
      console.log(`1. Abre: ${NEW_URL}`);
      console.log('2. Verifica redirección automática');
      console.log('3. Prueba login con tus credenciales');
      console.log('4. Accede al dashboard');
      return;
    }
  }
  
  console.log('⚠️ Ninguna ruta está funcionando correctamente');
  console.log('💡 Puede necesitar unos minutos para propagarse');
  console.log('🔄 Intenta de nuevo en 1-2 minutos');
}

testNewURL(); 