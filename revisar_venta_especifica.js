require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function revisarVentaEspecifica() {
    console.log('🔍 REVISANDO VENTA REC-000026 (ID: 33)...\n');

    try {
        // 1. Ver la venta específica
        console.log('📊 1. VENTA REC-000026:');
        const { data: venta, error: errorVenta } = await supabase
            .from('POSSale')
            .select('id, saleNumber, customerName, clientId, createdAt, total, paymentMethod, status')
            .eq('saleNumber', 'REC-000026')
            .single();

        if (errorVenta) {
            console.error('❌ Error al obtener venta:', errorVenta);
        } else {
            console.log('✅ Venta encontrada:');
            console.log(`   ID: ${venta.id}`);
            console.log(`   Número: ${venta.saleNumber}`);
            console.log(`   Cliente: "${venta.customerName}"`);
            console.log(`   ClientID: ${venta.clientId}`);
            console.log(`   Total: ${venta.total}`);
            console.log(`   Método: ${venta.paymentMethod}`);
            console.log(`   Estado: ${venta.status}`);
            console.log(`   Fecha: ${venta.createdAt}`);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // 2. Ver el cliente asociado
        if (venta?.clientId) {
            console.log('👤 2. CLIENTE ASOCIADO (ID: 37):');
            const { data: cliente, error: errorCliente } = await supabase
                .from('Client')
                .select('id, nombrePrincipal, apellido, razonSocial, tipoCliente, rut')
                .eq('id', venta.clientId)
                .single();

            if (errorCliente) {
                console.error('❌ Error al obtener cliente:', errorCliente);
            } else {
                console.log('✅ Cliente encontrado:');
                console.log(`   ID: ${cliente.id}`);
                console.log(`   Nombre: "${cliente.nombrePrincipal}"`);
                console.log(`   Apellido: "${cliente.apellido}"`);
                console.log(`   Razón Social: "${cliente.razonSocial}"`);
                console.log(`   Tipo: ${cliente.tipoCliente}`);
                console.log(`   RUT: ${cliente.rut}`);

                // Construir nombre completo
                let nombreCompleto = 'Cliente sin nombre';
                if (cliente.tipoCliente === 'Empresa' && cliente.razonSocial) {
                    nombreCompleto = cliente.razonSocial;
                } else if (cliente.nombrePrincipal) {
                    nombreCompleto = `${cliente.nombrePrincipal} ${cliente.apellido || ''}`.trim();
                }

                console.log(`   Nombre completo: "${nombreCompleto}"`);
            }
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // 3. Ver todas las ventas del cliente 37
        console.log('🛒 3. TODAS LAS VENTAS DEL CLIENTE 37:');
        const { data: ventasCliente, error: errorVentasCliente } = await supabase
            .from('POSSale')
            .select('id, saleNumber, customerName, clientId, createdAt, total')
            .eq('clientId', 37)
            .order('createdAt', { ascending: false });

        if (errorVentasCliente) {
            console.error('❌ Error al obtener ventas del cliente:', errorVentasCliente);
        } else {
            console.log(`✅ Ventas encontradas: ${ventasCliente?.length || 0}`);
            ventasCliente?.forEach(venta => {
                console.log(`   ID: ${venta.id}, Número: ${venta.saleNumber}, Cliente: "${venta.customerName}", Total: ${venta.total}`);
            });
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // 4. Ver las últimas 3 ventas creadas
        console.log('📈 4. ÚLTIMAS 3 VENTAS CREADAS:');
        const { data: ultimasVentas, error: errorUltimas } = await supabase
            .from('POSSale')
            .select('id, saleNumber, customerName, clientId, createdAt, total')
            .order('createdAt', { ascending: false })
            .limit(3);

        if (errorUltimas) {
            console.error('❌ Error al obtener últimas ventas:', errorUltimas);
        } else {
            console.log('✅ Últimas ventas:');
            ultimasVentas?.forEach(venta => {
                console.log(`   ID: ${venta.id}, Número: ${venta.saleNumber}, Cliente: "${venta.customerName}", ClientID: ${venta.clientId}, Total: ${venta.total}`);
            });
        }

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

revisarVentaEspecifica(); 