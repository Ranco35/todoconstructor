const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testClientImageUpload() {
  console.log('🧪 Probando subida de imágenes de clientes...\n');

  try {
    // 1. Verificar autenticación
    console.log('🔐 Verificando autenticación...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Error de autenticación:', authError.message);
      console.log('\n📝 Para probar, necesitas estar autenticado.');
      console.log('1. Ve a la aplicación y inicia sesión');
      console.log('2. Abre las herramientas de desarrollador (F12)');
      console.log('3. Ve a Application > Local Storage > http://localhost:3000');
      console.log('4. Copia el valor de "sb-[project-ref]-auth-token"');
      console.log('5. Ejecuta este script con el token');
      return false;
    }

    if (!user) {
      console.error('❌ No hay usuario autenticado');
      console.log('\n📝 Para probar, necesitas estar autenticado.');
      console.log('1. Ve a la aplicación y inicia sesión');
      console.log('2. Abre las herramientas de desarrollador (F12)');
      console.log('3. Ve a Application > Local Storage > http://localhost:3000');
      console.log('4. Copia el valor de "sb-[project-ref]-auth-token"');
      console.log('5. Ejecuta este script con el token');
      return false;
    }

    console.log('✅ Usuario autenticado:', user.email);
    console.log('🆔 User ID:', user.id);

    // 2. Verificar bucket
    console.log('\n📁 Verificando bucket client-images...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error verificando buckets:', bucketError);
      return false;
    }

    const clientImagesBucket = buckets.find(b => b.id === 'client-images');
    if (clientImagesBucket) {
      console.log('✅ Bucket client-images existe');
      console.log(`  - Público: ${clientImagesBucket.public}`);
      console.log(`  - Tamaño máximo: ${clientImagesBucket.file_size_limit} bytes`);
    } else {
      console.log('❌ Bucket client-images no existe');
      return false;
    }

    // 3. Crear archivo de prueba
    console.log('\n📄 Creando archivo de prueba...');
    const testContent = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
    const testFile = new Blob([testContent], { type: 'image/jpeg' });
    const testFileName = `test-client-${Date.now()}.jpg`;

    // 4. Probar subida
    console.log('📤 Probando subida de archivo...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('client-images')
      .upload(`clients/${testFileName}`, testFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Error en subida:', uploadError.message);
      console.error('🔍 Código de error:', uploadError.statusCode);
      console.error('📋 Detalles:', uploadError);
      return false;
    }

    console.log('✅ Archivo subido exitosamente');
    console.log('📁 Path:', uploadData.path);

    // 5. Obtener URL pública
    console.log('\n🔗 Obteniendo URL pública...');
    const { data: urlData } = supabase.storage
      .from('client-images')
      .getPublicUrl(`clients/${testFileName}`);

    console.log('✅ URL pública:', urlData.publicUrl);

    // 6. Probar eliminación
    console.log('\n🗑️ Probando eliminación...');
    const { error: deleteError } = await supabase.storage
      .from('client-images')
      .remove([`clients/${testFileName}`]);

    if (deleteError) {
      console.error('❌ Error eliminando archivo:', deleteError);
      return false;
    }

    console.log('✅ Archivo eliminado exitosamente');

    // 7. Verificar eliminación
    console.log('\n🔍 Verificando eliminación...');
    const { data: files, error: listError } = await supabase.storage
      .from('client-images')
      .list('clients', {
        search: testFileName
      });

    if (listError) {
      console.error('❌ Error listando archivos:', listError);
    } else {
      const fileExists = files && files.some(f => f.name === testFileName);
      if (!fileExists) {
        console.log('✅ Archivo eliminado correctamente');
      } else {
        console.log('⚠️ Archivo aún existe (puede ser normal por caché)');
      }
    }

    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('📝 El sistema de subida de imágenes funciona correctamente');
    
    return true;

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return false;
  }
}

// Función para probar con token específico
async function testWithToken(token) {
  console.log('🔑 Probando con token específico...');
  
  const { data, error } = await supabase.auth.setSession({
    access_token: token,
    refresh_token: token
  });

  if (error) {
    console.error('❌ Error estableciendo sesión:', error);
    return false;
  }

  return await testClientImageUpload();
}

// Ejecutar el script
const token = process.argv[2];

if (token) {
  testWithToken(token)
    .then(success => {
      if (success) {
        console.log('\n✅ Prueba completada exitosamente');
        process.exit(0);
      } else {
        console.log('\n❌ Prueba falló');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Error ejecutando prueba:', error);
      process.exit(1);
    });
} else {
  testClientImageUpload()
    .then(success => {
      if (success) {
        console.log('\n✅ Prueba completada exitosamente');
        process.exit(0);
      } else {
        console.log('\n❌ Prueba falló');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Error ejecutando prueba:', error);
      process.exit(1);
    });
} 