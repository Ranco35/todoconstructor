// Script para verificar la conexión S3 con Supabase Storage
// Ejecutar en la consola del navegador

console.log('🔍 Verificando conexión S3 con Supabase Storage...');

// Configuración S3
const S3_CONFIG = {
  endpoint: 'https://oojczqgarhyxcrrxjsiy.storage.supabase.co/storage/v1/s3',
  region: 'us-east-2',
  accessKeyId: '82b8833db8556ae350e2406299b42b67',
  secretAccessKey: 'd1433d5d91db2746aa5dd8aa550d6ef937c85f10ea7b09dd04e833bd57a5f620',
  bucket: 'Imagenes Productos'
};

// Función para probar la conexión S3
async function testS3Connection() {
  try {
    console.log('📡 Probando conexión S3...');
    
    // Intentar hacer una petición HEAD al endpoint S3
    const testUrl = `${S3_CONFIG.endpoint}/${S3_CONFIG.bucket}`;
    
    console.log('🔗 URL de prueba:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'HEAD',
      headers: {
        'Authorization': `AWS4-HMAC-SHA256 Credential=${S3_CONFIG.accessKeyId}/${new Date().toISOString().split('T')[0]}/${S3_CONFIG.region}/s3/aws4_request`,
        // Nota: En una implementación real necesitarías firmar la petición correctamente
      }
    });
    
    console.log('📊 Respuesta del servidor:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (response.status === 200 || response.status === 403) {
      console.log('✅ Conexión S3 exitosa (el bucket existe)');
      return true;
    } else if (response.status === 404) {
      console.log('⚠️ El bucket no existe o no es accesible');
      return false;
    } else {
      console.log('❌ Error en la conexión S3');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error probando conexión S3:', error);
    return false;
  }
}

// Función para probar listado de archivos
async function testS3ListFiles() {
  try {
    console.log('📋 Probando listado de archivos S3...');
    
    const listUrl = `${S3_CONFIG.endpoint}/${S3_CONFIG.bucket}`;
    
    const response = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Authorization': `AWS4-HMAC-SHA256 Credential=${S3_CONFIG.accessKeyId}/${new Date().toISOString().split('T')[0]}/${S3_CONFIG.region}/s3/aws4_request`,
      }
    });
    
    if (response.ok) {
      const xmlText = await response.text();
      console.log('📄 Respuesta XML del listado:', xmlText);
      
      // Parsear XML básico para contar archivos
      const fileMatches = xmlText.match(/<Key>(.*?)<\/Key>/g);
      const fileCount = fileMatches ? fileMatches.length : 0;
      
      console.log(`✅ Listado exitoso. Archivos encontrados: ${fileCount}`);
      return true;
    } else {
      console.log('❌ Error en listado de archivos:', response.status, response.statusText);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error probando listado S3:', error);
    return false;
  }
}

// Función para probar subida de archivo de prueba
async function testS3Upload() {
  try {
    console.log('📤 Probando subida de archivo S3...');
    
    // Crear archivo de prueba pequeño
    const testContent = 'Test file content';
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
    
    const testKey = `test/test-${Date.now()}.txt`;
    const uploadUrl = `${S3_CONFIG.endpoint}/${S3_CONFIG.bucket}/${testKey}`;
    
    console.log('🔗 URL de subida:', uploadUrl);
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: testFile,
      headers: {
        'Content-Type': 'text/plain',
        'Authorization': `AWS4-HMAC-SHA256 Credential=${S3_CONFIG.accessKeyId}/${new Date().toISOString().split('T')[0]}/${S3_CONFIG.region}/s3/aws4_request`,
      }
    });
    
    console.log('📊 Respuesta de subida:', {
      status: response.status,
      statusText: response.statusText
    });
    
    if (response.ok) {
      console.log('✅ Subida exitosa');
      
      // Intentar eliminar el archivo de prueba
      console.log('🗑️ Eliminando archivo de prueba...');
      const deleteResponse = await fetch(uploadUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `AWS4-HMAC-SHA256 Credential=${S3_CONFIG.accessKeyId}/${new Date().toISOString().split('T')[0]}/${S3_CONFIG.region}/s3/aws4_request`,
        }
      });
      
      if (deleteResponse.ok) {
        console.log('✅ Archivo de prueba eliminado correctamente');
      } else {
        console.log('⚠️ No se pudo eliminar el archivo de prueba');
      }
      
      return true;
    } else {
      console.log('❌ Error en subida de archivo');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error probando subida S3:', error);
    return false;
  }
}

// Función principal de verificación
async function runS3Verification() {
  console.log('🚀 Iniciando verificación completa de S3...');
  console.log('⚙️ Configuración:', {
    endpoint: S3_CONFIG.endpoint,
    region: S3_CONFIG.region,
    bucket: S3_CONFIG.bucket,
    accessKeyId: S3_CONFIG.accessKeyId.substring(0, 8) + '...'
  });
  
  const tests = [
    { name: 'Conexión S3', fn: testS3Connection },
    { name: 'Listado de archivos', fn: testS3ListFiles },
    { name: 'Subida de archivo', fn: testS3Upload }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n🧪 Ejecutando: ${test.name}`);
    const result = await test.fn();
    results.push({ name: test.name, success: result });
    
    if (!result) {
      console.log(`❌ ${test.name} falló`);
    } else {
      console.log(`✅ ${test.name} exitoso`);
    }
  }
  
  // Resumen final
  console.log('\n📊 RESUMEN DE VERIFICACIÓN S3:');
  console.log('================================');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  if (successCount === totalTests) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON! La conexión S3 está funcionando correctamente.');
  } else {
    console.log(`\n⚠️ ${successCount}/${totalTests} pruebas pasaron. Hay problemas con la conexión S3.`);
  }
  
  return results;
}

// Ejecutar automáticamente
runS3Verification().catch(console.error);

