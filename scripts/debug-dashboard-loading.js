const https = require('https');

const BASE_URL = 'https://admintermas-git-main-eduardo-probostes-projects.vercel.app';

console.log('🚨 DIAGNÓSTICO DASHBOARD - PROBLEMA DE CARGA');
console.log('============================================');
console.log(`🎯 URL: ${BASE_URL}`);
console.log('');

function checkDashboard() {
  return new Promise((resolve) => {
    const fullUrl = `${BASE_URL}/dashboard`;
    console.log('🔍 Analizando dashboard...');
    
    const req = https.request(fullUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const status = res.statusCode;
        
        console.log(`📊 ANÁLISIS DEL DASHBOARD:`);
        console.log(`   Status Code: ${status}`);
        console.log(`   Content Length: ${data.length} bytes`);
        console.log(`   Content Type: ${res.headers['content-type'] || 'unknown'}`);
        console.log('');
        
        // Análisis del contenido
        const hasHTML = data.includes('<html>');
        const hasError = data.toLowerCase().includes('error');
        const hasLoading = data.toLowerCase().includes('loading') || data.toLowerCase().includes('cargando');
        const hasNextJS = data.includes('__next') || data.includes('_next');
        const hasSupabase = data.includes('supabase');
        const hasAuth = data.includes('auth') || data.includes('login');
        const hasJavaScript = data.includes('<script>') || data.includes('javascript');
        
        console.log(`🔬 CONTENIDO DETECTADO:`);
        console.log(`   HTML válido: ${hasHTML ? '✅' : '❌'}`);
        console.log(`   Next.js: ${hasNextJS ? '✅' : '❌'}`);
        console.log(`   JavaScript: ${hasJavaScript ? '✅' : '❌'}`);
        console.log(`   Errores: ${hasError ? '⚠️ SÍ' : '✅ NO'}`);
        console.log(`   Loading state: ${hasLoading ? '⏳ SÍ' : '✅ NO'}`);
        console.log(`   Auth system: ${hasAuth ? '✅' : '❌'}`);
        console.log(`   Supabase: ${hasSupabase ? '✅' : '❌'}`);
        console.log('');
        
        // Buscar errores específicos
        if (data.includes('500')) {
          console.log('🚨 ERROR 500 DETECTADO - Error del servidor');
        }
        if (data.includes('404')) {
          console.log('🚨 ERROR 404 DETECTADO - Página no encontrada');
        }
        if (data.includes('__dirname')) {
          console.log('🚨 ERROR __dirname DETECTADO - Problema de Server Components');
        }
        if (data.includes('ReferenceError')) {
          console.log('🚨 REFERENCE ERROR DETECTADO - Problema de variables');
        }
        
        // Mostrar una muestra del contenido para diagnóstico
        console.log('📄 MUESTRA DEL CONTENIDO (primeros 300 caracteres):');
        console.log('---');
        console.log(data.substring(0, 300) + (data.length > 300 ? '...' : ''));
        console.log('---');
        console.log('');
        
        resolve({
          status,
          working: status === 200,
          hasHTML,
          hasError,
          hasLoading,
          content: data
        });
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Error de conexión: ${error.message}`);
      resolve({ status: 'ERROR', working: false, error: error.message });
    });
    
    req.setTimeout(15000, () => {
      req.destroy();
      console.log(`⏱️ Timeout - El dashboard no responde`);
      resolve({ status: 'TIMEOUT', working: false });
    });
    
    req.end();
  });
}

async function diagnoseDashboard() {
  console.log('🔍 Iniciando diagnóstico del dashboard...\n');
  
  const result = await checkDashboard();
  
  console.log('💡 DIAGNÓSTICO Y RECOMENDACIONES:');
  console.log('=================================');
  
  if (result.status === 200 && result.hasHTML && !result.hasError) {
    if (result.hasLoading) {
      console.log('⏳ PROBLEMA: Dashboard se queda en estado de carga');
      console.log('📋 POSIBLES CAUSAS:');
      console.log('   1. Problema con la autenticación de Supabase');
      console.log('   2. Error en Client Components');
      console.log('   3. Variables de entorno incorrectas');
      console.log('   4. Problema con la gestión de estado');
    } else {
      console.log('✅ Dashboard responde correctamente');
    }
  } else if (result.status === 200 && result.hasError) {
    console.log('⚠️ PROBLEMA: Dashboard carga pero tiene errores');
    console.log('📋 REVISAR: Errores en el código o configuración');
  } else if (result.status !== 200) {
    console.log(`❌ PROBLEMA: Status ${result.status} - Dashboard no accesible`);
  }
  
  console.log('');
  console.log('🔧 PRÓXIMOS PASOS RECOMENDADOS:');
  console.log('1. Revisar los logs de la consola del navegador');
  console.log('2. Verificar configuración de Supabase en Vercel');
  console.log('3. Revisar el layout del dashboard');
  console.log('4. Verificar Client Components');
}

diagnoseDashboard().catch(console.error); 