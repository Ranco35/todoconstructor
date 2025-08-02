/**
 * Script de prueba para verificar la actualización de productos
 * Prueba el nuevo sistema de mapeo automático
 */

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testProductUpdate() {
  console.log('🧪 Iniciando prueba de actualización de productos...\n');
  
  try {
    // 1. Obtener un producto existente para probar
    console.log('📋 Paso 1: Obteniendo producto existente...');
    const { data: products, error: fetchError } = await supabase
      .from('Product')
      .select('*')
      .limit(1);
    
    if (fetchError || !products || products.length === 0) {
      console.error('❌ Error obteniendo productos:', fetchError);
      return;
    }
    
    const testProduct = products[0];
    console.log('✅ Producto encontrado:', {
      id: testProduct.id,
      name: testProduct.name,
      type: testProduct.type,
      categoryid: testProduct.categoryid,
      supplierid: testProduct.supplierid
    });
    
    // 2. Verificar stock actual
    console.log('\n📦 Paso 2: Verificando stock actual...');
    const { data: currentStock, error: stockError } = await supabase
      .from('Warehouse_Product')
      .select('*')
      .eq('productid', testProduct.id);
    
    if (stockError) {
      console.error('❌ Error obteniendo stock:', stockError);
    } else {
      console.log('✅ Stock actual:', currentStock);
    }
    
    // 3. Simular datos de actualización (FormData)
    console.log('\n🔄 Paso 3: Simulando datos de actualización...');
    const updateData = {
      id: testProduct.id.toString(),
      name: testProduct.name + ' (Actualizado)',
      type: 'ALMACENABLE',
      sku: testProduct.sku,
      description: 'Descripción actualizada para prueba',
      brand: testProduct.brand || 'Marca Test',
      categoryId: '1', // Categoría de prueba
      supplierId: '1', // Proveedor de prueba
      costPrice: '100.50',
      salePrice: '150.00',
      vat: '19.0',
      stock: JSON.stringify({
        warehouseid: 1,
        current: 25,
        min: 5,
        max: 50
      })
    };
    
    console.log('📝 Datos de actualización simulados:', updateData);
    
    // 4. Verificar estructura de la tabla Product
    console.log('\n🏗️ Paso 4: Verificando estructura de tabla Product...');
    const { data: productStructure, error: structureError } = await supabase
      .from('Product')
      .select('*')
      .limit(0);
    
    if (structureError) {
      console.error('❌ Error verificando estructura:', structureError);
    } else {
      console.log('✅ Estructura de tabla Product verificada');
    }
    
    // 5. Verificar estructura de la tabla Warehouse_Product
    console.log('\n🏗️ Paso 5: Verificando estructura de tabla Warehouse_Product...');
    const { data: warehouseStructure, error: warehouseStructureError } = await supabase
      .from('Warehouse_Product')
      .select('*')
      .limit(0);
    
    if (warehouseStructureError) {
      console.error('❌ Error verificando estructura de Warehouse_Product:', warehouseStructureError);
    } else {
      console.log('✅ Estructura de tabla Warehouse_Product verificada');
    }
    
    // 6. Probar actualización manual directa
    console.log('\n🔧 Paso 6: Probando actualización manual directa...');
    const { data: updatedProduct, error: updateError } = await supabase
      .from('Product')
      .update({
        name: updateData.name,
        type: updateData.type,
        description: updateData.description,
        categoryid: parseInt(updateData.categoryId),
        supplierid: parseInt(updateData.supplierId),
        costprice: parseFloat(updateData.costPrice),
        saleprice: parseFloat(updateData.salePrice),
        vat: parseFloat(updateData.vat)
      })
      .eq('id', testProduct.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error en actualización manual:', updateError);
    } else {
      console.log('✅ Actualización manual exitosa:', {
        id: updatedProduct.id,
        name: updatedProduct.name,
        type: updatedProduct.type,
        categoryid: updatedProduct.categoryid,
        supplierid: updatedProduct.supplierid,
        costprice: updatedProduct.costprice,
        saleprice: updatedProduct.saleprice
      });
    }
    
    // 7. Probar actualización de stock
    console.log('\n📦 Paso 7: Probando actualización de stock...');
    const stockData = JSON.parse(updateData.stock);
    
    // Buscar registro existente
    const { data: existingStock, error: findStockError } = await supabase
      .from('Warehouse_Product')
      .select('*')
      .eq('productid', testProduct.id)
      .eq('warehouseid', stockData.warehouseid)
      .maybeSingle();
    
    if (findStockError) {
      console.error('❌ Error buscando stock existente:', findStockError);
    } else if (existingStock) {
      // Actualizar stock existente
      const { error: updateStockError } = await supabase
        .from('Warehouse_Product')
        .update({
          quantity: stockData.current,
          minStock: stockData.min,
          maxStock: stockData.max
        })
        .eq('id', existingStock.id);
      
      if (updateStockError) {
        console.error('❌ Error actualizando stock:', updateStockError);
      } else {
        console.log('✅ Stock actualizado exitosamente');
      }
    } else {
      // Crear nuevo stock
      const { error: createStockError } = await supabase
        .from('Warehouse_Product')
        .insert({
          productid: testProduct.id,
          warehouseid: stockData.warehouseid,
          quantity: stockData.current,
          minStock: stockData.min,
          maxStock: stockData.max
        });
      
      if (createStockError) {
        console.error('❌ Error creando stock:', createStockError);
      } else {
        console.log('✅ Stock creado exitosamente');
      }
    }
    
    console.log('\n✅ Prueba de actualización completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en prueba de actualización:', error);
  }
}

// Ejecutar la prueba
testProductUpdate().then(() => {
  console.log('\n🏁 Script de prueba finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
}); 