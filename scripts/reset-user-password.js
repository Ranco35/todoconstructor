require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// IMPORTANTE: Este script usa la clave de servicio para tener privilegios de administrador.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('La URL de Supabase o la Service Role Key no se encuentran. Asegúrate de que estén en tu archivo .env.local.');
  process.exit(1);
}

// Crear un cliente de Supabase con privilegios de administrador
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPassword() {
  const email = 'edu@admintermas.com';
  const newPassword = 'password123'; // Nueva contraseña simple y segura

  try {
    console.log(`Intentando encontrar al usuario con el email: ${email}`);
    
    // Con el cliente admin, listamos los usuarios para encontrar el que coincida
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) throw listError;

    const user = users.find(u => u.email === email);

    if (!user) {
      console.error(`Usuario con email ${email} no encontrado en Supabase Auth.`);
      return;
    }

    console.log(`Usuario encontrado con ID: ${user.id}. Intentando restablecer la contraseña...`);

    // Actualizamos el usuario por su ID
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) throw updateError;

    console.log(`Contraseña actualizada exitosamente para ${updatedUser.user.email}.`);
    console.log(`Ahora puedes iniciar sesión con la nueva contraseña: ${newPassword}`);

  } catch (error) {
    console.error('Error al restablecer la contraseña:', error.message);
  }
}

resetPassword(); 