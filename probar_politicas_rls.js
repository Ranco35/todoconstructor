// Script para probar las políticas RLS del bucket "Imagenes Productos"
// Ejecutar en la consola del navegador después de aplicar las correcciones SQL

console.log('🧪 Probando políticas RLS del bucket "Imagenes Productos"...');

// Función para probar la subida de imagen
async function testImageUpload() {
  try {
    console.log('📤 Probando subida de imagen...');
    
    // Importar la función de upload
    const { uploadProductImage } = await import('/src/lib/supabase-storage.ts');
    
    // Crear archivo de prueba
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const response = await fetch(testImageData);
    const blob = await response.blob();
    const testFile = new File([blob], 'test-rls.png', { type: 'image/png' });
    
    console.log('📄 Archivo de prueba creado:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type
    });
    
    // Intentar subir la imagen
    const result = await uploadProductImage(testFile, 999999);
    
    console.log('📊 Resultado de la subida:', result);
    
    if (result.success) {
      console.log('✅ ¡ÉXITO! Las políticas RLS están funcionando correctamente');
      console.log('🔗 URL de la imagen:', result.publicUrl);
      console.log('📁 Ruta del archivo:', result.filePath);
      
      // Opcional: eliminar la imagen de prueba
      console.log('🗑️ Eliminando imagen de prueba...');
      const { deleteProductImage } = await import('/src/lib/supabase-storage.ts');
      const deleteResult = await deleteProductImage(result.filePath);
      
      if (deleteResult.success) {
        console.log('✅ Imagen de prueba eliminada correctamente');
      } else {
        console.log('⚠️ No se pudo eliminar la imagen de prueba:', deleteResult.error);
      }
      
      return true;
    } else {
      console.error('❌ ERROR en la subida:', result.error);
      
      // Analizar el tipo de error
      if (result.error.includes('row-level security policy')) {
        console.log('🔍 Error de RLS detectado. Las políticas necesitan ajustes.');
      } else if (result.error.includes('Bucket not found')) {
        console.log('🔍 El bucket no existe. Verificar configuración del bucket.');
      } else if (result.error.includes('Usuario no autenticado')) {
        console.log('🔍 Error de autenticación. Verificar sesión de usuario.');
      }
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return false;
  }
}

// Función para verificar autenticación
async function checkAuthentication() {
  try {
    console.log('🔐 Verificando autenticación...');
    
    const { createClient } = await import('/src/lib/supabase.ts');
    const supabase = createClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Error verificando usuario:', error);
      return false;
    }
    
    if (!user) {
      console.error('❌ Usuario no autenticado');
      console.log('💡 Solución: Iniciar sesión en la aplicación');
      return false;
    }
    
    console.log('✅ Usuario autenticado:', {
      id: user.id,
      email: user.email,
      role: user.role
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error verificando autenticación:', error);
    return false;
  }
}

// Función para verificar configuración del bucket
async function checkBucketConfig() {
  try {
    console.log('🪣 Verificando configuración del bucket...');
    
    const { createClient } = await import('/src/lib/supabase.ts');
    const supabase = createClient();
    
    // Listar buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listando buckets:', error);
      return false;
    }
    
    console.log('📋 Buckets disponibles:', buckets.map(b => b.name));
    
    // Verificar bucket específico
    const productBucket = buckets.find(b => b.name === 'Imagenes Productos');
    
    if (!productBucket) {
      console.error('❌ Bucket "Imagenes Productos" no encontrado');
      return false;
    }
    
    console.log('✅ Bucket "Imagenes Productos" encontrado:', {
      id: productBucket.id,
      name: productBucket.name,
      public: productBucket.public,
      fileSizeLimit: productBucket.file_size_limit,
      allowedMimeTypes: productBucket.allowed_mime_types
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error verificando bucket:', error);
    return false;
  }
}

// Función principal de prueba
async function runRLSTest() {
  console.log('🚀 Iniciando pruebas de políticas RLS...');
  console.log('=====================================');
  
  const tests = [
    { name: 'Autenticación', fn: checkAuthentication },
    { name: 'Configuración del bucket', fn: checkBucketConfig },
    { name: 'Subida de imagen', fn: testImageUpload }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n🧪 Ejecutando: ${test.name}`);
    const result = await test.fn();
    results.push({ name: test.name, success: result });
    
    if (!result) {
      console.log(`❌ ${test.name} falló - detener pruebas`);
      break; // Detener si hay un error crítico
    } else {
      console.log(`✅ ${test.name} exitoso`);
    }
  }
  
  // Resumen final
  console.log('\n📊 RESUMEN DE PRUEBAS RLS:');
  console.log('==========================');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  if (successCount === totalTests) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON! Las políticas RLS están funcionando correctamente.');
    console.log('✅ El sistema está listo para subir imágenes de productos.');
  } else {
    console.log(`\n⚠️ ${successCount}/${totalTests} pruebas pasaron.`);
    console.log('💡 Revisar los errores anteriores y aplicar las correcciones necesarias.');
  }
  
  return results;
}

// Ejecutar automáticamente
runRLSTest().catch(console.error);

