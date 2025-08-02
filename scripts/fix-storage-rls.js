const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixStorageRLSPolicies() {
  console.log('🔧 Corrigiendo políticas RLS del bucket client-images...\n');

  try {
    // 1. Verificar bucket existente
    console.log('📋 Verificando bucket client-images...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error verificando buckets:', bucketError);
      return false;
    }

    const clientImagesBucket = buckets.find(b => b.id === 'client-images');
    if (clientImagesBucket) {
      console.log('✅ Bucket client-images existe');
    } else {
      console.log('⚠️ Bucket client-images no existe, se creará automáticamente');
    }

    // 2. Aplicar correcciones SQL
    console.log('\n🔧 Aplicando correcciones de políticas RLS...');
    
    const fixSQL = `
      -- Eliminar políticas existentes que puedan estar causando conflictos
      DROP POLICY IF EXISTS "Public Access" ON storage.objects;
      DROP POLICY IF EXISTS "Authenticated users can upload client images" ON storage.objects;
      DROP POLICY IF EXISTS "Users can update their own client images" ON storage.objects;
      DROP POLICY IF EXISTS "Users can delete their own client images" ON storage.objects;
      DROP POLICY IF EXISTS "Usuarios autenticados pueden subir imágenes de clientes" ON storage.objects;
      DROP POLICY IF EXISTS "Las imágenes de clientes son públicas para lectura" ON storage.objects;
      DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar imágenes de clientes" ON storage.objects;
      DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar imágenes de clientes" ON storage.objects;
      DROP POLICY IF EXISTS "client_images_public_read" ON storage.objects;
      DROP POLICY IF EXISTS "client_images_authenticated_insert" ON storage.objects;
      DROP POLICY IF EXISTS "client_images_authenticated_update" ON storage.objects;
      DROP POLICY IF EXISTS "client_images_authenticated_delete" ON storage.objects;
      DROP POLICY IF EXISTS "client_images_service_role_all" ON storage.objects;

      -- Crear bucket si no existe
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES (
        'client-images',
        'client-images',
        true,
        5242880,
        ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      ) ON CONFLICT (id) DO NOTHING;

      -- Crear políticas permisivas para el bucket client-images
      CREATE POLICY "client_images_public_read" ON storage.objects
      FOR SELECT USING (bucket_id = 'client-images');

      CREATE POLICY "client_images_authenticated_insert" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'client-images' 
        AND auth.role() = 'authenticated'
      );

      CREATE POLICY "client_images_authenticated_update" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'client-images' 
        AND auth.role() = 'authenticated'
      );

      CREATE POLICY "client_images_authenticated_delete" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'client-images' 
        AND auth.role() = 'authenticated'
      );

      CREATE POLICY "client_images_service_role_all" ON storage.objects
      FOR ALL USING (
        bucket_id = 'client-images' 
        AND auth.role() = 'service_role'
      );
    `;

    const { data, error } = await supabase.rpc('sql', { query: fixSQL });
    
    if (error) {
      console.error('❌ Error aplicando correcciones:', error);
      return false;
    }

    console.log('✅ Correcciones aplicadas exitosamente');

    // 3. Verificar políticas creadas
    console.log('\n📋 Verificando políticas creadas...');
    const { data: policies, error: policiesError } = await supabase.rpc('sql', {
      query: `
        SELECT 
          policyname,
          permissive,
          roles,
          cmd
        FROM pg_policies 
        WHERE tablename = 'objects' 
          AND schemaname = 'storage'
          AND policyname LIKE '%client_images%'
        ORDER BY policyname;
      `
    });

    if (policiesError) {
      console.error('❌ Error verificando políticas:', policiesError);
    } else {
      console.log('📋 Políticas creadas:');
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      });
    }

    // 4. Test de subida de archivo
    console.log('\n🧪 Probando subida de archivo...');
    const testFile = new Blob(['test'], { type: 'image/jpeg' });
    const testFileName = `test-${Date.now()}.jpg`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('client-images')
      .upload(`test/${testFileName}`, testFile);

    if (uploadError) {
      console.error('❌ Error en test de subida:', uploadError);
      return false;
    }

    console.log('✅ Test de subida exitoso');

    // 5. Limpiar archivo de test
    const { error: deleteError } = await supabase.storage
      .from('client-images')
      .remove([`test/${testFileName}`]);

    if (deleteError) {
      console.warn('⚠️ No se pudo eliminar archivo de test:', deleteError);
    } else {
      console.log('✅ Archivo de test eliminado');
    }

    console.log('\n🎉 ¡Políticas RLS corregidas exitosamente!');
    console.log('📝 Ahora puedes subir imágenes sin errores de seguridad');
    
    return true;

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return false;
  }
}

// Ejecutar el script
fixStorageRLSPolicies()
  .then(success => {
    if (success) {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    } else {
      console.log('\n❌ Script falló');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Error ejecutando script:', error);
    process.exit(1);
  }); 