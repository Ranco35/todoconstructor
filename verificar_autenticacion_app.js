// Script para verificar autenticación desde la aplicación web
// Ejecutar en la consola del navegador EN LA APLICACIÓN (no en Supabase Studio)

console.log('🔐 Verificando autenticación en la aplicación...');

async function checkAppAuthentication() {
  try {
    // Importar Supabase client de la aplicación
    const { createClient } = await import('/src/lib/supabase.ts');
    const supabase = createClient();
    
    // Verificar usuario actual
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Error verificando usuario:', error);
      return false;
    }
    
    if (!user) {
      console.error('❌ Usuario NO autenticado');
      console.log('💡 Solución: Iniciar sesión en la aplicación');
      return false;
    }
    
    console.log('✅ Usuario autenticado:', {
      id: user.id,
      email: user.email,
      role: user.role,
      lastSignIn: user.last_sign_in_at
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error verificando autenticación:', error);
    return false;
  }
}

async function testImageUploadWithAuth() {
  try {
    console.log('📤 Probando subida de imagen con usuario autenticado...');
    
    // Verificar autenticación primero
    const isAuthenticated = await checkAppAuthentication();
    if (!isAuthenticated) {
      console.log('❌ No se puede probar sin autenticación');
      return false;
    }
    
    // Importar función de upload
    const { uploadProductImage } = await import('/src/lib/supabase-storage.ts');
    
    // Crear archivo de prueba
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const response = await fetch(testImageData);
    const blob = await response.blob();
    const testFile = new File([blob], 'test-auth.png', { type: 'image/png' });
    
    console.log('📄 Archivo de prueba:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type
    });
    
    // Intentar subir
    const result = await uploadProductImage(testFile, 999999);
    
    console.log('📊 Resultado:', result);
    
    if (result.success) {
      console.log('🎉 ¡ÉXITO! Las políticas RLS funcionan correctamente');
      console.log('🔗 URL:', result.publicUrl);
      
      // Limpiar archivo de prueba
      console.log('🗑️ Limpiando archivo de prueba...');
      const { deleteProductImage } = await import('/src/lib/supabase-storage.ts');
      await deleteProductImage(result.filePath);
      console.log('✅ Archivo de prueba eliminado');
      
      return true;
    } else {
      console.error('❌ Error en subida:', result.error);
      
      if (result.error.includes('row-level security policy')) {
        console.log('🔍 Error RLS persistente. Verificar políticas.');
      } else if (result.error.includes('Usuario no autenticado')) {
        console.log('🔍 Error de autenticación. Verificar sesión.');
      }
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return false;
  }
}

// Ejecutar verificación
async function runAuthTest() {
  console.log('🚀 Iniciando verificación de autenticación...');
  
  const authOk = await checkAppAuthentication();
  
  if (authOk) {
    console.log('\n🧪 Probando subida de imagen...');
    const uploadOk = await testImageUploadWithAuth();
    
    if (uploadOk) {
      console.log('\n🎉 ¡TODO FUNCIONA CORRECTAMENTE!');
      console.log('✅ Usuario autenticado');
      console.log('✅ Políticas RLS configuradas');
      console.log('✅ Subida de imágenes funcional');
    } else {
      console.log('\n⚠️ Hay problemas con la subida de imágenes');
    }
  } else {
    console.log('\n❌ Usuario no autenticado. Iniciar sesión primero.');
  }
}

runAuthTest().catch(console.error);
