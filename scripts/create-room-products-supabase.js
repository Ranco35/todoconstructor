const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');

// Obtener configuración de Supabase CLI
function getSupabaseConfig() {
  try {
    const configOutput = execSync('npx supabase status --output json', { encoding: 'utf8' });
    const config = JSON.parse(configOutput);
    return {
      url: config.api.url,
      key: config.api.service_role_key
    };
  } catch (error) {
    console.error('❌ Error obteniendo configuración de Supabase CLI:', error.message);
    console.log('💡 Asegúrate de que Supabase esté iniciado: npx supabase start');
    process.exit(1);
  }
}

const config = getSupabaseConfig();
const supabase = createClient(config.url, config.key);

async function createRoomProducts() {
  console.log('🚀 Iniciando creación de productos reales para habitaciones...\n');
  console.log(`🔗 Conectando a: ${config.url}\n`);

  try {
    // 1. Obtener todas las habitaciones activas
    console.log('📋 Obteniendo habitaciones activas...');
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, number, type, price_per_night, description')
      .eq('is_active', true)
      .order('number');

    if (roomsError) {
      throw new Error(`Error obteniendo habitaciones: ${roomsError.message}`);
    }

    if (!rooms || rooms.length === 0) {
      console.log('ℹ️ No hay habitaciones activas para procesar');
      return;
    }

    console.log(`✅ Encontradas ${rooms.length} habitaciones activas\n`);

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // 2. Para cada habitación, crear o actualizar el producto real
    for (const room of rooms) {
      console.log(`🏨 Procesando habitación ${room.number} (${room.type})...`);

      // Buscar si ya existe un producto real para esta habitación
      const { data: existingProduct, error: searchError } = await supabase
        .from('Product')
        .select('id, name, price')
        .or(`code.eq.habitacion_${room.number},name.ilike.%${room.number}%`)
        .limit(1)
        .single();

      if (searchError && !searchError.details?.includes('No rows')) {
        console.error(`❌ Error buscando producto para habitación ${room.number}:`, searchError.message);
        continue;
      }

      const productData = {
        code: `habitacion_${room.number}`,
        name: `Habitación ${room.number} - ${room.type}`,
        description: room.description || `Habitación ${room.number} de tipo ${room.type}`,
        price: room.price_per_night,
        category: 'Habitaciones',
        type: 'SERVICIO',
        is_active: true,
        sku: `HAB-${room.number.toString().padStart(3, '0')}`,
        unit: 'noche',
        vat: 19,
        cost: room.price_per_night * 0.7, // Costo estimado al 70% del precio
        min_stock: 0,
        max_stock: 1,
        current_stock: 1,
        warehouse_id: 1 // Asumiendo que existe una bodega con ID 1
      };

      if (existingProduct) {
        // Actualizar producto existente
        console.log(`  🔄 Actualizando producto existente (ID: ${existingProduct.id})...`);
        const { error: updateError } = await supabase
          .from('Product')
          .update(productData)
          .eq('id', existingProduct.id);

        if (updateError) {
          console.error(`  ❌ Error actualizando producto:`, updateError.message);
        } else {
          console.log(`  ✅ Producto actualizado: ${productData.name} - $${productData.price.toLocaleString()}`);
          updatedCount++;
        }
      } else {
        // Crear nuevo producto
        console.log(`  ➕ Creando nuevo producto...`);
        const { error: createError } = await supabase
          .from('Product')
          .insert(productData);

        if (createError) {
          console.error(`  ❌ Error creando producto:`, createError.message);
        } else {
          console.log(`  ✅ Producto creado: ${productData.name} - $${productData.price.toLocaleString()}`);
          createdCount++;
        }
      }
    }

    console.log('\n📊 RESUMEN DE OPERACIÓN:');
    console.log(`✅ Productos creados: ${createdCount}`);
    console.log(`🔄 Productos actualizados: ${updatedCount}`);
    console.log(`⏭️ Productos omitidos: ${skippedCount}`);
    console.log(`📦 Total procesados: ${createdCount + updatedCount + skippedCount}`);

    if (createdCount > 0 || updatedCount > 0) {
      console.log('\n🎉 ¡Productos reales creados/actualizados exitosamente!');
      console.log('💡 Ahora puedes ir a la página de productos modulares y la sincronización funcionará correctamente.');
    }

  } catch (error) {
    console.error('💥 Error en la operación:', error);
    process.exit(1);
  }
}

// Ejecutar el script
createRoomProducts(); 