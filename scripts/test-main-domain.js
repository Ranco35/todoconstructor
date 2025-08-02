const https = require('https');

// URL principal que funcionaba
const MAIN_URL = 'https://admintermas.vercel.app';

console.log('🔍 Verificando dominio principal...');
console.log(`🎯 ${MAIN_URL}`);

function testURL(url, label) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Probando ${label}: ${url}`);
    
    const req = https.request(url, { timeout: 15000 }, (res) => {
      console.log(`   Status: ${res.statusCode} ${res.statusCode === 200 ? '✅' : '❌'}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   Tamaño: ${data.length} bytes`);
        
        // Verificar si devuelve HTML válido
        const isHTML = data.includes('<html>') || data.includes('<!DOCTYPE');
        const hasApp = data.includes('Admintermas') || data.includes('Cargando') || data.includes('Inicializando');
        
        console.log(`   HTML válido: ${isHTML ? '✅' : '❌'}`);
        console.log(`   Contenido app: ${hasApp ? '✅' : '❌'}`);
        
        if (res.statusCode === 200) {
          console.log(`   🎉 ${label} FUNCIONANDO`);
        }
        
        resolve({ status: res.statusCode, working: res.statusCode === 200 && isHTML });
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      resolve({ status: 'ERROR', working: false });
    });
    
    req.on('timeout', () => {
      console.log(`   ⏱️ Timeout`);
      req.destroy();
      resolve({ status: 'TIMEOUT', working: false });
    });
    
    req.end();
  });
}

async function runTests() {
  // Probar la URL principal
  const mainResult = await testURL(MAIN_URL, 'Dominio Principal');
  
  // Probar dashboard si el principal funciona
  if (mainResult.working) {
    const dashboardResult = await testURL(`${MAIN_URL}/dashboard`, 'Dashboard Principal');
    
    if (dashboardResult.working) {
      console.log('\n🎉 ¡DOMINIO PRINCIPAL FUNCIONANDO!');
      console.log('💡 Prueba en el navegador:');
      console.log(`   ${MAIN_URL}/dashboard`);
      
      // Ahora probar la nueva URL
      console.log('\n🔍 Probando nueva URL...');
      const newResult = await testURL('https://admintermas-2xfpzgbo4-eduardo-probostes-projects.vercel.app', 'Nueva URL');
      
      if (newResult.working) {
        console.log('🎉 ¡Nueva URL también funciona!');
      } else {
        console.log('⚠️ Nueva URL aún no está lista, pero la principal funciona');
      }
    }
  } else {
    console.log('\n❌ Problemas con el dominio principal también');
  }
}

runTests().catch(console.error); 