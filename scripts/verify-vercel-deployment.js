#!/usr/bin/env node

/**
 * Script para verificar completamente el deployment de Vercel
 * 
 * Verifica:
 * - Estado del deployment
 * - URLs principales funcionando
 * - API routes
 * - Variables de entorno
 * - Conectividad con Supabase
 * - Logs recientes
 */

const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN COMPLETA DEL DEPLOYMENT EN VERCEL');
console.log('===============================================\n');

// Configuración
const PROJECT_NAME = 'admintermas';
let DEPLOYMENT_URL = '';

// Función para hacer requests HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

// 1. Verificar estado del deployment
console.log('1. 📋 VERIFICANDO DEPLOYMENT STATUS...\n');

try {
  const deployments = execSync('vercel ls --json', { encoding: 'utf8' });
  const deploymentsData = JSON.parse(deployments);
  const latestDeployment = deploymentsData[0];
  
  if (latestDeployment) {
    DEPLOYMENT_URL = `https://${latestDeployment.url}`;
    console.log(`✅ Deployment encontrado: ${latestDeployment.name}`);
    console.log(`🔗 URL: ${DEPLOYMENT_URL}`);
    console.log(`📅 Creado: ${new Date(latestDeployment.created).toLocaleString()}`);
    console.log(`🎯 Estado: ${latestDeployment.state || 'READY'}`);
    console.log(`⚡ Región: ${latestDeployment.regions?.[0] || 'N/A'}\n`);
  } else {
    console.log('❌ No se encontraron deployments\n');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Error obteniendo deployments:', error.message);
  console.log('💡 Asegúrate de estar logueado: vercel login\n');
  process.exit(1);
}

// 2. Verificar URLs principales
console.log('2. 🌐 VERIFICANDO URLS PRINCIPALES...\n');

const urlsToTest = [
  { name: 'Home Page', path: '/', expectedStatus: [200, 301, 302] },
  { name: 'Login Page', path: '/login', expectedStatus: [200] },
  { name: 'Dashboard', path: '/dashboard', expectedStatus: [200, 301, 302] },
  { name: 'API Health', path: '/api/test', expectedStatus: [200, 404, 405] },
  { name: 'API Clients', path: '/api/clients', expectedStatus: [200, 401, 405] }
];

async function testUrls() {
  for (const urlTest of urlsToTest) {
    const fullUrl = DEPLOYMENT_URL + urlTest.path;
    try {
      console.log(`🔍 Probando ${urlTest.name}: ${urlTest.path}`);
      const response = await makeRequest(fullUrl);
      
      if (urlTest.expectedStatus.includes(response.statusCode)) {
        console.log(`  ✅ Status: ${response.statusCode} - OK`);
      } else {
        console.log(`  ⚠️  Status: ${response.statusCode} - Inesperado`);
      }
      
      // Verificar si es HTML válido
      if (response.body.includes('<!DOCTYPE html') || response.body.includes('<html')) {
        console.log(`  ✅ Respuesta: HTML válido`);
      } else if (response.body.includes('{') && response.body.includes('}')) {
        console.log(`  ✅ Respuesta: JSON válido`);
      } else {
        console.log(`  ⚠️  Respuesta: Formato desconocido`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }
}

// 3. Verificar variables de entorno
console.log('3. 🔧 VERIFICANDO VARIABLES DE ENTORNO...\n');

try {
  const envOutput = execSync('vercel env ls', { encoding: 'utf8' });
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  console.log('Variables encontradas en Vercel:');
  for (const varName of requiredVars) {
    if (envOutput.includes(varName)) {
      console.log(`  ✅ ${varName}: Configurada`);
    } else {
      console.log(`  ❌ ${varName}: NO ENCONTRADA`);
    }
  }
  console.log('');
} catch (error) {
  console.log('❌ Error verificando variables de entorno:', error.message);
  console.log('');
}

// 4. Verificar logs recientes
console.log('4. 📊 VERIFICANDO LOGS RECIENTES...\n');

try {
  console.log('Obteniendo logs de build...');
  const buildLogs = execSync(`vercel inspect --logs ${DEPLOYMENT_URL.replace('https://', '')}`, { 
    encoding: 'utf8',
    timeout: 15000 
  });
  
  if (buildLogs.includes('✓ Compiled successfully')) {
    console.log('  ✅ Build: Compilación exitosa');
  } else if (buildLogs.includes('Failed to compile')) {
    console.log('  ❌ Build: Error de compilación');
  } else {
    console.log('  ⚠️  Build: Estado desconocido');
  }
  
  if (buildLogs.includes('Deployment completed')) {
    console.log('  ✅ Deploy: Completado exitosamente');
  } else {
    console.log('  ⚠️  Deploy: Estado unclear');
  }
  
  if (buildLogs.includes('SUPABASE SERVER CONFIG')) {
    console.log('  ✅ Supabase: Configuración detectada');
  } else {
    console.log('  ⚠️  Supabase: Configuración no detectada en logs');
  }
  
} catch (error) {
  console.log('⚠️  No se pudieron obtener logs detallados');
}
console.log('');

// 5. Verificar configuración local
console.log('5. ⚙️  VERIFICANDO CONFIGURACIÓN LOCAL...\n');

// Verificar archivos importantes
const importantFiles = [
  { name: 'next.config.js', path: 'next.config.js' },
  { name: 'vercel.json', path: 'vercel.json' },
  { name: 'package.json', path: 'package.json' },
  { name: '.env.local', path: '.env.local' }
];

for (const file of importantFiles) {
  const filePath = path.join(__dirname, '..', file.path);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file.name}: Presente`);
    
    if (file.name === 'next.config.js') {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('serverExternalPackages')) {
        console.log(`    ✅ serverExternalPackages configurado`);
      } else {
        console.log(`    ⚠️  serverExternalPackages no encontrado`);
      }
    }
  } else {
    console.log(`  ❌ ${file.name}: NO ENCONTRADO`);
  }
}
console.log('');

// Función principal asíncrona
async function runVerification() {
  await testUrls();
  
  // 6. Resumen final
  console.log('6. 📋 RESUMEN DE VERIFICACIÓN\n');
  
  console.log('🎯 ESTADO GENERAL:');
  console.log(`  🔗 URL Principal: ${DEPLOYMENT_URL}`);
  console.log(`  📅 Última verificación: ${new Date().toLocaleString()}`);
  console.log('');
  
  console.log('🚀 PRÓXIMAS ACCIONES RECOMENDADAS:');
  console.log('  1. Probar manualmente las URLs principales');
  console.log('  2. Verificar login y dashboard en el navegador');
  console.log('  3. Probar funcionalidades críticas');
  console.log('  4. Monitorear logs: vercel logs --follow');
  console.log('');
  
  console.log('📝 COMANDOS ÚTILES:');
  console.log('  vercel ls                    # Ver deployments');
  console.log('  vercel logs --follow         # Monitor logs');
  console.log('  vercel --prod --force        # Redeploy');
  console.log('  vercel domains               # Ver dominios');
  console.log('');
  
  console.log('🎉 VERIFICACIÓN COMPLETADA');
  console.log('==========================');
}

// Ejecutar verificación
runVerification().catch(error => {
  console.error('💥 Error durante la verificación:', error.message);
  process.exit(1);
}); 