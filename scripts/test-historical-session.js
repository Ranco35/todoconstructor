require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testHistoricalSession() {
  try {
    console.log('🧪 Probando creación de sesión histórica...');
    
    // Simular los datos que vendrían del formulario
    const sessionData = {
      sessionNumber: 'HIST-001',
      openingAmount: 5000,
      closingAmount: 4800,
      date: '2024-12-15',
      status: 'closed',
      notes: 'Sesión histórica de prueba'
    };
    
    // Usar un usuario válido
    const userId = 'd5a89886-4457-4373-8014-d3e0c4426e35'; // Eduardo ppp
    
    // Preparar los datos para inserción (como en la función corregida)
    const insertData = {
      userId,
      cashRegisterId: 1,
      openingAmount: sessionData.openingAmount,
      currentAmount: sessionData.status === 'closed' ? sessionData.closingAmount : sessionData.openingAmount,
      openedAt: new Date(sessionData.date).toISOString(),
      status: sessionData.status,
      notes: sessionData.notes || `Sesion historica creada el ${new Date().toLocaleDateString()}`
    };
    
    // Solo agregar closedAt si la sesión está cerrada
    if (sessionData.status === 'closed') {
      insertData.closedAt = new Date(sessionData.date).toISOString();
    }
    
    console.log('📋 Datos a insertar:', insertData);
    
    const { data: historicalSession, error } = await supabase
      .from('CashSession')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error al crear sesión histórica:', error);
    } else {
      console.log('✅ Sesión histórica creada exitosamente');
      console.log('📋 Datos de la sesión:', historicalSession);
      
      // Limpiar - eliminar la sesión de prueba
      await supabase
        .from('CashSession')
        .delete()
        .eq('id', historicalSession.id);
      console.log('🧹 Sesión de prueba eliminada');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testHistoricalSession(); 