const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuración de Supabase - intentar obtener de variables de entorno
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Si no están configuradas, usar valores por defecto para desarrollo local
if (!supabaseUrl) {
  supabaseUrl = 'http://127.0.0.1:54321';
  console.log('⚠️  Usando URL de Supabase local:', supabaseUrl);
}

if (!supabaseServiceKey) {
  supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  console.log('⚠️  Usando service key de Supabase local');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkInventoryStatus() {
  console.log('🔍 Verificando estado del inventario...\n');

  try {
    // 1. Verificar productos
    console.log('📦 PRODUCTOS:');
    const { data: products, count: totalProducts } = await supabase
      .from('Product')
      .select('*', { count: 'exact' });

    console.log(`   Total productos: ${totalProducts || 0}`);
    
    if (products && products.length > 0) {
      console.log('   Primeros 3 productos:');
      products.slice(0, 3).forEach(product => {
        console.log(`   - ${product.name} (ID: ${product.id})`);
      });
    } else {
      console.log('   ⚠️  No hay productos en la base de datos');
    }

    // 2. Verificar bodegas
    console.log('\n🏭 BODEGAS:');
    const { data: warehouses, count: totalWarehouses } = await supabase
      .from('Warehouse')
      .select('*', { count: 'exact' });

    console.log(`   Total bodegas: ${totalWarehouses || 0}`);
    
    if (warehouses && warehouses.length > 0) {
      console.log('   Bodegas disponibles:');
      warehouses.forEach(warehouse => {
        console.log(`   - ${warehouse.name} (ID: ${warehouse.id}) - ${warehouse.location || 'Sin ubicación'}`);
      });
    } else {
      console.log('   ⚠️  No hay bodegas en la base de datos');
    }

    // 3. Verificar productos en bodegas
    console.log('\n📊 PRODUCTOS EN BODEGAS:');
    const { data: warehouseProducts, count: totalWarehouseProducts } = await supabase
      .from('Warehouse_Product')
      .select(`
        *,
        Product (name),
        Warehouse (name)
      `, { count: 'exact' });

    console.log(`   Total productos en bodegas: ${totalWarehouseProducts || 0}`);
    
    if (warehouseProducts && warehouseProducts.length > 0) {
      console.log('   Productos con stock:');
      warehouseProducts.forEach(wp => {
        console.log(`   - ${wp.Product?.name || 'Producto sin nombre'} en ${wp.Warehouse?.name || 'Bodega sin nombre'}: ${wp.quantity} unidades (mín: ${wp.minStock || 0})`);
      });

      // Calcular estadísticas
      const productsWithStock = warehouseProducts.filter(wp => wp.quantity > 0).length;
      const productsWithoutStock = warehouseProducts.filter(wp => wp.quantity === 0).length;
      const lowStockProducts = warehouseProducts.filter(wp => wp.quantity < (wp.minStock || 0)).length;

      console.log('\n   📈 ESTADÍSTICAS:');
      console.log(`   - Productos con stock: ${productsWithStock}`);
      console.log(`   - Productos sin stock: ${productsWithoutStock}`);
      console.log(`   - Productos con stock bajo: ${lowStockProducts}`);

      // Calcular valor total
      const { data: productsWithValue } = await supabase
        .from('Warehouse_Product')
        .select(`
          quantity,
          Product (costprice, saleprice)
        `)
        .gt('quantity', 0);

      const totalValue = productsWithValue?.reduce((total, item) => {
        const price = item.Product?.costprice || item.Product?.saleprice || 0;
        return total + (price * item.quantity);
      }, 0) || 0;

      console.log(`   - Valor total del inventario: $${totalValue.toLocaleString('es-CL')}`);
    } else {
      console.log('   ⚠️  No hay productos asignados a bodegas');
    }

    // 4. Verificar categorías
    console.log('\n📂 CATEGORÍAS:');
    const { data: categories, count: totalCategories } = await supabase
      .from('Category')
      .select('*', { count: 'exact' });

    console.log(`   Total categorías: ${totalCategories || 0}`);
    
    if (categories && categories.length > 0) {
      console.log('   Categorías disponibles:');
      categories.forEach(category => {
        console.log(`   - ${category.name} (ID: ${category.id})`);
      });
    } else {
      console.log('   ⚠️  No hay categorías en la base de datos');
    }

    // 5. Verificar proveedores
    console.log('\n🏢 PROVEEDORES:');
    const { data: suppliers, count: totalSuppliers } = await supabase
      .from('Supplier')
      .select('*', { count: 'exact' });

    console.log(`   Total proveedores: ${totalSuppliers || 0}`);
    
    if (suppliers && suppliers.length > 0) {
      console.log('   Proveedores disponibles:');
      suppliers.slice(0, 3).forEach(supplier => {
        console.log(`   - ${supplier.name} (ID: ${supplier.id})`);
      });
      if (suppliers.length > 3) {
        console.log(`   ... y ${suppliers.length - 3} más`);
      }
    } else {
      console.log('   ⚠️  No hay proveedores en la base de datos');
    }

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    console.error('Detalles del error:', error.message);
  }
}

// Ejecutar la verificación
checkInventoryStatus(); 