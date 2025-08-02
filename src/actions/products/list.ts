"use server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { PaginationParams } from '@/interface/actions';
import { revalidatePath } from 'next/cache';
import { mapProductsDBToFrontend, ProductDB } from '@/lib/product-mapper';
import { getSupabaseClient } from '@/lib/supabase-server';

interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: number;
  warehouseId?: number;
  totalCount?: number;
}

// Función para sanitizar términos de búsqueda
function sanitizeSearchTerm(search: string): string {
  if (!search) return '';
  
  // Escapar caracteres especiales que pueden interferir con las consultas PostgREST
  return search
    .replace(/[,]/g, '') // Remover comas que interfieren con la sintaxis OR
    .replace(/[()]/g, '') // Remover paréntesis
    .replace(/['"]/g, '') // Remover comillas
    .replace(/[%]/g, '') // Remover porcentajes que interfieren con LIKE
    .trim();
}

// Función alternativa de búsqueda más robusta
async function getProductsWithAlternativeSearch(supabase: any, sanitizedSearch: string, categoryId?: number, warehouseId?: number, from?: number, to?: number) {
  console.log('🔄 Usando búsqueda alternativa más robusta');
  
  try {
    // Construir consulta base
    let baseQuery = supabase
      .from('Product')
      .select(`
        *,
        Category (*),
        Supplier (*),
        Warehouse_Products:Warehouse_Product${warehouseId ? '!inner' : ''} (
          id,
          quantity,
          "warehouseId",
          "productId",
          "minStock",
          "maxStock",
          Warehouse (
            id,
            name
          )
        )
      `);

    // Aplicar filtros uno por uno para evitar problemas de sintaxis
    if (sanitizedSearch) {
      // Buscar por nombre primero
      baseQuery = baseQuery.or(
        `name.ilike.%${sanitizedSearch}%,sku.ilike.%${sanitizedSearch}%`
      );
    }

    // Aplicar otros filtros
    if (categoryId) {
      baseQuery = baseQuery.eq('categoryid', categoryId);
    }

    if (warehouseId) {
      baseQuery = baseQuery.filter('Warehouse_Products.warehouseId', 'eq', warehouseId);
    }

    // Ejecutar consulta con paginación
    const { data, error, count } = await baseQuery
      .range(from || 0, to || 9)
      .order('id', { ascending: false });

    return { data, error, count };
  } catch (error) {
    console.error('❌ Error en búsqueda alternativa:', error);
    return { data: null, error, count: 0 };
  }
}

export async function getProducts(params: PaginationParams) {
  try {
    const supabase = await getSupabaseClient();
    const { page = 1, pageSize = 10, search, categoryId, warehouseId } = params;
    const currentPage = typeof page === 'string' ? parseInt(page) : page;
    const currentPageSize = typeof pageSize === 'string' ? parseInt(pageSize) : pageSize;
    const from = (currentPage - 1) * currentPageSize;
    const to = from + currentPageSize - 1;

    // Construir consulta base con bodegas asociadas
    let query = supabase
      .from('Product')
      .select(`
        *,
        Category (*),
        Supplier (*),
        Warehouse_Products:Warehouse_Product${warehouseId ? '!inner' : ''} (
          id,
          quantity,
          "warehouseId",
          "productId",
          "minStock",
          "maxStock",
          Warehouse (
            id,
            name
          )
        )
      `);

    // Aplicar filtros de búsqueda con método más robusto
    if (search) {
      const sanitizedSearch = sanitizeSearchTerm(search);
      console.log('🔍 Búsqueda original:', search);
      console.log('🧹 Búsqueda sanitizada:', sanitizedSearch);
      
      if (sanitizedSearch) {
        // Enfoque más seguro: usar consultas individuales en lugar de OR complejo
        // Esto evita completamente los problemas de caracteres especiales
        try {
          query = query.or(
            `name.ilike.%${sanitizedSearch}%,` +
            `sku.ilike.%${sanitizedSearch}%,` +
            `barcode.ilike.%${sanitizedSearch}%,` +
            `brand.ilike.%${sanitizedSearch}%`
          );
        } catch (searchError) {
          console.error('❌ Error en búsqueda con OR, intentando búsqueda alternativa:', searchError);
          // Usar función alternativa más robusta
          const alternativeResult = await getProductsWithAlternativeSearch(
            supabase, 
            sanitizedSearch, 
            categoryId, 
            warehouseId, 
            from, 
            to
          );
          
          if (alternativeResult.error) {
            throw new Error(`Error en búsqueda alternativa: ${alternativeResult.error.message}`);
          }
          
          // Procesar resultado de búsqueda alternativa
          const products = alternativeResult.data || [];
          console.log(`✅ Búsqueda alternativa exitosa: ${products.length} productos encontrados`);
          
          return {
            products: mapProductsDBToFrontend(products),
            totalCount: alternativeResult.count || products.length
          };
        }
      }
    }

    // Aplicar filtro por categoría
    if (categoryId) {
      const categoryIdNumber = typeof categoryId === 'string' ? parseInt(categoryId) : categoryId;
      if (!isNaN(categoryIdNumber)) {
        query = query.eq('categoryid', categoryIdNumber);
      }
    }

    // Aplicar filtro por bodega
    if (warehouseId) {
      const warehouseIdNumber = typeof warehouseId === 'string' ? parseInt(warehouseId) : warehouseId;
      if (!isNaN(warehouseIdNumber)) {
        // Filtrar productos que estén asignados a la bodega específica
        query = query.filter('Warehouse_Products.warehouseId', 'eq', warehouseIdNumber);
      }
    }

    // Obtener productos con paginación
    const { data: products, error, count } = await query
      .range(from, to)
      .order('id', { ascending: false });

    if (error) {
      console.error('❌ Error en consulta de productos:', error);
      console.error('❌ Detalles del error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Error obteniendo productos: ${error.message}`);
    }

    // Obtener conteo total si no se proporcionó
    let totalCount = count || 0;
    if (!count) {
      let countQuery = supabase.from('Product').select('*', { count: 'exact', head: true });
      
      // Aplicar los mismos filtros para el conteo
      if (search) {
        countQuery = countQuery.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%,brand.ilike.%${search}%`);
      }
      if (categoryId) {
        const categoryIdNumber = typeof categoryId === 'string' ? parseInt(categoryId) : categoryId;
        if (!isNaN(categoryIdNumber)) {
          countQuery = countQuery.eq('categoryid', categoryIdNumber);
        }
      }
      if (warehouseId) {
        const warehouseIdNumber = typeof warehouseId === 'string' ? parseInt(warehouseId) : warehouseId;
        if (!isNaN(warehouseIdNumber)) {
          // Para el conteo, necesitamos una consulta diferente que incluya el join
          const { count: warehouseFilteredCount } = await supabase
            .from('Product')
            .select(`
              *,
              Warehouse_Products:Warehouse_Product!inner (
                warehouseId
              )
            `, { count: 'exact', head: true })
            .filter('Warehouse_Products.warehouseId', 'eq', warehouseIdNumber);
          
          totalCount = warehouseFilteredCount || 0;
        }
      }
      
      if (!warehouseId) {
        const { count: total } = await countQuery;
        totalCount = total || 0;
      }
    }

    // Mapear productos de snake_case (BD) a camelCase (Frontend)
    const mappedProducts = mapProductsDBToFrontend(products as ProductDB[] || []);
    
    // Los productos se mapean correctamente de snake_case a camelCase

    return { products: mappedProducts, totalCount };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { products: [], totalCount: 0 };
  }
}

// Función para verificar dependencias del producto
export async function checkProductDependencies(productId: number) {
  try {
    const supabase = await getSupabaseClient();
    
    const [warehousesResult, salesResult, reservationsResult, componentsResult, pettyCashResult, posProductResult, invoiceLinesResult, purchaseInvoiceLinesResult] = await Promise.all([
      supabase.from('Warehouse_Product').select('*', { count: 'exact', head: true }).eq('"productId"', productId),
      supabase.from('Sale_Product').select('*', { count: 'exact', head: true }).eq('"productId"', productId),
      supabase.from('Reservation_Product').select('*', { count: 'exact', head: true }).eq('"productId"', productId),
      supabase.from('Product_Component').select('*', { count: 'exact', head: true }).or(`"parentId".eq.${productId},"componentId".eq.${productId}`),
      supabase.from('PettyCashPurchase').select('*', { count: 'exact', head: true }).eq('"productId"', productId),
      supabase.from('POSProduct').select('*', { count: 'exact', head: true }).eq('"productId"', productId),
      supabase.from('invoice_lines').select('*', { count: 'exact', head: true }).eq('product_id', productId),
      supabase.from('purchase_invoice_lines').select('*', { count: 'exact', head: true }).eq('product_id', productId)
    ]);

    const dependencies = {
      warehouses: warehousesResult.count || 0,
      sales: salesResult.count || 0,
      reservations: reservationsResult.count || 0,
      components: componentsResult.count || 0,
      pettyCashPurchases: pettyCashResult.count || 0,
      posProducts: posProductResult.count || 0,
      invoiceLines: invoiceLinesResult.count || 0,
      purchaseInvoiceLines: purchaseInvoiceLinesResult.count || 0
    };

    const total = Object.values(dependencies).reduce((sum, count) => sum + count, 0);
    
    const hasInvoices = dependencies.invoiceLines > 0 || dependencies.purchaseInvoiceLines > 0;
    
    return {
      dependencies,
      hasAny: total > 0,
      hasInvoices,
      total
    };
  } catch (error) {
    console.error('Error checking product dependencies:', error);
    return {
      dependencies: { warehouses: 0, sales: 0, reservations: 0, components: 0, pettyCashPurchases: 0, posProducts: 0, invoiceLines: 0, purchaseInvoiceLines: 0 },
      hasAny: false,
      hasInvoices: false,
      total: 0
    };
  }
}

export async function deleteProduct(formData: FormData) {
  console.log('🔧 deleteProduct: Iniciando función de eliminación');
  console.log('📋 deleteProduct: FormData recibida:', Array.from(formData.entries()));
  
  try {
    const supabase = await getSupabaseClient();
    const idString = formData.get('id') as string;
    const forceDelete = formData.get('force') === 'true';
    
    console.log('🔍 deleteProduct: Parámetros extraídos:', { idString, forceDelete });
    
    if (!idString) {
      console.log('❌ deleteProduct: ID del producto no proporcionado');
      return { 
        success: false, 
        error: 'ID del producto es requerido' 
      };
    }

    const id = parseInt(idString);
    if (isNaN(id)) {
      console.log('❌ deleteProduct: ID del producto no es válido:', idString);
      return { 
        success: false, 
        error: 'ID del producto no es válido' 
      };
    }

    console.log('🔍 deleteProduct: Verificando existencia del producto ID:', id);

    // Verificar si el producto existe (sin stockid)
    const { data: product, error: productError } = await supabase
      .from('Product')
      .select('id, name')
      .eq('id', id)
      .single();

    if (productError || !product) {
      console.log('❌ deleteProduct: Producto no existe:', productError?.message);
      return { 
        success: false, 
        error: 'El producto no existe' 
      };
    }

    console.log('✅ deleteProduct: Producto encontrado:', product);

    // Verificar dependencias
    console.log('🔍 deleteProduct: Verificando dependencias...');
    const dependencyCheck = await checkProductDependencies(id);
    console.log('📊 deleteProduct: Resultado de verificación de dependencias:', dependencyCheck);

    // PROTECCIÓN CRÍTICA: NO permitir eliminar productos que estén en facturas
    if (dependencyCheck.hasInvoices) {
      console.log('🚫 deleteProduct: PRODUCTO EN FACTURAS - Eliminación PROHIBIDA');
      const invoiceDetails = [];
      if (dependencyCheck.dependencies.invoiceLines > 0) {
        invoiceDetails.push(`📄 ${dependencyCheck.dependencies.invoiceLines} facturas de ventas emitidas a clientes`);
      }
      if (dependencyCheck.dependencies.purchaseInvoiceLines > 0) {
        invoiceDetails.push(`📋 ${dependencyCheck.dependencies.purchaseInvoiceLines} facturas de compras recibidas de proveedores`);
      }
      
      return { 
        success: false, 
        error: `🚫 ELIMINACIÓN PROHIBIDA\n\nNo se puede eliminar "${product.name}" porque aparece en:\n• ${invoiceDetails.join('\n• ')}\n\n🚨 IMPORTANTE: Las facturas son documentos legales y fiscales que NO se pueden modificar una vez emitidas.\n\n✅ ALTERNATIVAS RECOMENDADAS:\n• Marcar el producto como "Inactivo" en su configuración\n• Cambiar su estado a "Descontinuado"\n• Ocultarlo del punto de venta\n• Revisar facturas en: Dashboard → Ventas → Facturas o Dashboard → Compras → Facturas`,
        dependencies: dependencyCheck.dependencies,
        hasInvoices: true,
        canForceDelete: false
      };
    }
    
    if (dependencyCheck.hasAny && !forceDelete) {
      console.log('⚠️ deleteProduct: Producto tiene dependencias, requiere confirmación');
      const deps = dependencyCheck.dependencies;
      const messages = [];
      const actionMessages = [];
      
      if (deps.warehouses > 0) {
        messages.push(`🏪 ${deps.warehouses} asignación(es) en bodegas con stock disponible`);
        actionMessages.push('Revisar inventario en Dashboard → Inventario');
      }
      if (deps.sales > 0) {
        messages.push(`💰 ${deps.sales} venta(s) registrada(s) en el histórico`);
        actionMessages.push('Revisar ventas en Dashboard → Ventas');
      }
      if (deps.reservations > 0) {
        messages.push(`📅 ${deps.reservations} reservación(es) activa(s) o históricas`);
        actionMessages.push('Revisar reservas en Dashboard → Reservaciones');
      }
      if (deps.components > 0) {
        messages.push(`🔧 ${deps.components} componente(s) o producto(s) padre en productos modulares`);
        actionMessages.push('Revisar productos modulares en Dashboard → Productos');
      }
      if (deps.pettyCashPurchases > 0) {
        messages.push(`💵 ${deps.pettyCashPurchases} compra(s) registrada(s) en caja menor`);
        actionMessages.push('Revisar caja menor en Dashboard → Caja Menor');
      }
      if (deps.posProducts > 0) {
        messages.push(`🛒 ${deps.posProducts} configuración(es) en punto de venta`);
        actionMessages.push('Revisar POS en Dashboard → Punto de Venta');
      }
      
      const uniqueActions = [...new Set(actionMessages)];
      
      return { 
        success: false, 
        error: `⚠️ ELIMINACIÓN CON DEPENDENCIAS\n\nNo se puede eliminar "${product.name}" porque tiene dependencias activas:\n\n${messages.map(msg => `• ${msg}`).join('\n')}\n\n🔍 DÓNDE REVISAR:\n${uniqueActions.map(action => `• ${action}`).join('\n')}\n\n✅ OPCIONES DISPONIBLES:\n• Eliminar estas dependencias manualmente y luego eliminar el producto\n• Usar "Eliminación Forzada" para eliminar todo automáticamente (⚠️ acción irreversible)\n• Marcar el producto como inactivo en lugar de eliminarlo`,
        dependencies: dependencyCheck.dependencies,
        canForceDelete: true
      };
    }

    console.log('🗑️ deleteProduct: Procediendo con eliminación...');

    // Si es eliminación forzada, eliminar todas las dependencias
    if (forceDelete && dependencyCheck.hasAny) {
      console.log('💥 deleteProduct: Eliminación FORZADA - eliminando dependencias primero');
      
      // Eliminar en orden de dependencias con logging detallado
      console.log('🧹 deleteProduct: Eliminando Warehouse_Product...');
      const warehouseResult = await supabase.from('Warehouse_Product').delete().eq('"productId"', id);
      console.log('📊 deleteProduct: Warehouse_Product eliminado:', warehouseResult);
      
      console.log('🧹 deleteProduct: Eliminando Sale_Product...');
      const saleResult = await supabase.from('Sale_Product').delete().eq('"productId"', id);
      console.log('📊 deleteProduct: Sale_Product eliminado:', saleResult);
      
      console.log('🧹 deleteProduct: Eliminando Reservation_Product...');
      const reservationResult = await supabase.from('Reservation_Product').delete().eq('"productId"', id);
      console.log('📊 deleteProduct: Reservation_Product eliminado:', reservationResult);
      
      console.log('🧹 deleteProduct: Eliminando Product_Component...');
      const componentResult = await supabase.from('Product_Component').delete().or(`"parentId".eq.${id},"componentId".eq.${id}`);
      console.log('📊 deleteProduct: Product_Component eliminado:', componentResult);
      
      console.log('🧹 deleteProduct: Eliminando PettyCashPurchase...');
      const pettyCashResult = await supabase.from('PettyCashPurchase').delete().eq('"productId"', id);
      console.log('📊 deleteProduct: PettyCashPurchase eliminado:', pettyCashResult);
      
      console.log('🧹 deleteProduct: Eliminando POSProduct...');
      const posProductResult = await supabase.from('POSProduct').delete().eq('"productId"', id);
      console.log('📊 deleteProduct: POSProduct eliminado:', posProductResult);
      
      console.log('🧹 deleteProduct: Dependencias eliminadas completamente');
    } else {
      console.log('🗑️ deleteProduct: Eliminación NORMAL - sin dependencias');
      // Eliminación normal (sin dependencias)
      // Eliminar asignaciones en bodegas y POS por si acaso
      console.log('🧹 deleteProduct: Limpiando Warehouse_Product por seguridad...');
      const warehouseCleanupResult = await supabase.from('Warehouse_Product').delete().eq('"productId"', id);
      console.log('📊 deleteProduct: Limpieza Warehouse_Product:', warehouseCleanupResult);
      
      console.log('🧹 deleteProduct: Limpiando POSProduct por seguridad...');
      const posCleanupResult = await supabase.from('POSProduct').delete().eq('"productId"', id);
      console.log('📊 deleteProduct: Limpieza POSProduct:', posCleanupResult);
    }

    // Eliminar el producto
    console.log('🗑️ deleteProduct: Eliminando producto de tabla Product...');
    const deleteResult = await supabase
      .from('Product')
      .delete()
      .eq('id', id);

    console.log('📊 deleteProduct: Resultado eliminación Product:', deleteResult);
    
    // Verificar si realmente se eliminó
    if (deleteResult.error) {
      console.error('❌ deleteProduct: Error en eliminación del producto:', deleteResult.error);
      return { 
        success: false, 
        error: `Error al eliminar el producto: ${deleteResult.error.message}` 
      };
    }

    // Verificar que realmente se eliminó
    console.log('🔍 deleteProduct: Verificando que el producto se eliminó...');
    const { data: verifyProduct, error: verifyError } = await supabase
      .from('Product')
      .select('id')
      .eq('id', id)
      .single();

    if (verifyProduct) {
      console.error('❌ deleteProduct: ¡PROBLEMA! El producto aún existe después de eliminarlo');
      return { 
        success: false, 
        error: 'El producto no se pudo eliminar de la base de datos. Posible problema de permisos o políticas RLS.' 
      };
    }

    if (verifyError && verifyError.code !== 'PGRST116') { // PGRST116 = no rows returned (esperado)
      console.error('❌ deleteProduct: Error verificando eliminación:', verifyError);
      return { 
        success: false, 
        error: `Error verificando eliminación: ${verifyError.message}` 
      };
    }

    console.log('✅ deleteProduct: Verificación exitosa - producto eliminado de la DB');

    console.log('♻️ deleteProduct: Revalidando páginas...');
    revalidatePath('/dashboard/configuration/products');
    revalidatePath('/dashboard/inventory');

    console.log('✅ deleteProduct: Eliminación completada exitosamente');
    return { 
      success: true, 
      message: `Producto "${product.name}" eliminado correctamente` 
    };

  } catch (error) {
    console.error('💥 deleteProduct: Error en eliminación:', error);
    return { 
      success: false, 
      error: 'Error interno del servidor al eliminar el producto' 
    };
  }
}

export async function deleteProductById(id: number) {
  const formData = new FormData();
  formData.append('id', id.toString());
  return await deleteProduct(formData);
} 