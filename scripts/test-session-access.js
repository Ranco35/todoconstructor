console.log('🧪 Probando acceso directo a la sesión...');

// Usar require para evitar problemas de import
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSessionAccess() {
  try {
    console.log('1️⃣ Verificando acceso a sesión actual...');
    
    // Obtener la sesión activa
    const { data: session, error } = await supabase
      .from('CashSession')
      .select(`
        *,
        User:userId (
          id,
          name,
          email
        )
      `)
      .eq('status', 'open')
      .eq('cashRegisterId', 1)
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Error obteniendo sesión:', error);
      return false;
    }

    if (!session) {
      console.log('⚠️ No hay sesión activa');
      return false;
    }

    console.log('✅ Sesión encontrada:', {
      id: session.id,
      usuario: session.User.name,
      montoActual: session.currentAmount,
      estado: session.status
    });

    console.log('2️⃣ Probando actualización de sesión...');
    
    // Probar actualizar las notas (sin cerrar)
    const { error: updateError } = await supabase
      .from('CashSession')
      .update({
        notes: `Prueba de acceso - ${new Date().toISOString()}`
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('❌ Error actualizando sesión:', updateError);
      return false;
    }

    console.log('✅ Sesión actualizada correctamente');
    
    console.log('3️⃣ Sistema funcionando correctamente');
    return true;

  } catch (error) {
    console.error('❌ Error general:', error);
    return false;
  }
}

testSessionAccess(); 