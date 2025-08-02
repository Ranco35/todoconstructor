#!/usr/bin/env node

/**
 * Script para hacer un nuevo deployment y capturar la URL
 */

const { execSync } = require('child_process');

console.log('🚀 NUEVO DEPLOYMENT - CAPTURANDO URL CORRECTA');
console.log('============================================\n');

function runCommand(command, description) {
  console.log(`🔍 ${description}...`);
  try {
    const result = execSync(command, { encoding: 'utf8' });
    return result;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

function extractURLFromOutput(output) {
  // Buscar URLs en el output
  const urlRegex = /https:\/\/[a-zA-Z0-9-]+\.vercel\.app/g;
  const urls = output.match(urlRegex);
  return urls ? [...new Set(urls)] : [];
}

async function newDeployment() {
  console.log('📋 INFORMACIÓN PREVIA:');
  console.log('- Build anterior: ✅ Exitoso (23 páginas)');
  console.log('- Variables: ✅ Configuradas');
  console.log('- Protección Vercel: ✅ Desactivada');
  console.log('- Problema: 404 en todas las URLs\n');
  
  console.log('🚀 Ejecutando nuevo deployment...\n');
  
  const output = runCommand('vercel --prod --force', 'Deployment en producción');
  
  if (output) {
    console.log('\n📊 ANALIZANDO OUTPUT DEL DEPLOYMENT:\n');
    
    // Extraer URLs del output
    const urls = extractURLFromOutput(output);
    
    if (urls.length > 0) {
      console.log('🌐 URLs ENCONTRADAS:');
      urls.forEach((url, index) => {
        console.log(`   ${index + 1}. ${url}`);
      });
      
      // Usar la última URL (más reciente)
      const latestUrl = urls[urls.length - 1];
      console.log(`\n🎯 URL PRINCIPAL: ${latestUrl}`);
      
      // Probar la URL inmediatamente
      console.log('\n🧪 Probando la nueva URL...');
      
      try {
        const testResult = execSync(`curl -s -o /dev/null -w "%{http_code}" "${latestUrl}"`, { encoding: 'utf8' });
        const statusCode = testResult.trim();
        
        console.log(`   Status: ${statusCode} ${statusCode === '200' ? '✅' : '❌'}`);
        
        if (statusCode === '200') {
          console.log('\n🎉 ¡ÉXITO! La aplicación está funcionando');
          console.log(`🔗 URL funcionando: ${latestUrl}`);
        } else {
          console.log(`\n⚠️ Status ${statusCode} - Aún hay problemas`);
        }
      } catch (error) {
        console.log('   ⚠️ No se pudo probar con curl, prueba manualmente');
      }
      
    } else {
      console.log('❌ No se encontraron URLs en el output del deployment');
    }
    
    // Mostrar información adicional
    console.log('\n📝 PRÓXIMOS PASOS:');
    if (urls.length > 0) {
      console.log(`1. Abre: ${urls[urls.length - 1]}`);
      console.log('2. Verifica que cargue correctamente');
      console.log('3. Prueba login y funcionalidades');
    } else {
      console.log('1. Ejecuta: vercel ls');
      console.log('2. Encuentra la URL más reciente');
      console.log('3. Prueba esa URL manualmente');
    }
    
  } else {
    console.log('❌ Error en el deployment');
  }
}

newDeployment(); 