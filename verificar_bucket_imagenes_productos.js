// Script para verificar que el bucket "Imagenes Productos" está funcionando correctamente
// Ejecutar en la consola del navegador en la página de productos

console.log('🔍 Verificando configuración del bucket "Imagenes Productos"...');

// Función para probar la conexión con Supabase Storage
async function testBucketConnection() {
  try {
    // Importar la función de storage
    const { uploadProductImage } = await import('/src/lib/supabase-storage.ts');
    
    // Crear un archivo de prueba (imagen pequeña en base64)
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    // Convertir base64 a File
    const response = await fetch(testImageData);
    const blob = await response.blob();
    const testFile = new File([blob], 'test.png', { type: 'image/png' });
    
    console.log('📤 Probando subida de imagen de prueba...');
    
    // Intentar subir la imagen de prueba
    const result = await uploadProductImage(testFile, 999999); // ID de prueba
    
    if (result.success) {
      console.log('✅ ¡ÉXITO! El bucket "Imagenes Productos" está funcionando correctamente');
      console.log('📄 URL de la imagen:', result.publicUrl);
      console.log('📁 Ruta del archivo:', result.filePath);
      
      // Limpiar la imagen de prueba
      console.log('🧹 Limpiando imagen de prueba...');
      // Aquí podrías agregar código para eliminar la imagen de prueba si es necesario
      
      return true;
    } else {
      console.error('❌ ERROR al subir imagen:', result.error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return false;
  }
}

// Función para verificar la configuración del bucket
async function verifyBucketConfig() {
  try {
    console.log('🔧 Verificando configuración...');
    
    // Verificar que las constantes están correctas
    const { createClient } = await import('/src/lib/supabase.ts');
    const supabase = createClient();
    
    // Listar todos los buckets disponibles
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listando buckets:', error);
      return false;
    }
    
    console.log('📋 Buckets disponibles:', buckets.map(b => b.name));
    
    // Verificar que el bucket "Imagenes Productos" existe
    const productBucket = buckets.find(b => b.name === 'Imagenes Productos');
    
    if (productBucket) {
      console.log('✅ Bucket "Imagenes Productos" encontrado:', productBucket);
      return true;
    } else {
      console.error('❌ Bucket "Imagenes Productos" NO encontrado');
      console.log('💡 Buckets disponibles:', buckets.map(b => b.name));
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error verificando configuración:', error);
    return false;
  }
}

// Ejecutar las verificaciones
async function runVerification() {
  console.log('🚀 Iniciando verificación completa...');
  
  const configOk = await verifyBucketConfig();
  
  if (configOk) {
    const uploadOk = await testBucketConnection();
    
    if (uploadOk) {
      console.log('🎉 ¡TODAS LAS VERIFICACIONES PASARON! El sistema está listo para subir imágenes de productos.');
    } else {
      console.log('⚠️ La configuración está bien, pero hay problemas con la subida de imágenes.');
    }
  } else {
    console.log('❌ Hay problemas con la configuración del bucket.');
  }
}

// Ejecutar automáticamente
runVerification();

