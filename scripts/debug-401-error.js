#!/usr/bin/env node

/**
 * Script especializado para diagnosticar errores 401
 * en el deployment de Vercel
 */

const https = require('https');

console.log('🔍 DIAGNÓSTICO DE ERROR 401 - ADMINTERMAS');
console.log('=========================================\n');

const BASE_URL = 'https://admintermas-ffo5jkxm4-eduardo-probostes-projects.vercel.app';

// Función mejorada para requests con más información
function detailedRequest(url) {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Analizando: ${url}`);
    
    const req = https.request(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`  📊 Status: ${res.statusCode}`);
        console.log(`  📋 Headers:`);
        
        // Mostrar headers importantes
        const importantHeaders = ['content-type', 'location', 'www-authenticate', 'set-cookie', 'x-vercel-id'];
        for (const header of importantHeaders) {
          if (res.headers[header]) {
            console.log(`    ${header}: ${res.headers[header]}`);
          }
        }
        
        // Analizar el contenido de la respuesta
        console.log(`  📄 Contenido (primeros 500 chars):`);
        console.log(`    ${data.substring(0, 500)}`);
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (error) => {
      console.log(`  ❌ Error: ${error.message}`);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function diagnose401() {
  console.log(`🎯 URL Base: ${BASE_URL}\n`);
  
  const testUrls = [
    '/',
    '/login', 
    '/api/test',
    '/api/clients',
    '/_next/static/css/app/layout.css'  // Archivo estático para comparar
  ];
  
  for (const path of testUrls) {
    const fullUrl = BASE_URL + path;
    try {
      await detailedRequest(fullUrl);
    } catch (error) {
      console.log(`  💥 Error de conexión: ${error.message}`);
    }
    console.log(''); // Espacio entre requests
  }
  
  console.log('🔍 ANÁLISIS ADICIONAL:\n');
  
  // Probar con diferentes User-Agents
  console.log('🤖 Probando con diferentes User-Agents...');
  try {
    const testUrl = BASE_URL + '/';
    
    // Request normal
    const normalReq = https.request(testUrl, (res) => {
      console.log(`  📱 Normal: ${res.statusCode}`);
    });
    normalReq.end();
    
    // Request con User-Agent de navegador
    const browserReq = https.request(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      console.log(`  🌐 Browser: ${res.statusCode}`);
    });
    browserReq.end();
    
  } catch (error) {
    console.log(`  ❌ Error en test de User-Agent: ${error.message}`);
  }
  
  console.log('\n🎯 POSIBLES CAUSAS DEL ERROR 401:');
  console.log('1. 🔐 Middleware de autenticación bloqueando todas las rutas');
  console.log('2. 🚫 Configuración de Vercel que requiere autenticación');
  console.log('3. ⚙️  Error en el layout o componentes de autenticación');
  console.log('4. 🔧 Problema con variables de entorno en producción');
  console.log('5. 📱 Problema específico con el routing de Next.js');
  
  console.log('\n🚀 SOLUCIONES SUGERIDAS:');
  console.log('1. Verificar si existe middleware.ts');
  console.log('2. Revisar logs de Vercel: vercel logs --follow');
  console.log('3. Probar en modo desarrollo local');
  console.log('4. Verificar configuración de autenticación en layout');
  console.log('5. Revisar si hay redirects en next.config.js');
  
  console.log('\n✅ DIAGNÓSTICO COMPLETADO');
}

diagnose401(); 