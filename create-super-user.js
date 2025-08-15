// Script para crear super usuario
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSuperUser() {
  try {
    console.log('🔧 Creando super usuario...');
    
    // 1. Crear usuario en auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'edu@termasllifen.cl',
      password: '123123..',
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: {
        name: 'Eduardo',
        role: 'super_admin'
      }
    });

    if (authError) {
      console.error('❌ Error creando usuario auth:', authError);
      return;
    }

    console.log('✅ Usuario creado en auth.users:', authUser.user.id);

    // 2. Verificar si existe tabla users en public
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%user%');

    if (tablesError) {
      console.log('⚠️  No se pudo verificar tablas:', tablesError);
    } else {
      console.log('📋 Tablas relacionadas con usuarios:', tables);
    }

    // 3. Si existe tabla users en public, insertar ahí también
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'edu@termasllifen.cl')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('⚠️  Error verificando usuario existente:', checkError);
    }

    if (!existingUser) {
      const { data: publicUser, error: publicError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: 'edu@termasllifen.cl',
          name: 'Eduardo',
          role: 'admin',
          is_admin: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (publicError) {
        console.log('⚠️  Error insertando en tabla users:', publicError);
      } else {
        console.log('✅ Usuario creado en tabla public.users:', publicUser.id);
      }
    } else {
      console.log('ℹ️  Usuario ya existe en tabla public.users');
    }

    console.log('\n🎉 Super usuario creado exitosamente:');
    console.log('   📧 Email: edu@termasllifen.cl');
    console.log('   🔑 Password: 123123..');
    console.log('   👤 Rol: Super Admin');
    console.log('   🆔 ID:', authUser.user.id);

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

createSuperUser();