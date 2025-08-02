import { getSupabaseServerClient } from '@/lib/supabase-server';

export interface InventoryStats {
  totalProducts: number;
  activeWarehouses: number;
  lowStockProducts: number;
  totalValue: number;
  productsWithStock: number;
  productsWithoutStock: number;
  topSellingProduct?: {
    name: string;
    sales: number;
  };
  mainWarehouse?: {
    name: string;
    products: number;
  };
  lowStockItems: Array<{
    id: number;
    name: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    category?: string;
    supplier?: string;
  }>;
}

export async function getInventoryStats(): Promise<InventoryStats> {
  try {
    // Obtener estadísticas básicas
    const [
      totalProductsResult,
      warehousesResult,
      productsWithStockResult,
      productsWithoutStockResult,
      lowStockResult
    ] = await Promise.all([
      // Total de productos
      (await getSupabaseServerClient()).from('Product').select('*', { count: 'exact', head: true }),
      
      // Bodegas activas
      (await getSupabaseServerClient()).from('Warehouse').select('*', { count: 'exact', head: true }),
      
      // Productos con stock (usando Warehouse_Product)
      (await getSupabaseServerClient()).from('Warehouse_Product').select('*', { count: 'exact', head: true }).gt('quantity', 0),
      
      // Productos sin stock (usando Warehouse_Product)
      (await getSupabaseServerClient()).from('Warehouse_Product').select('*', { count: 'exact', head: true }).eq('quantity', 0),
      
      // Productos con stock bajo (quantity < minStock)
      (await getSupabaseServerClient())
        .from('Warehouse_Product')
        .select(`
          *,
          Product (
            id,
            name,
            Category (name),
            Supplier (name)
          )
        `)
        .lt('quantity', 'minStock')
    ]);

    // Calcular valor total del inventario
    const { data: productsWithValue } = await (await getSupabaseServerClient())
      .from('Warehouse_Product')
      .select(`
        quantity,
        Product (
          costprice,
          saleprice
        )
      `)
      .gt('quantity', 0);

    const totalValue = productsWithValue?.reduce((total, item) => {
      const price = item.Product?.costprice || item.Product?.saleprice || 0;
      return total + (price * item.quantity);
    }, 0) || 0;

    // Obtener producto más vendido (simulado por ahora)
    const { data: topSellingProduct } = await (await getSupabaseServerClient())
      .from('Product')
      .select('name')
      .limit(1)
      .single();

    // Obtener bodega principal (la que tiene más productos)
    const { data: warehousesWithCounts } = await (await getSupabaseServerClient())
      .from('Warehouse')
      .select(`
        id,
        name,
        Warehouse_Product (count)
      `)
      .order('Warehouse_Product(count)', { ascending: false })
      .limit(1)
      .single();

    // Procesar productos con stock bajo
    const lowStockItems = lowStockResult.data?.map(item => ({
      id: item.Product?.id || 0,
      name: item.Product?.name || 'Producto sin nombre',
      currentStock: item.quantity,
      minStock: item.minStock,
      maxStock: item.maxStock,
      category: item.Product?.Category?.name,
      supplier: item.Product?.Supplier?.name
    })) || [];

    return {
      totalProducts: totalProductsResult.count || 0,
      activeWarehouses: warehousesResult.count || 0,
      lowStockProducts: lowStockResult.count || 0,
      totalValue: Math.round(totalValue * 100) / 100, // Redondear a 2 decimales
      productsWithStock: productsWithStockResult.count || 0,
      productsWithoutStock: productsWithoutStockResult.count || 0,
      topSellingProduct: topSellingProduct ? {
        name: topSellingProduct.name,
        sales: 0 // Por ahora 0, se puede implementar cuando haya ventas
      } : undefined,
      mainWarehouse: warehousesWithCounts ? {
        name: warehousesWithCounts.name,
        products: warehousesWithCounts.Warehouse_Product?.length || 0
      } : undefined,
      lowStockItems
    };

  } catch (error) {
    console.error('Error obteniendo estadísticas de inventario:', error);
    return {
      totalProducts: 0,
      activeWarehouses: 0,
      lowStockProducts: 0,
      totalValue: 0,
      productsWithStock: 0,
      productsWithoutStock: 0,
      lowStockItems: []
    };
  }
}

export async function getLowStockProducts(limit: number = 10) {
  try {
    const { data: lowStockProducts } = await (await getSupabaseServerClient())
      .from('Warehouse_Product')
      .select(`
        *,
        Product (
          id,
          name,
          Category (name),
          Supplier (name)
        )
      `)
      .lt('quantity', 'minStock')
      .order('quantity', { ascending: true })
      .limit(limit);

    return lowStockProducts?.map(item => ({
      id: item.Product?.id || 0,
      name: item.Product?.name || 'Producto sin nombre',
      currentStock: item.quantity,
      minStock: item.minStock,
      maxStock: item.maxStock,
      category: item.Product?.Category?.name,
      supplier: item.Product?.Supplier?.name
    })) || [];

  } catch (error) {
    console.error('Error obteniendo productos con stock bajo:', error);
    return [];
  }
}

export async function getInventorySummary() {
  try {
    const [
      totalProducts,
      totalWarehouses,
      productsWithValue,
      lowStockCount
    ] = await Promise.all([
      (await getSupabaseServerClient()).from('Product').select('*', { count: 'exact', head: true }),
      (await getSupabaseServerClient()).from('Warehouse').select('*', { count: 'exact', head: true }),
      (await getSupabaseServerClient()).from('Warehouse_Product').select(`
        quantity,
        Product (costprice, saleprice)
      `).gt('quantity', 0),
      (await getSupabaseServerClient()).from('Warehouse_Product').select('*', { count: 'exact', head: true }).lt('quantity', 'minStock')
    ]);

    // Calcular valor total
    const inventoryValue = productsWithValue.data?.reduce((total, item) => {
      const price = item.Product?.costprice || item.Product?.saleprice || 0;
      return total + (price * item.quantity);
    }, 0) || 0;

    return {
      totalProducts: totalProducts.count || 0,
      totalWarehouses: totalWarehouses.count || 0,
      totalValue: Math.round(inventoryValue * 100) / 100,
      lowStockCount: lowStockCount.count || 0
    };

  } catch (error) {
    console.error('Error obteniendo resumen de inventario:', error);
    return {
      totalProducts: 0,
      totalWarehouses: 0,
      totalValue: 0,
      lowStockCount: 0
    };
  }
} 