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

async function verificarVentasSinCliente() {
  console.log('🔍 Verificando ventas sin cliente asociado...');
  
  try {
    // 1. Obtener todas las ventas
    const { data: ventas, error: errorVentas } = await supabase
      .from('POSSale')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (errorVentas) {
      console.error('❌ Error obteniendo ventas:', errorVentas);
      return;
    }
    
    console.log(`📊 Total de ventas encontradas: ${ventas.length}`);
    
    // 2. Filtrar ventas sin cliente asociado
    const ventasSinCliente = ventas.filter(venta => !venta.clientId);
    const ventasConCliente = ventas.filter(venta => venta.clientId);
    
    console.log(`\n📋 RESUMEN:`);
    console.log(`✅ Ventas con cliente: ${ventasConCliente.length}`);
    console.log(`⚠️ Ventas sin cliente: ${ventasSinCliente.length}`);
    
    if (ventasSinCliente.length > 0) {
      console.log(`\n⚠️ VENTAS SIN CLIENTE ASOCIADO:`);
      ventasSinCliente.forEach((venta, index) => {
        console.log(`${index + 1}. ${venta.saleNumber} - ${venta.customerName} - ${new Date(venta.createdAt).toLocaleString()}`);
      });
    }
    
    // 3. Verificar ventas con "Cliente sin nombre" pero con clientId
    const ventasConClienteSinNombre = ventas.filter(venta => 
      venta.clientId && venta.customerName === 'Cliente sin nombre'
    );
    
    if (ventasConClienteSinNombre.length > 0) {
      console.log(`\n🔧 VENTAS CON CLIENTE PERO NOMBRE INCORRECTO:`);
      ventasConClienteSinNombre.forEach((venta, index) => {
        console.log(`${index + 1}. ${venta.saleNumber} - Cliente ID: ${venta.clientId} - ${new Date(venta.createdAt).toLocaleString()}`);
      });
    }
    
    // 4. Mostrar las últimas 5 ventas para verificar
    console.log(`\n📋 ÚLTIMAS 5 VENTAS:`);
    ventas.slice(0, 5).forEach((venta, index) => {
      const status = venta.clientId ? '✅ Con cliente' : '⚠️ Sin cliente';
      console.log(`${index + 1}. ${venta.saleNumber} - ${venta.customerName} - ${status} - ${new Date(venta.createdAt).toLocaleString()}`);
    });
    
    // 5. Estadísticas adicionales
    const ventasConNombreValido = ventas.filter(venta => 
      venta.customerName && venta.customerName !== 'Cliente sin nombre'
    );
    
    console.log(`\n📊 ESTADÍSTICAS FINALES:`);
    console.log(`✅ Ventas con nombre válido: ${ventasConNombreValido.length}`);
    console.log(`⚠️ Ventas con "Cliente sin nombre": ${ventas.length - ventasConNombreValido.length}`);
    console.log(`🔧 Ventas que necesitan corrección: ${ventasSinCliente.length + ventasConClienteSinNombre.length}`);
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la verificación
verificarVentasSinCliente()
  .then(() => {
    console.log('\n🏁 Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }); 