const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProductExport() {
  console.log('🧪 Probando exportación de productos...');
  
  try {
    // 1. Verificar que hay productos en la base de datos
    const { data: products, error: countError } = await supabase
      .from('Product')
      .select('id, name, sku')
      .limit(5);

    if (countError) {
      console.error('❌ Error contando productos:', countError);
      return;
    }

    console.log(`✅ Productos encontrados: ${products?.length || 0}`);
    if (products && products.length > 0) {
      console.log('📋 Ejemplos de productos:', products.map(p => ({ id: p.id, name: p.name, sku: p.sku })));
    }

    // 2. Probar la consulta completa con joins
    const { data: productsWithJoins, error: joinError } = await supabase
      .from('Product')
      .select(`
        *,
        Category (
          id,
          name
        ),
        Supplier (
          id,
          name
        )
      `)
      .limit(3);

    if (joinError) {
      console.error('❌ Error en consulta con joins:', joinError);
      return;
    }

    console.log('✅ Consulta con joins exitosa');
    console.log('📄 Productos con relaciones:', productsWithJoins?.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.Category?.name,
      supplier: p.Supplier?.name
    })));

    // 3. Simular la transformación de datos
    const transformedProducts = (productsWithJoins || []).map(product => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      type: null, // La tabla Product no tiene columna 'type'
      description: product.description,
      brand: product.brand,
      costPrice: product.costprice,
      salePrice: product.saleprice,
      vat: product.vat,
      barcode: product.barcode,
      categoryName: product.Category?.name || null,
      categoryId: product.categoryid || null,
      supplierName: product.Supplier?.name || null,
      supplierId: product.supplierid || null,
      currentStock: null,
      minStock: null,
      maxStock: null,
      warehouseName: null,
      warehouseId: null,
    }));

    console.log('✅ Transformación de datos exitosa');
    console.log('📊 Datos transformados:', transformedProducts);

    // 4. Verificar que no hay errores en los datos
    const hasErrors = transformedProducts.some(p => {
      if (!p.name) {
        console.error('❌ Producto sin nombre:', p);
        return true;
      }
      return false;
    });

    if (hasErrors) {
      console.error('❌ Se encontraron errores en los datos');
      return;
    }

    console.log('✅ Todos los productos tienen datos válidos');

    // 5. Probar la API de exportación
    console.log('\n🌐 Probando API de exportación...');
    
    const response = await fetch('http://localhost:3000/api/products/export');
    
    if (!response.ok) {
      console.error('❌ Error en API de exportación:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('📄 Detalles del error:', errorText);
      return;
    }

    console.log('✅ API de exportación responde correctamente');
    console.log('📊 Headers de respuesta:', Object.fromEntries(response.headers.entries()));
    
    const blob = await response.blob();
    console.log('📄 Archivo generado:', {
      size: blob.size,
      type: blob.type
    });

    // Guardar el archivo para verificación
    const buffer = await blob.arrayBuffer();
    const filename = `test_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    fs.writeFileSync(filename, Buffer.from(buffer));
    console.log(`💾 Archivo guardado como: ${filename}`);

    console.log('\n🎉 ¡Prueba de exportación completada exitosamente!');

  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

testProductExport(); 