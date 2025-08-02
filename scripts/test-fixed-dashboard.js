const https = require('https');

const NEW_URL = 'https://admintermas-a3q9vosc3-eduardo-probostes-projects.vercel.app';

console.log('🔥 VERIFICACIÓN DASHBOARD CORREGIDO');
console.log('==================================');
console.log(`🎯 Nueva URL: ${NEW_URL}`);
console.log('');

function testDashboard() {
  return new Promise((resolve) => {
    const fullUrl = `${NEW_URL}/dashboard`;
    console.log('🔍 Probando dashboard corregido...');
    
    const req = https.request(fullUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const status = res.statusCode;
        const size = data.length;
        
        console.log(`📊 RESULTADO:`);
        console.log(`   Status: ${status} ${status === 200 ? '✅' : '❌'}`);
        console.log(`   Tamaño: ${size} bytes`);
        console.log('');
        
        // Análisis básico
        const hasHTML = data.includes('<html>');
        const hasError = data.toLowerCase().includes('error 500') || data.toLowerCase().includes('error 404');
        const hasVerifying = data.toLowerCase().includes('verificando');
        
        console.log(`🔬 ANÁLISIS:`);
        console.log(`   HTML válido: ${hasHTML ? '✅' : '❌'}`);
        console.log(`   Errores 500/404: ${hasError ? '❌ SÍ' : '✅ NO'}`);
        console.log(`   Verificando auth: ${hasVerifying ? '✅ SÍ' : '❌ NO'}`);
        console.log('');
        
        if (status === 200 && hasHTML && !hasError) {
          console.log('🎉 ¡DASHBOARD FUNCIONANDO!');
        } else {
          console.log('❌ Dashboard aún tiene problemas');
        }
        
        resolve({ status, working: status === 200 && hasHTML && !hasError });
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

testDashboard().then(result => {
  console.log('📋 RESULTADO FINAL:');
  if (result.working) {
    console.log('🎉 ¡PROBLEMA RESUELTO!');
    console.log(`🔗 URL: ${NEW_URL}/dashboard`);
  } else {
    console.log('❌ Necesita más correcciones');
  }
}).catch(console.error); 