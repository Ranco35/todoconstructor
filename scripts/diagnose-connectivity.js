#!/usr/bin/env node

const https = require('https');
const { performance } = require('perf_hooks');

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bvzfuibqlprrfbudnauc.supabase.co';
const endpoints = [
  '/rest/v1/',
  '/auth/v1/health',
  '/realtime/v1/api/tenants/realtime/channels'
];

console.log('🔍 Diagnóstico de Conectividad a Supabase\n');
console.log(`📍 URL Base: ${SUPABASE_URL}\n`);

// Función para probar conectividad a un endpoint
function testEndpoint(url, timeout = 10000) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    const req = https.get(url, { timeout }, (res) => {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      resolve({
        success: true,
        status: res.statusCode,
        responseTime,
        headers: res.headers
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      resolve({
        success: false,
        error: 'TIMEOUT',
        responseTime,
        timeout: true
      });
    });

    req.on('error', (error) => {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      resolve({
        success: false,
        error: error.code || error.message,
        responseTime,
        timeout: false
      });
    });
  });
}

// Función para probar DNS
function testDNS(hostname) {
  return new Promise((resolve) => {
    const dns = require('dns');
    const startTime = performance.now();
    
    dns.lookup(hostname, (err, address, family) => {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      if (err) {
        resolve({
          success: false,
          error: err.code,
          responseTime
        });
      } else {
        resolve({
          success: true,
          address,
          family,
          responseTime
        });
      }
    });
  });
}

// Función principal
async function runDiagnostic() {
  try {
    const hostname = new URL(SUPABASE_URL).hostname;
    
    // 1. Test DNS
    console.log('1️⃣ Verificando resolución DNS...');
    const dnsResult = await testDNS(hostname);
    
    if (dnsResult.success) {
      console.log(`✅ DNS OK: ${hostname} → ${dnsResult.address} (${dnsResult.responseTime}ms)`);
    } else {
      console.log(`❌ DNS FALLO: ${dnsResult.error} (${dnsResult.responseTime}ms)`);
      return;
    }
    
    console.log('');
    
    // 2. Test de conectividad básica
    console.log('2️⃣ Probando conectividad HTTP...');
    const basicTest = await testEndpoint(SUPABASE_URL + '/', 5000);
    
    if (basicTest.success) {
      console.log(`✅ Conectividad básica OK (${basicTest.responseTime}ms)`);
    } else {
      console.log(`❌ Conectividad básica FALLO: ${basicTest.error} (${basicTest.responseTime}ms)`);
      if (basicTest.timeout) {
        console.log(`⚠️ El timeout de ${5000}ms fue alcanzado`);
      }
    }
    
    console.log('');
    
    // 3. Test de endpoints específicos
    console.log('3️⃣ Probando endpoints específicos...');
    
    for (const endpoint of endpoints) {
      const url = SUPABASE_URL + endpoint;
      console.log(`   Probando: ${endpoint}`);
      
      const result = await testEndpoint(url, 10000);
      
      if (result.success) {
        console.log(`   ✅ OK - Status: ${result.status} (${result.responseTime}ms)`);
      } else {
        console.log(`   ❌ FALLO - Error: ${result.error} (${result.responseTime}ms)`);
        if (result.timeout) {
          console.log(`   ⚠️ Timeout de 10s alcanzado`);
        }
      }
    }
    
    console.log('');
    
    // 4. Test de múltiples conexiones simultáneas
    console.log('4️⃣ Probando conexiones simultáneas...');
    
    const simultaneousTests = Array(5).fill().map((_, i) => 
      testEndpoint(SUPABASE_URL + '/rest/v1/', 15000)
    );
    
    const simultaneousResults = await Promise.all(simultaneousTests);
    const successCount = simultaneousResults.filter(r => r.success).length;
    const avgResponseTime = simultaneousResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.responseTime, 0) / Math.max(successCount, 1);
    
    console.log(`   Exitosas: ${successCount}/5`);
    if (successCount > 0) {
      console.log(`   Tiempo promedio: ${Math.round(avgResponseTime)}ms`);
    }
    
    console.log('');
    
    // 5. Resumen y recomendaciones
    console.log('📋 RESUMEN Y RECOMENDACIONES:');
    
    if (dnsResult.success && basicTest.success && successCount >= 3) {
      console.log('✅ La conectividad parece estar funcionando correctamente.');
      
      if (avgResponseTime > 3000) {
        console.log('⚠️ Los tiempos de respuesta son altos. Considera:');
        console.log('   - Verificar tu conexión a internet');
        console.log('   - Usar una VPN si estás en una región con restricciones');
      }
    } else {
      console.log('❌ Se detectaron problemas de conectividad.');
      console.log('');
      console.log('🔧 Posibles soluciones:');
      
      if (!dnsResult.success) {
        console.log('   - Verificar configuración DNS');
        console.log('   - Probar con DNS públicos (8.8.8.8, 1.1.1.1)');
      }
      
      if (!basicTest.success || successCount < 3) {
        console.log('   - Verificar firewall/proxy corporativo');
        console.log('   - Probar desde otra red (datos móviles)');
        console.log('   - Considerar usar una VPN');
        console.log('   - Verificar que las URLs de Supabase estén accesibles');
      }
      
      console.log('   - Contactar soporte de Supabase si el problema persiste');
    }
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error.message);
  }
}

// Ejecutar diagnóstico
if (require.main === module) {
  runDiagnostic().then(() => {
    console.log('\n✨ Diagnóstico completado.');
  });
}

module.exports = { testEndpoint, testDNS, runDiagnostic }; 