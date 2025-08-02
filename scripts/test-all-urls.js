#!/usr/bin/env node

/**
 * Script para probar todas las URLs de deployment y encontrar la que funciona
 */

const https = require('https');

const BASE_URL = 'https://admintermas-1s7md1iij-eduardo-probostes-projects.vercel.app';

const TEST_URLS = [
  '/',
  '/login',
  '/dashboard',
  '/dashboard/configuration',
  '/dashboard/configuration/products',
  '/dashboard/configuration/category',
  '/dashboard/customers',
  '/dashboard/suppliers',
  '/dashboard/pettyCash'
];

function testUrl(url) {
  return new Promise((resolve) => {
    const fullUrl = `${BASE_URL}${url}`;
    console.log(`🔍 Probando: ${url}`);
    
    const req = https.request(fullUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const status = res.statusCode;
        const size = data.length;
        
        if (status === 200) {
          console.log(`✅ ${url} - Status: ${status} - Size: ${size} bytes`);
          resolve(true);
        } else if (status === 401 || status === 403) {
          console.log(`🔐 ${url} - Status: ${status} (Protegido - Normal)`);
          resolve(true);
        } else if (status === 302 || status === 307) {
          console.log(`↗️  ${url} - Status: ${status} (Redirección - Normal)`);
          resolve(true);
        } else {
          console.log(`❌ ${url} - Status: ${status}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`💥 ${url} - Error: ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`⏱️  ${url} - Timeout`);
      resolve(false);
    });
    
    req.end();
  });
}

async function runTests() {
  console.log('🚀 VERIFICACIÓN COMPLETA - ADMINTERMAS');
  console.log('=====================================');
  console.log(`🎯 Base URL: ${BASE_URL}`);
  console.log('');
  
  let successCount = 0;
  let totalCount = TEST_URLS.length;
  
  for (const url of TEST_URLS) {
    const success = await testUrl(url);
    if (success) successCount++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('');
  console.log('📊 RESULTADOS:');
  console.log(`✅ Éxito: ${successCount}/${totalCount}`);
  console.log(`📈 Porcentaje: ${Math.round((successCount/totalCount) * 100)}%`);
  
  if (successCount === totalCount) {
    console.log('🎉 ¡APLICACIÓN FUNCIONANDO PERFECTAMENTE!');
  } else {
    console.log('⚠️  Algunas URLs presentan problemas');
  }
}

runTests().catch(console.error); 