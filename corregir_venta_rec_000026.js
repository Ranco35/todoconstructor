require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function corregirVentaEspecifica() {
    console.log('🔧 CORRIGIENDO VENTA REC-000026...\n');

    try {
        // 1. Obtener la venta específica
        const { data: venta, error: errorVenta } = await supabase
            .from('POSSale')
            .select('id, saleNumber, customerName, clientId')
            .eq('saleNumber', 'REC-000026')
            .single();

        if (errorVenta) {
            console.error('❌ Error al obtener venta:', errorVenta);
            return;
        }

        console.log(`📊 Venta encontrada: ID ${venta.id}, Cliente actual: "${venta.customerName}"`);

        // 2. Obtener el cliente asociado
        const { data: cliente, error: errorCliente } = await supabase
            .from('Client')
            .select('nombrePrincipal, apellido, razonSocial, tipoCliente')
            .eq('id', venta.clientId)
            .single();

        if (errorCliente) {
            console.error('❌ Error al obtener cliente:', errorCliente);
            return;
        }

        // 3. Construir nombre del cliente
        let nombreCliente = 'Cliente sin nombre';
        if (cliente.tipoCliente === 'Empresa' && cliente.razonSocial && cliente.razonSocial !== 'null') {
            nombreCliente = cliente.razonSocial;
        } else if (cliente.nombrePrincipal) {
            nombreCliente = `${cliente.nombrePrincipal} ${cliente.apellido || ''}`.trim();
        }

        console.log(`👤 Cliente en BD: "${cliente.nombrePrincipal} ${cliente.apellido}"`);
        console.log(`📝 Nombre a asignar: "${nombreCliente}"`);

        // 4. Actualizar la venta
        const { error: errorUpdate } = await supabase
            .from('POSSale')
            .update({ customerName: nombreCliente })
            .eq('id', venta.id);

        if (errorUpdate) {
            console.error('❌ Error al actualizar venta:', errorUpdate);
        } else {
            console.log('✅ Venta actualizada correctamente');
        }

        // 5. Verificar el resultado
        const { data: ventaActualizada, error: errorVerificacion } = await supabase
            .from('POSSale')
            .select('id, saleNumber, customerName, clientId')
            .eq('saleNumber', 'REC-000026')
            .single();

        if (errorVerificacion) {
            console.error('❌ Error al verificar venta:', errorVerificacion);
        } else {
            console.log(`\n🎯 RESULTADO FINAL:`);
            console.log(`   Venta: ${ventaActualizada.saleNumber}`);
            console.log(`   Cliente: "${ventaActualizada.customerName}"`);
            console.log(`   ClientID: ${ventaActualizada.clientId}`);
        }

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

corregirVentaEspecifica(); 