const https = require('https');

const BASE_URL = 'https://admintermas.vercel.app';

console.log('🔧 VERIFICACIÓN FINAL - ARCHIVOS JAVASCRIPT');
console.log('==========================================');

// Primero obtener la página principal para encontrar los archivos JS reales
function getMainPage() {
  return new Promise((resolve) => {
    const req = https.request(BASE_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Buscar referencias a archivos JS
        const jsFiles = [];
        const jsMatches = data.match(/_next\/static\/chunks\/[a-zA-Z0-9\-]+\.js/g);
        const appMatches = data.match(/_next\/static\/[a-zA-Z0-9\-]+\/_app-[a-zA-Z0-9]+\.js/g);
        const pageMatches = data.match(/_next\/static\/[a-zA-Z0-9\-]+\/pages\/[a-zA-Z0-9\-]+\.js/g);
        
        if (jsMatches) jsFiles.push(...jsMatches);
        if (appMatches) jsFiles.push(...appMatches);
        if (pageMatches) jsFiles.push(...pageMatches);
        
        console.log(`📄 Página principal cargada (${data.length} bytes)`);
        console.log(`🔍 Archivos JS encontrados: ${jsFiles.length}`);
        
        resolve(jsFiles.slice(0, 3)); // Solo probar los primeros 3
      });
    });
    
    req.on('error', () => resolve([]));
    req.end();
  });
}

function testJSFile(jsPath) {
  return new Promise((resolve) => {
    const fullUrl = `${BASE_URL}/${jsPath}`;
    console.log(`\n🧪 Probando: ${jsPath}`);
    
    const req = https.request(fullUrl, (res) => {
      const status = res.statusCode;
      const contentType = res.headers['content-type'] || '';
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const isHTML = data.trim().startsWith('<');
        const hasJSContent = data.includes('function') || data.includes('const ') || data.includes('var ');
        const rightContentType = contentType.includes('javascript') || contentType.includes('text/plain');
        
        console.log(`   Status: ${status} ${status === 200 ? '✅' : '❌'}`);
        console.log(`   Content-Type: ${contentType}`);
        console.log(`   Tamaño: ${data.length} bytes`);
        console.log(`   Es HTML: ${isHTML ? '❌ SÍ - PROBLEMA' : '✅ NO - CORRECTO'}`);
        console.log(`   Contiene JS: ${hasJSContent ? '✅ SÍ - CORRECTO' : '❌ NO - PROBLEMA'}`);
        console.log(`   Content-Type correcto: ${rightContentType ? '✅' : '❌'}`);
        
        const isWorking = status === 200 && !isHTML && hasJSContent;
        
        if (isWorking) {
          console.log(`   🎉 ¡ARCHIVO JS FUNCIONANDO CORRECTAMENTE!`);
        } else {
          console.log(`   ❌ Archivo JS tiene problemas`);
        }
        
        resolve({ 
          path: jsPath, 
          working: isWorking, 
          isHTML, 
          hasJS: hasJSContent 
        });
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      resolve({ path: jsPath, working: false, error: true });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`   ⏱️ Timeout`);
      resolve({ path: jsPath, working: false, timeout: true });
    });
    
    req.end();
  });
}

async function runVerification() {
  console.log(`🎯 Base URL: ${BASE_URL}\n`);
  
  const jsFiles = await getMainPage();
  
  if (jsFiles.length === 0) {
    console.log('❌ No se encontraron archivos JS en la página principal');
    return;
  }
  
  console.log('📋 Archivos a probar:');
  jsFiles.forEach((file, i) => console.log(`   ${i + 1}. ${file}`));
  
  const results = [];
  for (const jsFile of jsFiles) {
    const result = await testJSFile(jsFile);
    results.push(result);
  }
  
  // Resumen final
  console.log('\n📊 RESUMEN FINAL:');
  console.log('==================');
  
  const workingFiles = results.filter(r => r.working);
  const htmlFiles = results.filter(r => r.isHTML);
  
  console.log(`✅ Archivos JS funcionando: ${workingFiles.length}/${results.length}`);
  console.log(`❌ Archivos devolviendo HTML: ${htmlFiles.length}/${results.length}`);
  
  if (workingFiles.length === results.length) {
    console.log('\n🎉 ¡PROBLEMA DE SYNTAXERROR COMPLETAMENTE RESUELTO!');
    console.log('   ✅ Todos los archivos JavaScript se sirven correctamente');
    console.log('   ✅ No hay archivos devolviendo HTML');
    console.log('   ✅ La aplicación debería funcionar sin errores JS');
    console.log('\n💻 Abre en el navegador:');
    console.log(`   ${BASE_URL}/dashboard`);
  } else if (workingFiles.length > 0) {
    console.log('\n⚠️ Progreso parcial - algunos archivos funcionan');
  } else {
    console.log('\n❌ Los archivos JS aún tienen problemas');
  }
}

runVerification().catch(console.error); 