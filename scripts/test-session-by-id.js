require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔧 Verificando variables de entorno:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Presente' : 'Ausente');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Presente' : 'Ausente');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
console.log('✅ Cliente Supabase creado');

async function testSessionById() {
  try {
    console.log('🔍 1. Mostrando TODAS las sesiones abiertas:');
    const { data: allOpenSessions, error: allError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('status', 'open');
    
    console.log('Todas las sesiones abiertas:', allOpenSessions);
    console.log('Error al obtener todas:', allError);
    
    if (allOpenSessions && allOpenSessions.length > 0) {
      console.log('\n📊 Tipos de datos de los campos:');
      allOpenSessions.forEach((session, index) => {
        console.log(`Sesión ${index + 1}:`);
        console.log(`  id: ${session.id} (tipo: ${typeof session.id})`);
        console.log(`  status: ${session.status} (tipo: ${typeof session.status})`);
        console.log(`  cashRegisterId: ${session.cashRegisterId} (tipo: ${typeof session.cashRegisterId})`);
      });
    }

    console.log('\n🔍 2. Buscando CashSession específicamente por id=18:');
    const sessionId = 18;
    console.log('Buscando con id:', sessionId, '| Tipo:', typeof sessionId);
    
    const { data, error } = await supabase
      .from('CashSession')
      .select('*')
      .eq('id', sessionId)
      .eq('status', 'open')
      .single();
    
    console.log('Resultado data:', data);
    console.log('Resultado error:', error);
    
    if (error) {
      console.log('Detalles del error:', JSON.stringify(error, null, 2));
    }
  } catch (err) {
    console.error('❌ Error en testSessionById:', err);
  }
}

testSessionById(); 