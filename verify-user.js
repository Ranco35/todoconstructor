// Script para verificar y corregir el usuario
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyAndFixUser() {
  try {
    console.log('🔍 Verificando usuario...');
    
    // 1. Buscar el usuario por email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listando usuarios:', listError);
      return;
    }

    const user = users.users.find(u => u.email === 'edu@termasllifen.cl');
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Email confirmado:', user.email_confirmed_at ? '✅ Sí' : '❌ No');
    console.log('   Creado:', user.created_at);
    console.log('   Última conexión:', user.last_sign_in_at || 'Nunca');

    // 2. Si el email no está confirmado, confirmarlo
    if (!user.email_confirmed_at) {
      console.log('🔧 Confirmando email...');
      
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { 
          email_confirm: true,
          user_metadata: {
            name: 'Eduardo',
            role: 'super_admin'
          }
        }
      );

      if (updateError) {
        console.error('❌ Error confirmando email:', updateError);
      } else {
        console.log('✅ Email confirmado exitosamente');
      }
    }

    // 3. Actualizar password para asegurar que esté correcto
    console.log('🔑 Actualizando password...');
    
    const { data: pwdUpdate, error: pwdError } = await supabase.auth.admin.updateUserById(
      user.id,
      { 
        password: '123123..',
        email_confirm: true
      }
    );

    if (pwdError) {
      console.error('❌ Error actualizando password:', pwdError);
    } else {
      console.log('✅ Password actualizado exitosamente');
    }

    // 4. Probar login con las credenciales
    console.log('🧪 Probando login...');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'edu@termasllifen.cl',
      password: '123123..'
    });

    if (loginError) {
      console.error('❌ Error en login de prueba:', loginError);
    } else {
      console.log('✅ Login de prueba exitoso');
      console.log('   Usuario ID:', loginData.user.id);
      console.log('   Access Token:', loginData.session.access_token ? 'Generado' : 'No generado');
    }

    console.log('\n🎉 Verificación completada');
    console.log('📋 Credenciales finales:');
    console.log('   📧 Email: edu@termasllifen.cl');
    console.log('   🔑 Password: 123123..');

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

verifyAndFixUser();