const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mmfdbxqtxaicjwwwwdjc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tZmRieHF0eGFpY2p3d3d3ZGpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxODk4MDU4MSwiZXhwIjoyMDM0NTU2NTgxfQ.Nh6-aVE_Pqfxf8Pj-XyFu5ygJjN4cAhZqWh-gWQlHPE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyClientsCount() {
  try {
    console.log('🔍 Verificando clientes en Supabase...');
    
    // Contar todos los clientes
    const { count: totalCount, error: countError } = await supabase
      .from('Client')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error contando clientes:', countError);
      return;
    }
    
    console.log(`📊 Total de clientes en BD: ${totalCount}`);
    
    // Obtener los primeros 10 clientes para ver detalles
    const { data: clients, error: selectError } = await supabase
      .from('Client')
      .select('id, nombrePrincipal, tipoCliente, email, estado, fechaCreacion')
      .order('id', { ascending: true })
      .limit(10);
    
    if (selectError) {
      console.error('❌ Error obteniendo clientes:', selectError);
      return;
    }
    
    console.log('\n👥 Clientes encontrados:');
    clients.forEach((client, index) => {
      console.log(`${index + 1}. ID: ${client.id} | ${client.nombrePrincipal} | ${client.tipoCliente} | ${client.email || 'Sin email'} | Estado: ${client.estado}`);
    });
    
    // Verificar estados
    const { count: activosCount } = await supabase
      .from('Client')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'activo');
    
    const { count: inactivosCount } = await supabase
      .from('Client')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'inactivo');
    
    console.log(`\n📈 Estadísticas:`);
    console.log(`  - Activos: ${activosCount}`);
    console.log(`  - Inactivos: ${inactivosCount}`);
    console.log(`  - Total: ${totalCount}`);
    
  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

verifyClientsCount(); 