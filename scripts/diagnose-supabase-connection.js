require('dotenv').config({ path: '.env.local' });
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Diagnóstico de conectividad con Supabase\n');

// Verificar variables de entorno
console.log('📋 Variables de entorno:');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Configurada' : '❌ No configurada'}`);
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Configurada' : '❌ No configurada'}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Configurada' : '❌ No configurada'}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('\n❌ Variables de entorno faltantes. Verifica tu archivo .env.local');
  process.exit(1);
}

// Función para hacer una petición HTTP simple
function makeHttpRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Función para verificar conectividad básica
async function checkBasicConnectivity() {
  console.log('\n🌐 Verificando conectividad básica...');
  
  try {
    const response = await makeHttpRequest(supabaseUrl);
    console.log(`✅ Status Code: ${response.statusCode}`);
    console.log(`✅ Content-Type: ${response.headers['content-type']}`);
    
    if (response.data.includes('<!DOCTYPE')) {
      console.log('⚠️  Respuesta HTML detectada (posible página de error)');
      if (response.data.includes('Cloudflare')) {
        console.log('❌ Error de Cloudflare detectado');
        console.log('💡 Posibles soluciones:');
        console.log('   1. Verificar que el proyecto de Supabase esté activo');
        console.log('   2. Revisar la configuración DNS del proyecto');
        console.log('   3. Contactar al soporte de Supabase');
      }
    } else {
      console.log('✅ Respuesta parece ser JSON válido');
    }
    
    return response;
  } catch (error) {
    console.log(`❌ Error de conectividad: ${error.message}`);
    return null;
  }
}

// Función para probar el cliente de Supabase
async function testSupabaseClient() {
  console.log('\n🔧 Probando cliente de Supabase...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Intentar una consulta simple
    const { data, error } = await supabase
      .from('rooms')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`❌ Error en consulta Supabase: ${error.message}`);
      console.log(`   Código: ${error.code}`);
      console.log(`   Detalles: ${error.details}`);
      return false;
    }
    
    console.log('✅ Cliente de Supabase funcionando correctamente');
    console.log(`   Datos recibidos: ${JSON.stringify(data)}`);
    return true;
  } catch (error) {
    console.log(`❌ Error creando cliente Supabase: ${error.message}`);
    return false;
  }
}

// Función para verificar DNS
async function checkDNS() {
  console.log('\n🔍 Verificando resolución DNS...');
  
  const hostname = new URL(supabaseUrl).hostname;
  console.log(`Hostname: ${hostname}`);
  
  const dns = require('dns').promises;
  
  try {
    const addresses = await dns.resolve4(hostname);
    console.log(`✅ IPs resueltas: ${addresses.join(', ')}`);
    return addresses;
  } catch (error) {
    console.log(`❌ Error resolviendo DNS: ${error.message}`);
    return null;
  }
}

// Función principal
async function diagnose() {
  console.log('🚀 Iniciando diagnóstico completo...\n');
  
  // Verificar DNS
  const ips = await checkDNS();
  
  // Verificar conectividad básica
  const httpResponse = await checkBasicConnectivity();
  
  // Probar cliente de Supabase
  const clientWorking = await testSupabaseClient();
  
  // Resumen
  console.log('\n📊 Resumen del diagnóstico:');
  console.log(`DNS: ${ips ? '✅' : '❌'}`);
  console.log(`HTTP: ${httpResponse ? '✅' : '❌'}`);
  console.log(`Cliente Supabase: ${clientWorking ? '✅' : '❌'}`);
  
  if (!clientWorking) {
    console.log('\n💡 Recomendaciones:');
    console.log('1. Verifica que el proyecto de Supabase esté activo en el dashboard');
    console.log('2. Revisa las credenciales en tu archivo .env.local');
    console.log('3. Intenta usar el proyecto alternativo si tienes uno');
    console.log('4. Contacta al soporte de Supabase si el problema persiste');
  }
}

// Ejecutar diagnóstico
diagnose().catch(console.error); 