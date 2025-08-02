require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function corregirVentaREC000026Nuevamente() {
  console.log('🔧 Corrigiendo venta REC-000026 nuevamente...');
  
  try {
    // 1. Buscar la venta REC-000026
    const { data: venta, error: errorVenta } = await supabase
      .from('POSSale')
      .select('*')
      .eq('saleNumber', 'REC-000026')
      .single();
    
    if (errorVenta) {
      console.error('❌ Error buscando venta REC-000026:', errorVenta);
      return;
    }
    
    if (!venta) {
      console.error('❌ Venta REC-000026 no encontrada');
      return;
    }
    
    console.log('📋 Venta encontrada:', {
      id: venta.id,
      saleNumber: venta.saleNumber,
      customerName: venta.customerName,
      clientId: venta.clientId,
      createdAt: venta.createdAt
    });
    
    // 2. Si tiene clientId, obtener información del cliente
    if (venta.clientId) {
      const { data: cliente, error: errorCliente } = await supabase
        .from('Client')
        .select('*')
        .eq('id', venta.clientId)
        .single();
      
      if (errorCliente) {
        console.error('❌ Error obteniendo cliente:', errorCliente);
        return;
      }
      
      if (cliente) {
        // Generar nombre del cliente
        let nombreCliente = 'Cliente sin nombre';
        if (cliente.tipoCliente === 'EMPRESA') {
          nombreCliente = cliente.razonSocial || cliente.nombrePrincipal || 'Empresa sin nombre';
        } else {
          const nombre = cliente.nombrePrincipal || '';
          const apellido = cliente.apellido || '';
          nombreCliente = `${nombre} ${apellido}`.trim() || 'Cliente sin nombre';
        }
        
        console.log('👤 Cliente encontrado:', {
          id: cliente.id,
          nombre: nombreCliente,
          tipo: cliente.tipoCliente,
          rut: cliente.rut
        });
        
        // 3. Actualizar la venta con el nombre correcto
        const { error: errorUpdate } = await supabase
          .from('POSSale')
          .update({ customerName: nombreCliente })
          .eq('id', venta.id);
        
        if (errorUpdate) {
          console.error('❌ Error actualizando venta:', errorUpdate);
          return;
        }
        
        console.log('✅ Venta REC-000026 corregida exitosamente');
        console.log('📝 Nombre actualizado:', nombreCliente);
        
      } else {
        console.log('⚠️ Cliente no encontrado, manteniendo "Cliente sin nombre"');
      }
    } else {
      console.log('ℹ️ Venta sin cliente asociado, manteniendo "Cliente sin nombre"');
    }
    
    // 4. Verificar el resultado
    const { data: ventaVerificada, error: errorVerificacion } = await supabase
      .from('POSSale')
      .select('*')
      .eq('saleNumber', 'REC-000026')
      .single();
    
    if (!errorVerificacion && ventaVerificada) {
      console.log('✅ Verificación final:', {
        saleNumber: ventaVerificada.saleNumber,
        customerName: ventaVerificada.customerName,
        clientId: ventaVerificada.clientId
      });
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la corrección
corregirVentaREC000026Nuevamente()
  .then(() => {
    console.log('🏁 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }); 