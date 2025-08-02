const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugProductsWarehouses() {
  console.log('🔍 Consultando productos y relaciones Warehouse_Product/Warehouse...\n');

  const { data: products, error } = await supabase
    .from('Product')
    .select(`
      id, name, sku, brand,
      Warehouse_Products:Warehouse_Product (
        id,
        quantity,
        warehouseId,
        warehouseid,
        productId,
        productid,
        Warehouse (
          id,
          name
        )
      )
    `)
    .limit(10);

  if (error) {
    console.error('❌ Error consultando productos:', error);
    return;
  }

  products.forEach((product, idx) => {
    console.log(`\n# Producto ${idx + 1}: ${product.name} (ID: ${product.id}, SKU: ${product.sku})`);
    if (product.Warehouse_Products && product.Warehouse_Products.length > 0) {
      product.Warehouse_Products.forEach((wp, i) => {
        console.log(`  - Warehouse_Product[${i}]:`);
        console.log(`      id: ${wp.id}`);
        console.log(`      quantity: ${wp.quantity}`);
        console.log(`      warehouseId: ${wp.warehouseId}`);
        console.log(`      warehouseid: ${wp.warehouseid}`);
        console.log(`      productId: ${wp.productId}`);
        console.log(`      productid: ${wp.productid}`);
        if (wp.Warehouse) {
          console.log(`      Warehouse: ${wp.Warehouse.name} (ID: ${wp.Warehouse.id})`);
        } else {
          console.log('      Warehouse: null');
        }
      });
    } else {
      console.log('  - Sin bodegas asociadas');
    }
  });
}

debugProductsWarehouses(); 