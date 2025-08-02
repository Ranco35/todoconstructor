require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function corregirVentasNull() {
    console.log('🔧 CORRIGIENDO VENTAS CON CUSTOMERNAME = NULL Y "null"...\n');

    try {
        // 1. Obtener todas las ventas con customerName = NULL o "null"
        const { data: ventasNull, error: errorVentasNull } = await supabase
            .from('POSSale')
            .select('id, customerName, clientId')
            .or('customerName.is.null,customerName.eq.null');

        if (errorVentasNull) {
            console.error('❌ Error al obtener ventas con customerName = NULL:', errorVentasNull);
            return;
        }

        console.log(`📊 Encontradas ${ventasNull?.length || 0} ventas con customerName = NULL`);

        // 2. Para cada venta, obtener el nombre del cliente y actualizar
        let actualizadas = 0;
        let conCliente = 0;
        let sinCliente = 0;

        for (const venta of ventasNull || []) {
            if (venta.clientId) {
                // Ventas con cliente asociado
                const { data: cliente, error: errorCliente } = await supabase
                    .from('Client')
                    .select('nombrePrincipal, apellido, razonSocial, tipoCliente')
                    .eq('id', venta.clientId)
                    .single();

                if (errorCliente) {
                    console.error(`❌ Error al obtener cliente ${venta.clientId}:`, errorCliente);
                    continue;
                }

                // Construir nombre del cliente
                let nombreCliente = 'Cliente sin nombre';
                if (cliente) {
                    if (cliente.tipoCliente === 'Empresa' && cliente.razonSocial) {
                        nombreCliente = cliente.razonSocial;
                    } else if (cliente.nombrePrincipal) {
                        nombreCliente = `${cliente.nombrePrincipal} ${cliente.apellido || ''}`.trim();
                    }
                }

                console.log(`   Venta ${venta.id}: Actualizando a "${nombreCliente}"`);

                // Actualizar la venta
                const { error: errorUpdate } = await supabase
                    .from('POSSale')
                    .update({ customerName: nombreCliente })
                    .eq('id', venta.id);

                if (errorUpdate) {
                    console.error(`❌ Error al actualizar venta ${venta.id}:`, errorUpdate);
                } else {
                    actualizadas++;
                    conCliente++;
                }
            } else {
                // Ventas sin cliente asociado
                console.log(`   Venta ${venta.id}: Actualizando a "Cliente sin nombre"`);

                const { error: errorUpdate } = await supabase
                    .from('POSSale')
                    .update({ customerName: 'Cliente sin nombre' })
                    .eq('id', venta.id);

                if (errorUpdate) {
                    console.error(`❌ Error al actualizar venta ${venta.id}:`, errorUpdate);
                } else {
                    actualizadas++;
                    sinCliente++;
                }
            }
        }

        // 3. Obtener estadísticas después de la corrección
        const { data: stats, error: errorStats } = await supabase
            .from('POSSale')
            .select('customerName, clientId');

        if (errorStats) {
            console.error('❌ Error al obtener estadísticas:', errorStats);
        } else {
            const total = stats?.length || 0;
            const sinNombreNull = stats?.filter(v => v.customerName === null).length || 0;
            const sinNombreVacio = stats?.filter(v => v.customerName === '').length || 0;
            const clienteSinNombre = stats?.filter(v => v.customerName === 'Cliente sin nombre').length || 0;
            const conClienteAsociado = stats?.filter(v => v.clientId !== null).length || 0;
            const sinClienteAsociado = stats?.filter(v => v.clientId === null).length || 0;

            console.log('\n📊 Estadísticas después de la corrección:');
            console.log(`   Total ventas: ${total}`);
            console.log(`   Sin nombre (NULL): ${sinNombreNull}`);
            console.log(`   Sin nombre (vacío): ${sinNombreVacio}`);
            console.log(`   "Cliente sin nombre": ${clienteSinNombre}`);
            console.log(`   Con cliente asociado: ${conClienteAsociado}`);
            console.log(`   Sin cliente asociado: ${sinClienteAsociado}`);
            console.log(`   Ventas corregidas: ${actualizadas} (${conCliente} con cliente, ${sinCliente} sin cliente)`);
        }

        console.log('\n✅ Corrección de ventas con customerName = NULL completada');

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

corregirVentasNull(); 