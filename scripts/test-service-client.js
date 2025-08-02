// ========================================
// PRUEBA DE GETSUPABASESERVICECLIENT
// ========================================

const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('=== PRUEBA DE SERVICE CLIENT ===');
console.log('Supabase URL:', supabaseUrl ? '✅ Configurada' : '❌ No configurada');
console.log('Service Key:', supabaseServiceKey ? '✅ Configurada' : '❌ No configurada');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testServiceClient() {
  try {
    console.log('\n🔧 Probando conexión con service role...');
    
    // 1. Probar conexión básica
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('✅ Conexión básica:', authError ? '❌ Error' : '✅ OK');
    
    // 2. Probar listar usuarios
    const { data: { users: authUsers }, error: listError } = await supabase.auth.admin.listUsers();
    console.log('✅ Listar usuarios:', listError ? '❌ Error' : `✅ OK (${authUsers?.length || 0} usuarios)`);
    
    // 3. Probar consultar tabla Role
    const { data: roles, error: roleError } = await supabase
      .from('Role')
      .select('*');
    console.log('✅ Consultar Role:', roleError ? '❌ Error' : `✅ OK (${roles?.length || 0} roles)`);
    
    // 4. Probar consultar tabla User
    const { data: dbUsers, error: userError } = await supabase
      .from('User')
      .select('*');
    console.log('✅ Consultar User:', userError ? '❌ Error' : `✅ OK (${dbUsers?.length || 0} usuarios)`);
    
    // 5. Probar inserción en Role (si no existe)
    const testRoleName = 'TEST_ROLE_' + Date.now();
    const { data: newRole, error: insertRoleError } = await supabase
      .from('Role')
      .insert({
        "roleName": testRoleName,
        description: 'Rol de prueba temporal'
      })
      .select()
      .single();
    
    if (insertRoleError) {
      console.log('❌ Insertar Role:', insertRoleError.message);
    } else {
      console.log('✅ Insertar Role:', '✅ OK');
      
      // Limpiar rol de prueba
      await supabase
        .from('Role')
        .delete()
        .eq('roleName', testRoleName);
      console.log('🧹 Rol de prueba eliminado');
    }
    
    // 6. Probar inserción en User (con usuario de auth existente)
    if (dbUsers && dbUsers.length > 0) {
      const existingUser = dbUsers[0];
      const testUserId = existingUser.id;
      
      // Verificar si el usuario ya tiene un perfil
      const { data: existingProfile } = await supabase
        .from('User')
        .select('*')
        .eq('id', testUserId)
        .single();
      
      if (!existingProfile) {
        // Crear perfil de prueba
        const { data: newProfile, error: insertUserError } = await supabase
          .from('User')
          .insert({
            id: testUserId,
            name: 'Usuario Prueba Service',
            email: 'test.service@example.com',
            username: 'testservice',
            roleId: roles?.[0]?.id || 1,
            department: 'SISTEMAS',
            isActive: true,
            isCashier: false
          })
          .select()
          .single();
        
        if (insertUserError) {
          console.log('❌ Insertar User:', insertUserError.message);
        } else {
          console.log('✅ Insertar User:', '✅ OK');
          
          // Limpiar perfil de prueba
          await supabase
            .from('User')
            .delete()
            .eq('id', testUserId);
          console.log('🧹 Perfil de prueba eliminado');
        }
      } else {
        console.log('ℹ️ Usuario ya tiene perfil, saltando prueba de inserción');
      }
    }
    
    console.log('\n🎉 Todas las pruebas completadas');
    
  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
    console.error('Stack:', error.stack);
  }
}

testServiceClient(); 