const https = require('https');

const NEW_URL = 'https://admintermas-2xfpzgbo4-eduardo-probostes-projects.vercel.app';

console.log('🔧 VERIFICACIÓN DE ARCHIVOS JAVASCRIPT CORREGIDOS');
console.log('===============================================');
console.log(`🎯 URL: ${NEW_URL}`);
console.log('');

async function testJSFiles() {
  // Probar un archivo JS específico
  const jsTestUrl = `${NEW_URL}/_next/static/chunks/1684-b5376ee246a13ee1.js`;
  
  return new Promise((resolve) => {
    console.log('🔍 Probando archivo JavaScript...');
    
    const req = https.request(jsTestUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const status = res.statusCode;
        const contentType = res.headers['content-type'] || '';
        
        console.log(`📊 RESULTADO ARCHIVO JS:`);
        console.log(`   Status: ${status} ${status === 200 ? '✅' : '❌'}`);
        console.log(`   Content-Type: ${contentType}`);
        console.log(`   Tamaño: ${data.length} bytes`);
        console.log('');
        
        // Verificar si es JavaScript válido
        const isJS = contentType.includes('javascript') || contentType.includes('text/plain');
        const startsWithHTML = data.trim().startsWith('<');
        const hasJSContent = data.includes('function') || data.includes('=>') || data.includes('var');
        
        console.log(`🔬 ANÁLISIS DEL ARCHIVO:`);
        console.log(`   ✅ Content-Type correcto: ${isJS ? 'SÍ' : 'NO'}`);
        console.log(`   ❌ Empieza con HTML: ${startsWithHTML ? 'SÍ - PROBLEMA' : 'NO - BIEN'}`);
        console.log(`   ✅ Contiene JS: ${hasJSContent ? 'SÍ - BIEN' : 'NO - PROBLEMA'}`);
        console.log('');
        
        if (status === 200 && !startsWithHTML && hasJSContent) {
          console.log('🎉 ¡ARCHIVOS JAVASCRIPT CORREGIDOS!');
          console.log('   ✅ Los archivos .js ahora sirven JavaScript correctamente');
          console.log('   ✅ El problema de SyntaxError está RESUELTO');
        } else {
          console.log('❌ Los archivos JS aún tienen problemas');
          if (startsWithHTML) {
            console.log('   - Aún devuelven HTML en lugar de JS');
          }
        }
        
        resolve({ 
          status, 
          working: status === 200 && !startsWithHTML && hasJSContent,
          isJS: !startsWithHTML && hasJSContent
        });
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Error: ${error.message}`);
      resolve({ status: 'ERROR', working: false });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`⏱️ Timeout`);
      resolve({ status: 'TIMEOUT', working: false });
    });
    
    req.end();
  });
}

async function testDashboard() {
  return new Promise((resolve) => {
    const dashboardUrl = `${NEW_URL}/dashboard`;
    console.log('🏠 Probando dashboard...');
    
    const req = https.request(dashboardUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const status = res.statusCode;
        const hasHTML = data.includes('<html>');
        const hasDashboard = data.includes('Dashboard Admintermas') || data.includes('dashboard');
        
        console.log(`📊 RESULTADO DASHBOARD:`);
        console.log(`   Status: ${status} ${status === 200 ? '✅' : '❌'}`);
        console.log(`   HTML válido: ${hasHTML ? '✅' : '❌'}`);
        console.log(`   Contenido dashboard: ${hasDashboard ? '✅' : '❌'}`);
        
        resolve({ 
          status, 
          working: status === 200 && hasHTML,
          hasDashboard 
        });
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Error dashboard: ${error.message}`);
      resolve({ status: 'ERROR', working: false });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`⏱️ Timeout dashboard`);
      resolve({ status: 'TIMEOUT', working: false });
    });
    
    req.end();
  });
}

async function runTests() {
  const jsResult = await testJSFiles();
  const dashboardResult = await testDashboard();
  
  console.log('');
  console.log('📋 RESUMEN FINAL:');
  console.log('=================');
  
  if (jsResult.working && dashboardResult.working) {
    console.log('🎉 ¡TODO FUNCIONANDO PERFECTAMENTE!');
    console.log('   ✅ Archivos JavaScript corregidos');
    console.log('   ✅ Dashboard carga correctamente');
    console.log('   ✅ Problema de SyntaxError RESUELTO');
    console.log('');
    console.log('🔗 URL FUNCIONAL:');
    console.log(`   ${NEW_URL}/dashboard`);
  } else {
    console.log('🔧 Algunos problemas persisten:');
    if (!jsResult.working) console.log('   - Archivos JS necesitan corrección');
    if (!dashboardResult.working) console.log('   - Dashboard necesita corrección');
  }
}

runTests().catch(console.error); 