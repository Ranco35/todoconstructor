'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export interface PackageModular {
  id: number;
  name: string;
  code: string;
  color: string;
  created_at?: string;
  updated_at?: string;
}

export interface PackageWithProducts extends PackageModular {
  products: string[];
}

// Obtener todos los paquetes modulares
export async function getPackagesModular(): Promise<PackageModular[]> {
  const supabase = await getSupabaseServerClient();
  
  try {
    const { data, error } = await supabase
      .from('packages_modular')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo paquetes modulares:', error);
      throw new Error(`Error obteniendo paquetes: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error en getPackagesModular:', error);
    throw new Error('Error obteniendo paquetes modulares');
  }
}

// Obtener paquetes con sus productos asociados
export async function getPackagesWithProducts(): Promise<PackageWithProducts[]> {
  const supabase = await getSupabaseServerClient();
  
  try {
    console.log('Iniciando consulta de paquetes...');
    const { data: packages, error: packagesError } = await supabase
      .from('packages_modular')
      .select('*');
    console.log('Consulta realizada. Paquetes:', packages);
    console.log('Error de paquetes:', packagesError);

    if (packagesError) {
      console.error('Error obteniendo paquetes:', packagesError, JSON.stringify(packagesError));
      throw new Error(`Error obteniendo paquetes: ${packagesError.message || JSON.stringify(packagesError)}`);
    }
    if (!packages) return [];

    // Obtener productos asociados desde package_products_modular
    const { data: linkages, error: linkagesError } = await supabase
      .from('package_products_modular')
      .select(`
        package_id,
        product_id,
        is_included
      `)
      .eq('is_included', true);
    console.log('Vinculaciones obtenidas:', linkages);
    console.log('Error de vinculaciones:', linkagesError);

    if (linkagesError) {
      console.error('Error obteniendo vinculaciones:', linkagesError, JSON.stringify(linkagesError));
      throw new Error(`Error obteniendo productos de paquetes: ${linkagesError.message || JSON.stringify(linkagesError)}`);
    }

    // Obtener productos modulares activos para el mapeo
    const { data: modularProducts, error: modularProductsError } = await supabase
      .from('products_modular')
      .select('id, code, original_id, is_active')
      .eq('is_active', true);
    if (modularProductsError) {
      console.error('Error obteniendo productos modulares:', modularProductsError);
      throw new Error(`Error obteniendo productos modulares: ${modularProductsError.message}`);
    }

    // Mapear productos a paquetes usando el code del producto modular
    const packagesWithProducts: PackageWithProducts[] = (packages || []).map(pkg => {
      const packageProducts = (linkages || [])
        .filter(link => link.package_id === pkg.id)
        .map(link => {
          // Buscar el producto modular por su ID directo (package_products_modular usa el ID del producto modular)
          const prod = (modularProducts || []).find(p => Number(p.id) === Number(link.product_id));
          console.log('Buscando producto modular para', link.product_id, '=>', prod);
          return prod ? prod.code : null;
        })
        .filter(Boolean); // Elimina nulos
      console.log('Productos vinculados para paquete', pkg.id, ':', packageProducts);
      return {
        ...pkg,
        products: packageProducts
      };
    });

    console.log('Resultado final de packagesWithProducts:', packagesWithProducts);
    return packagesWithProducts;
  } catch (error) {
    console.error('Error en getPackagesWithProducts:', error, JSON.stringify(error));
    throw new Error(error?.message || JSON.stringify(error) || 'Error obteniendo paquetes con productos');
  }
}

// Crear nuevo paquete
export async function createPackageModular(name: string, color: string = 'blue'): Promise<PackageModular> {
  const supabase = await getSupabaseServerClient();
  
  try {
    // Validar nombre duplicado
    const nombreExiste = await checkPackageNameExists(name);
    if (nombreExiste) {
      throw new Error('Ya existe un paquete con ese nombre. Elige un nombre diferente.');
    }

    // Generar código único
    const code = `PKG-${name.toUpperCase().replace(/\s+/g, '-')}-${Date.now()}`;
    
    const { data, error } = await supabase
      .from('packages_modular')
      .insert({
        name: name.trim(),
        code,
        color
      })
      .select()
      .single();

    if (error) {
      console.error('Error creando paquete:', error);
      throw new Error(`Error creando paquete: ${error.message}`);
    }

    revalidatePath('/dashboard/admin/productos-modulares');
    return data;
  } catch (error) {
    console.error('Error en createPackageModular:', error);
    throw new Error(error.message || 'Error creando paquete modular');
  }
}

// Actualizar nombre de paquete
export async function updatePackageName(packageId: number, newName: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  
  try {
    const { error } = await supabase
      .from('packages_modular')
      .update({
        name: newName.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', packageId);

    if (error) {
      console.error('Error actualizando paquete:', error);
      throw new Error(`Error actualizando paquete: ${error.message}`);
    }

    revalidatePath('/dashboard/admin/productos-modulares');
  } catch (error) {
    console.error('Error en updatePackageName:', error);
    throw new Error('Error actualizando nombre del paquete');
  }
}

// Eliminar paquete
export async function deletePackageModular(packageId: number): Promise<void> {
  const supabase = await getSupabaseServerClient();
  
  try {
    // Eliminar vinculaciones de productos primero
    const { error: linkageError } = await supabase
      .from('package_products_modular')
      .delete()
      .eq('package_id', packageId);

    if (linkageError) {
      console.error('Error eliminando vinculaciones:', linkageError);
      throw new Error(`Error eliminando productos del paquete: ${linkageError.message}`);
    }

    // Eliminar el paquete
    const { error } = await supabase
      .from('packages_modular')
      .delete()
      .eq('id', packageId);

    if (error) {
      console.error('Error eliminando paquete:', error);
      throw new Error(`Error eliminando paquete: ${error.message}`);
    }

    revalidatePath('/dashboard/admin/productos-modulares');
  } catch (error) {
    console.error('Error en deletePackageModular:', error);
    throw new Error('Error eliminando paquete modular');
  }
}

// Agregar producto a paquete
export async function addProductToPackage(packageId: number, productId: number): Promise<void> {
  const supabase = await getSupabaseServerClient();
  
  try {
    const { error } = await supabase
      .from('package_products_modular')
      .upsert({
        package_id: packageId,
        product_id: productId,
        is_included: true,
        sort_order: 0
      }, {
        onConflict: 'product_id,package_id'
      });

    if (error) {
      console.error('Error agregando producto al paquete:', error);
      throw new Error(`Error agregando producto: ${error.message}`);
    }

    revalidatePath('/dashboard/admin/productos-modulares');
  } catch (error) {
    console.error('Error en addProductToPackage:', error);
    throw new Error('Error agregando producto al paquete');
  }
}

// Remover producto de paquete
export async function removeProductFromPackage(packageId: number, productId: number): Promise<void> {
  const supabase = await getSupabaseServerClient();
  
  try {
    const { error } = await supabase
      .from('package_products_modular')
      .delete()
      .eq('package_id', packageId)
      .eq('product_id', productId);

    if (error) {
      console.error('Error removiendo producto del paquete:', error);
      throw new Error(`Error removiendo producto: ${error.message}`);
    }

    revalidatePath('/dashboard/admin/productos-modulares');
  } catch (error) {
    console.error('Error en removeProductFromPackage:', error);
    throw new Error('Error removiendo producto del paquete');
  }
}

// Verificar si existe paquete con nombre
export async function checkPackageNameExists(name: string, excludeId?: number): Promise<boolean> {
  const supabase = await getSupabaseServerClient();
  
  try {
    let query = supabase
      .from('packages_modular')
      .select('id')
      .eq('name', name.trim());

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error verificando nombre de paquete:', error);
      throw new Error(`Error verificando nombre: ${error.message}`);
    }

    return (data || []).length > 0;
  } catch (error) {
    console.error('Error en checkPackageNameExists:', error);
    throw new Error('Error verificando nombre del paquete');
  }
} 