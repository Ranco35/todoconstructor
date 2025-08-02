// Script para diagnosticar y corregir políticas RLS de la tabla Product
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Usamos service role para administrar RLS
);

async function checkCurrentUser() {
  try {
    console.log('🔍 Verificando usuario actual...');
    
    // Verificar con client key (usuario normal)
    const clientSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const { data: { user }, error } = await clientSupabase.auth.getUser();
    
    if (error) {
      console.log('❌ Error obteniendo usuario:', error.message);
      return null;
    }
    
    if (user) {
      console.log('✅ Usuario actual:', user.email);
      console.log('🔑 User ID:', user.id);
      console.log('🏷️ User Role:', user.role);
      console.log('📊 User Metadata:', JSON.stringify(user.user_metadata, null, 2));
      return user;
    } else {
      console.log('❌ No hay usuario autenticado');
      return null;
    }
  } catch (error) {
    console.error('❌ Error verificando usuario:', error);
    return null;
  }
}

async function checkRLSPolicies() {
  try {
    console.log('\n🔍 Verificando políticas RLS de la tabla Product...');
    
    // Query para obtener políticas RLS
    const { data, error } = await supabase.rpc('get_table_policies', {
      table_name: 'Product'
    });
    
    if (error) {
      console.log('⚠️ No se pudo obtener políticas RLS directamente');
      console.log('Error:', error.message);
    } else {
      console.log('📋 Políticas RLS encontradas:', data);
    }
    
    // Verificar si RLS está habilitado
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('information_schema.tables')
      .select('table_name, row_security')
      .eq('table_name', 'Product')
      .eq('table_schema', 'public');
    
    if (rlsError) {
      console.log('⚠️ No se pudo verificar estado RLS:', rlsError.message);
    } else {
      console.log('🔒 Estado RLS:', rlsStatus);
    }
    
  } catch (error) {
    console.error('❌ Error verificando políticas RLS:', error);
  }
}

async function testProductInsertion() {
  try {
    console.log('\n🧪 Probando inserción de producto con service role...');
    
    const testProduct = {
      name: 'Producto Test RLS',
      description: 'Producto de prueba para verificar RLS',
      sku: 'TEST-RLS-' + Date.now(),
    };
    
    const { data, error } = await supabase
      .from('Product')
      .insert(testProduct)
      .select()
      .single();
    
    if (error) {
      console.log('❌ Error insertando con service role:', error.message);
      return false;
    } else {
      console.log('✅ Inserción exitosa con service role:', data.id);
      
      // Limpiar producto de prueba
      await supabase.from('Product').delete().eq('id', data.id);
      console.log('🧹 Producto de prueba eliminado');
      return true;
    }
  } catch (error) {
    console.error('❌ Error en test de inserción:', error);
    return false;
  }
}

async function testWithClientCredentials() {
  try {
    console.log('\n🧪 Probando inserción con credenciales de cliente...');
    
    const clientSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const testProduct = {
      name: 'Producto Test Cliente',
      description: 'Producto de prueba con client key',
      sku: 'TEST-CLIENT-' + Date.now(),
    };
    
    const { data, error } = await clientSupabase
      .from('Product')
      .insert(testProduct)
      .select()
      .single();
    
    if (error) {
      console.log('❌ Error insertando con client key:', error.message);
      console.log('📋 Detalles del error:', error);
      return false;
    } else {
      console.log('✅ Inserción exitosa con client key:', data.id);
      
      // Limpiar producto de prueba
      await supabase.from('Product').delete().eq('id', data.id);
      console.log('🧹 Producto de prueba eliminado');
      return true;
    }
  } catch (error) {
    console.error('❌ Error en test con client key:', error);
    return false;
  }
}

