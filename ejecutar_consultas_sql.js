require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Configuración:');
console.log('   URL:', supabaseUrl ? '✅ Configurada' : '❌ No configurada');
console.log('   Key:', supabaseKey ? '✅ Configurada' : '❌ No configurada');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Faltan variables de entorno');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function ejecutarConsultas() {
    console.log('\n🔍 EJECUTANDO CONSULTAS SQL...\n');

    try {
        // 1. Ver las últimas 5 ventas
        console.log('📊 1. ÚLTIMAS 5 VENTAS:');
        const { data: ventas, error: errorVentas } = await supabase
            .from('POSSale')
            .select('id, saleNumber, customerName, clientId, createdAt, total')
            .order('createdAt', { ascending: false })
            .limit(5);

        if (errorVentas) {
            console.error('❌ Error al obtener ventas:', errorVentas);
        } else {
            console.log('✅ Ventas encontradas:', ventas?.length || 0);
            ventas?.forEach(venta => {
                console.log(`   ID: ${venta.id}, Número: ${venta.saleNumber}, Cliente: "${venta.customerName}", ClientID: ${venta.clientId}, Total: ${venta.total}`);
            });
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // 2. Buscar el cliente específico
        console.log('👤 2. BUSCANDO CLIENTE "119224357":');
        const { data: clientes, error: errorClientes } = await supabase
            .from('Client')
            .select('id, nombrePrincipal, apellido, razonSocial, tipoCliente, rut, createdAt')
            .or('nombrePrincipal.ilike.%119224357%,apellido.ilike.%119224357%,razonSocial.ilike.%119224357%,rut.ilike.%119224357%')
            .order('createdAt', { ascending: false });

        if (errorClientes) {
            console.error('❌ Error al buscar clientes:', errorClientes);
        } else {
            console.log('✅ Clientes encontrados:', clientes?.length || 0);
            clientes?.forEach(cliente => {
                console.log(`   ID: ${cliente.id}, Nombre: "${cliente.nombrePrincipal}", Apellido: "${cliente.apellido}", RUT: ${cliente.rut}`);
            });
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // 3. Ver la última venta con detalles del cliente
        console.log('🛒 3. ÚLTIMA VENTA CON DETALLES DEL CLIENTE:');
        const { data: ultimaVenta, error: errorUltimaVenta } = await supabase
            .from('POSSale')
            .select(`
                id, saleNumber, customerName, clientId, createdAt, total,
                Client!inner(id, nombrePrincipal, apellido, razonSocial, tipoCliente)
            `)
            .order('createdAt', { ascending: false })
            .limit(1);

        if (errorUltimaVenta) {
            console.error('❌ Error al obtener última venta:', errorUltimaVenta);
        } else {
            console.log('✅ Última venta encontrada:', ultimaVenta?.length || 0);
            ultimaVenta?.forEach(venta => {
                console.log(`   Venta ID: ${venta.id}, Número: ${venta.saleNumber}`);
                console.log(`   Cliente en venta: "${venta.customerName}"`);
                console.log(`   Cliente ID: ${venta.clientId}`);
                console.log(`   Cliente en BD: "${venta.Client?.nombrePrincipal} ${venta.Client?.apellido}"`);
                console.log(`   RUT: ${venta.Client?.rut}`);
                console.log(`   Total: ${venta.total}`);
            });
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // 4. Contar ventas por estado
        console.log('📈 4. ESTADÍSTICAS DE VENTAS:');
        const { data: todasVentas, error: errorTodas } = await supabase
            .from('POSSale')
            .select('customerName, clientId');

        if (errorTodas) {
            console.error('❌ Error al obtener todas las ventas:', errorTodas);
        } else {
            const total = todasVentas?.length || 0;
            const sinNombreNull = todasVentas?.filter(v => v.customerName === null).length || 0;
            const sinNombreVacio = todasVentas?.filter(v => v.customerName === '').length || 0;
            const clienteSinNombre = todasVentas?.filter(v => v.customerName === 'Cliente sin nombre').length || 0;
            const conClienteAsociado = todasVentas?.filter(v => v.clientId !== null).length || 0;
            const sinClienteAsociado = todasVentas?.filter(v => v.clientId === null).length || 0;

            console.log(`   Total ventas: ${total}`);
            console.log(`   Sin nombre (NULL): ${sinNombreNull}`);
            console.log(`   Sin nombre (vacío): ${sinNombreVacio}`);
            console.log(`   "Cliente sin nombre": ${clienteSinNombre}`);
            console.log(`   Con cliente asociado: ${conClienteAsociado}`);
            console.log(`   Sin cliente asociado: ${sinClienteAsociado}`);
        }

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

ejecutarConsultas(); 