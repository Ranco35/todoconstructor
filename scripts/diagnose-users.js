const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseUsers() {
  console.log('🔍 DIAGNÓSTICO DE USUARIOS - SIN CAMBIOS\n');

  try {
    // 1. Verificar roles disponibles
    console.log('1️⃣ ROLES DISPONIBLES:');
    const { data: roles, error: rolesError } = await supabase
      .from('Role')
      .select('*')
      .order('id');
    
    if (rolesError) {
      console.error('Error consultando roles:', rolesError);
    } else {
      console.table(roles);
    }

    // 2. Buscar usuario eduardo específicamente
    console.log('\n2️⃣ USUARIO EDUARDO:');
    const { data: eduardoUsers, error: eduardoError } = await supabase
      .from('User')
      .select('*, Role(roleName)')
      .ilike('email', '%eduardo%');
    
    if (eduardoError) {
      console.error('Error consultando usuario eduardo:', eduardoError);
    } else {
      console.table(eduardoUsers);
    }

    // 3. Todos los usuarios activos con roles
    console.log('\n3️⃣ TODOS LOS USUARIOS ACTIVOS:');
    const { data: activeUsers, error: usersError } = await supabase
      .from('User')
      .select('*, Role(roleName)')
      .eq('isActive', true)
      .order('name');
    
    if (usersError) {
      console.error('Error consultando usuarios activos:', usersError);
    } else {
      console.log(`Total usuarios activos: ${activeUsers?.length || 0}`);
      if (activeUsers && activeUsers.length > 0) {
        console.table(activeUsers.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          roleId: user.roleId,
          roleName: user.Role?.roleName || 'SIN_ROL',
          isActive: user.isActive
        })));
      }
    }

    // 4. Usuarios sin rol asignado
    console.log('\n4️⃣ USUARIOS SIN ROL:');
    const { data: usersWithoutRole, error: noRoleError } = await supabase
      .from('User')
      .select('*')
      .is('roleId', null)
      .eq('isActive', true);
    
    if (noRoleError) {
      console.error('Error consultando usuarios sin rol:', noRoleError);
    } else {
      if (usersWithoutRole && usersWithoutRole.length > 0) {
        console.table(usersWithoutRole);
      } else {
        console.log('✅ No hay usuarios activos sin rol asignado');
      }
    }

    // 5. Probar la función getAllUsers simulada
    console.log('\n5️⃣ SIMULANDO getAllUsers() DE LA APP:');
    const { data: simulatedUsers, error: simulatedError } = await supabase
      .from('User')
      .select('*, Role(roleName)')
      .eq('isActive', true)
      .order('name', { ascending: true });

    if (simulatedError) {
      console.error('Error en simulación getAllUsers:', simulatedError);
    } else {
      console.log(`Usuarios encontrados por getAllUsers(): ${simulatedUsers?.length || 0}`);
      
      if (simulatedUsers && simulatedUsers.length > 0) {
        const mappedUsers = simulatedUsers.map(user => ({
          id: user.id,
          username: user.name,
          email: user.email,
          firstName: user.name.split(' ')[0] || user.name,
          lastName: user.name.split(' ').slice(1).join(' ') || '',
          role: user.Role ? user.Role.roleName : 'user',
          department: user.department,
          isCashier: user.isCashier || false,
          isActive: user.isActive,
          lastLogin: user.lastLogin ? new Date(user.lastLogin) : null
        }));
        
        console.table(mappedUsers);
      }
    }

    // 6. Verificar usuario eduardo específicamente con email exacto
    console.log('\n6️⃣ USUARIO EDUARDO@TERMASLLIFEN.CL EXACTO:');
    const { data: eduardoExact, error: eduardoExactError } = await supabase
      .from('User')
      .select('*, Role(roleName)')
      .eq('email', 'eduardo@termasllifen.cl');
    
    if (eduardoExactError) {
      console.error('Error consultando eduardo exacto:', eduardoExactError);
    } else {
      if (eduardoExact && eduardoExact.length > 0) {
        console.table(eduardoExact);
        
        // Mapear como lo hace la app
        const mappedEduardo = eduardoExact.map(user => ({
          id: user.id,
          username: user.name,
          email: user.email,
          firstName: user.name.split(' ')[0] || user.name,
          lastName: user.name.split(' ').slice(1).join(' ') || '',
          role: user.Role ? user.Role.roleName : 'user',
          roleId: user.roleId,
          rawRole: user.Role,
          department: user.department,
          isCashier: user.isCashier || false,
          isActive: user.isActive
        }));
        
        console.log('\n📋 EDUARDO MAPEADO COMO EN LA APP:');
        console.table(mappedEduardo);
      } else {
        console.log('❌ Usuario eduardo@termasllifen.cl NO encontrado');
      }
    }

    // 7. Verificar en auth.users
    console.log('\n7️⃣ VERIFICAR EN AUTH.USERS:');
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, email_confirmed_at, created_at')
      .ilike('email', '%eduardo%');
    
    if (authError) {
      console.log('ℹ️ No se pudo consultar auth.users (esperado en algunos casos)');
    } else {
      console.table(authUsers);
    }

  } catch (error) {
    console.error('❌ Error general en diagnóstico:', error);
  }
}

diagnoseUsers();