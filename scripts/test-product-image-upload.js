const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

// Cliente con service role (admin)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Cliente con anon key (como el frontend)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function testProductImageUpload() {
  console.log('🧪 Diagnóstico completo de subida de imágenes de productos...\n');

  try {
    // 1. Verificar buckets con admin
    console.log('📋 Verificando buckets (admin)...');
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error verificando buckets:', bucketError);
      return false;
    }

    const productBucket = buckets.find(b => b.id === 'product-images');
    console.log('✅ Bucket product-images:', productBucket ? 'Existe' : 'No existe');
    if (productBucket) {
      console.log(`  - Público: ${productBucket.public}`);
      console.log(`  - Tamaño máximo: ${productBucket.file_size_limit} bytes`);
    }

    // 2. Verificar políticas
    console.log('\n📋 Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('policyname, cmd, roles')
      .eq('tablename', 'objects')
      .eq('schemaname', 'storage')
      .like('policyname', '%product_images%');

    if (policiesError) {
      console.log('⚠️ No se pudieron verificar políticas:', policiesError.message);
    } else {
      console.log('📋 Políticas encontradas:');
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd}) - Roles: ${policy.roles}`);
      });
    }

    // 3. Probar con service role (debería funcionar)
    console.log('\n🧪 Test 1: Subida con SERVICE ROLE...');
    const testFile1 = new Blob(['test-service-role'], { type: 'image/jpeg' });
    const testFileName1 = `test-service-${Date.now()}.jpg`;
    
    const { data: uploadData1, error: uploadError1 } = await supabaseAdmin.storage
      .from('product-images')
      .upload(`products/${testFileName1}`, testFile1);

    if (uploadError1) {
      console.error('❌ Error con SERVICE ROLE:', uploadError1.message);
    } else {
      console.log('✅ SERVICE ROLE funciona correctamente');
      
      // Limpiar
      await supabaseAdmin.storage.from('product-images').remove([`products/${testFileName1}`]);
    }

    // 4. Verificar estado de autenticación del cliente
    console.log('\n🔐 Verificando autenticación del cliente...');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      console.error('❌ Error verificando usuario:', userError.message);
    } else if (!user) {
      console.log('❌ PROBLEMA ENCONTRADO: Usuario NO autenticado');
      console.log('💡 SOLUCIÓN: El usuario debe estar logueado para subir imágenes');
      
      // Intentar obtener session
      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
      if (sessionError) {
        console.error('❌ Error obteniendo sesión:', sessionError.message);
      } else if (!session) {
        console.log('❌ No hay sesión activa');
        console.log('\n📝 INSTRUCCIONES PARA RESOLVER:');
        console.log('1. Asegúrate de estar logueado en la aplicación');
        console.log('2. Verifica que la sesión no haya expirado');
        console.log('3. Si el problema persiste, cierra sesión y vuelve a iniciar sesión');
      } else {
        console.log('✅ Sesión activa encontrada:', session.user.email);
      }
    } else {
      console.log('✅ Usuario autenticado:', user.email);
      console.log('🔑 Role:', user.role);
      
      // 5. Probar con cliente autenticado
      console.log('\n🧪 Test 2: Subida con CLIENTE AUTENTICADO...');
      const testFile2 = new Blob(['test-authenticated'], { type: 'image/jpeg' });
      const testFileName2 = `test-auth-${Date.now()}.jpg`;
      
      const { data: uploadData2, error: uploadError2 } = await supabaseClient.storage
        .from('product-images')
        .upload(`products/${testFileName2}`, testFile2);

      if (uploadError2) {
        console.error('❌ Error con CLIENTE AUTENTICADO:', uploadError2.message);
        console.log('🔍 Código de error:', uploadError2.statusCode);
        
        if (uploadError2.message.includes('row-level security policy')) {
          console.log('\n🔧 DIAGNÓSTICO ADICIONAL:');
          
          // Verificar si el rol es correcto
          console.log('🔍 Verificando rol del usuario...');
          const { data: roleData, error: roleError } = await supabaseClient.rpc('auth.role');
          if (!roleError && roleData) {
            console.log('👤 Rol actual:', roleData);
          }
          
          console.log('\n📝 POSIBLES SOLUCIONES:');
          console.log('1. Verificar que el usuario tenga rol "authenticated"');
          console.log('2. Verificar que las políticas RLS estén activas');
          console.log('3. Intentar recrear las políticas con nombres únicos');
          console.log('4. Verificar que no haya conflictos con otras políticas');
        }
      } else {
        console.log('✅ CLIENTE AUTENTICADO funciona correctamente');
        
        // Limpiar
        await supabaseClient.storage.from('product-images').remove([`products/${testFileName2}`]);
      }
    }

    // 6. Verificar políticas específicas de storage.objects
    console.log('\n🔍 Verificando estado de RLS en storage.objects...');
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin.rpc('sql', {
      query: `
        SELECT 
          schemaname,
          tablename,
          rowsecurity
        FROM pg_tables 
        WHERE schemaname = 'storage' AND tablename = 'objects';
      `
    });

    if (!rlsError && rlsStatus) {
      console.log('🛡️ RLS habilitado en storage.objects:', rlsStatus[0]?.rowsecurity || 'No encontrado');
    }

    console.log('\n🎯 RESUMEN DEL DIAGNÓSTICO:');
    console.log('- Bucket product-images:', productBucket ? '✅ Existe' : '❌ No existe');
    console.log('- Políticas RLS:', policies?.length > 0 ? `✅ ${policies.length} configuradas` : '❌ No encontradas');
    console.log('- Service role:', uploadError1 ? '❌ Falla' : '✅ Funciona');
    console.log('- Usuario autenticado:', user ? '✅ Sí' : '❌ No');
    
    return true;

  } catch (error) {
    console.error('❌ Error inesperado en diagnóstico:', error);
    return false;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testProductImageUpload()
    .then(() => {
      console.log('\n✅ Diagnóstico completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { testProductImageUpload }; 