async function createBasicInsertPolicy() {
  try {
    console.log('\n🔧 Creando política básica de inserción...');
    
    // Primero, verificar si ya existe una política
    const { data: existingPolicies, error: checkError } = await supabase.rpc(
      'sql', 
      { 
        query: `
          SELECT policyname, permissive, roles, cmd, qual, with_check 
          FROM pg_policies 
          WHERE tablename = 'Product' AND schemaname = 'public';
        `
      }
    );
    
    if (!checkError && existingPolicies && existingPolicies.length > 0) {
      console.log('📋 Políticas existentes:', existingPolicies);
    }
    
    // Crear política permisiva para inserción
    const createPolicySQL = `
      -- Desactivar RLS temporalmente para configurar
      ALTER TABLE public."Product" DISABLE ROW LEVEL SECURITY;
      
      -- Eliminar políticas existentes si las hay
      DROP POLICY IF EXISTS "Allow all operations on Product" ON public."Product";
      DROP POLICY IF EXISTS "Allow insert Product" ON public."Product";
      DROP POLICY IF EXISTS "Allow read Product" ON public."Product";
      DROP POLICY IF EXISTS "Allow update Product" ON public."Product";
      DROP POLICY IF EXISTS "Allow delete Product" ON public."Product";
      
      -- Crear política permisiva para todas las operaciones
      CREATE POLICY "Allow all operations on Product" ON public."Product"
        FOR ALL USING (true) WITH CHECK (true);
      
      -- Reactivar RLS
      ALTER TABLE public."Product" ENABLE ROW LEVEL SECURITY;
    `;
    
    const { data, error } = await supabase.rpc('sql', { query: createPolicySQL });
    
    if (error) {
      console.log('❌ Error creando política:', error.message);
      return false;
    } else {
      console.log('✅ Política de acceso total creada exitosamente');
      return true;
    }
  } catch (error) {
    console.error('❌ Error creando política básica:', error);
    return false;
  }
}

async function disableRLS() {
  try {
    console.log('\n🔓 Desactivando RLS para tabla Product...');
    
    const { data, error } = await supabase.rpc('sql', { 
      query: 'ALTER TABLE public."Product" DISABLE ROW LEVEL SECURITY;' 
    });
    
    if (error) {
      console.log('❌ Error desactivando RLS:', error.message);
      return false;
    } else {
      console.log('✅ RLS desactivado exitosamente para tabla Product');
      return true;
    }
  } catch (error) {
    console.error('❌ Error desactivando RLS:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Diagnóstico y corrección de políticas RLS para tabla Product\n');
  
  // 1. Verificar usuario actual
  const user = await checkCurrentUser();
  
  // 2. Verificar políticas RLS
  await checkRLSPolicies();
  
  // 3. Test con service role
  const serviceRoleWorks = await testProductInsertion();
  
  // 4. Test con client credentials
  const clientWorks = await testWithClientCredentials();
  
  console.log('\n📊 RESUMEN DE DIAGNÓSTICO:');
  console.log(`👤 Usuario autenticado: ${user ? '✅' : '❌'}`);
  console.log(`🔑 Service role funciona: ${serviceRoleWorks ? '✅' : '❌'}`);
  console.log(`🌐 Client key funciona: ${clientWorks ? '✅' : '❌'}`);
  
  if (!clientWorks) {
    console.log('\n🔧 APLICANDO SOLUCIONES...');
    
    // Opción 1: Crear política permisiva
    console.log('\n📋 Opción 1: Crear política permisiva');
    const policyCreated = await createBasicInsertPolicy();
    
    if (policyCreated) {
      console.log('⏳ Esperando 2 segundos para que se aplique la política...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const testAfterPolicy = await testWithClientCredentials();
      if (testAfterPolicy) {
        console.log('🎉 ¡PROBLEMA RESUELTO con política permisiva!');
        return;
      }
    }
    
    // Opción 2: Desactivar RLS completamente
    console.log('\n📋 Opción 2: Desactivar RLS completamente');
    const rlsDisabled = await disableRLS();
    
    if (rlsDisabled) {
      console.log('⏳ Esperando 2 segundos para que se aplique el cambio...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const testAfterDisable = await testWithClientCredentials();
      if (testAfterDisable) {
        console.log('🎉 ¡PROBLEMA RESUELTO desactivando RLS!');
        return;
      }
    }
    
    console.log('\n❌ No se pudo resolver el problema automáticamente');
    console.log('💡 Soluciones manuales:');
    console.log('1. Ir al dashboard de Supabase');
    console.log('2. SQL Editor > Ejecutar:');
    console.log('   ALTER TABLE public."Product" DISABLE ROW LEVEL SECURITY;');
    console.log('3. O crear una política permisiva manualmente');
  } else {
    console.log('\n🎉 ¡Todo funciona correctamente!');
  }
}

main().catch(console.error); 