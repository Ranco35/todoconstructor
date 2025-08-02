const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixProductStorageRLS() {
  console.log('🔧 Configurando políticas RLS para bucket product-images...\n');

  try {
    // 1. Verificar bucket existente
    console.log('📋 Verificando bucket product-images...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error verificando buckets:', bucketError);
      return false;
    }

    const productImagesBucket = buckets.find(b => b.id === 'product-images');
    if (productImagesBucket) {
      console.log('✅ Bucket product-images existe');
      console.log(`  - Público: ${productImagesBucket.public}`);
      console.log(`  - Tamaño máximo: ${productImagesBucket.file_size_limit} bytes`);
      console.log(`  - Tipos permitidos: ${productImagesBucket.allowed_mime_types?.join(', ')}`);
    } else {
      console.log('⚠️ Bucket product-images no existe, se creará automáticamente');
    }

    // 2. Aplicar SQL para configurar políticas
    console.log('\n🔧 Aplicando políticas RLS...');
    
    const sql = `
      -- 1. Crear bucket para productos si no existe
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES (
        'product-images',
        'product-images',
        true,
        5242880,
        ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      ) ON CONFLICT (id) DO NOTHING;

      -- 2. Eliminar políticas existentes que puedan estar causando conflictos
      DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
      DROP POLICY IF EXISTS "product_images_authenticated_insert" ON storage.objects;
      DROP POLICY IF EXISTS "product_images_authenticated_update" ON storage.objects;
      DROP POLICY IF EXISTS "product_images_authenticated_delete" ON storage.objects;
      DROP POLICY IF EXISTS "product_images_service_role_all" ON storage.objects;

      -- 3. Crear políticas específicas para el bucket product-images
      CREATE POLICY "product_images_public_read" ON storage.objects
      FOR SELECT USING (bucket_id = 'product-images');

      CREATE POLICY "product_images_authenticated_insert" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'product-images' 
        AND auth.role() = 'authenticated'
      );

      CREATE POLICY "product_images_authenticated_update" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'product-images' 
        AND auth.role() = 'authenticated'
      );

      CREATE POLICY "product_images_authenticated_delete" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'product-images' 
        AND auth.role() = 'authenticated'
      );

      CREATE POLICY "product_images_service_role_all" ON storage.objects
      FOR ALL USING (
        bucket_id = 'product-images' 
        AND auth.role() = 'service_role'
      );
    `;

    const { error: sqlError } = await supabase.rpc('exec_sql', { sql });
    
    if (sqlError) {
      console.error('❌ Error aplicando SQL:', sqlError);
      
      // Intentar método alternativo
      console.log('\n🔄 Intentando método alternativo...');
      console.log('📝 INSTRUCCIONES MANUALES:');
      console.log('1. Ve a Supabase Studio > SQL Editor');
      console.log('2. Ejecuta el contenido del archivo: scripts/fix-product-storage-policies.sql');
      console.log('3. Después vuelve a probar la subida de imágenes de productos');
      
      return false;
    }

    console.log('✅ Políticas aplicadas exitosamente');

    // 3. Test de subida de archivo
    console.log('\n🧪 Probando subida de imagen de producto...');
    const testFile = new Blob(['test'], { type: 'image/jpeg' });
    const testFileName = `test-product-${Date.now()}.jpg`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(`products/${testFileName}`, testFile);

    if (uploadError) {
      console.error('❌ Error en test de subida:', uploadError.message);
      
      if (uploadError.message.includes('row-level security policy')) {
        console.log('\n📝 INSTRUCCIONES MANUALES:');
        console.log('El error persiste. Por favor:');
        console.log('1. Ve a Supabase Studio > SQL Editor');
        console.log('2. Ejecuta el contenido del archivo: scripts/fix-product-storage-policies.sql');
        console.log('3. Verifica que las políticas se crearon correctamente');
      }
      
      return false;
    }

    console.log('✅ Test de subida exitoso');

    // 4. Limpiar archivo de test
    const { error: deleteError } = await supabase.storage
      .from('product-images')
      .remove([`products/${testFileName}`]);

    if (deleteError) {
      console.warn('⚠️ No se pudo eliminar archivo de test:', deleteError);
    } else {
      console.log('✅ Archivo de test eliminado');
    }

    console.log('\n🎉 ¡Políticas RLS para productos configuradas exitosamente!');
    console.log('📝 Ahora puedes subir imágenes de productos sin errores de seguridad');
    
    return true;

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    
    console.log('\n📝 SOLUCIÓN MANUAL:');
    console.log('1. Ve a Supabase Studio > SQL Editor');
    console.log('2. Ejecuta el contenido del archivo: scripts/fix-product-storage-policies.sql');
    
    return false;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixProductStorageRLS()
    .then(success => {
      if (success) {
        console.log('\n✅ Script completado exitosamente');
        process.exit(0);
      } else {
        console.log('\n❌ Script completado con errores');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { fixProductStorageRLS }; 