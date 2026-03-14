'use server';

import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase-server';

// Optimización 1: Consulta unificada para productos y categorías
export async function getPOSDataOptimized(registerTypeId: number) {
  try {
    const supabase = await getSupabaseServerClient();

    const { data: products, error } = await supabase
      .from('POSProduct')
      .select(`
        id,
        name,
        price,
        sku,
        isActive,
        categoryId,
        POSProductCategory (
          id,
          name,
          displayName,
          icon,
          color
        ),
        Product(
          id,
          saleprice,
          vat,
          "finalPrice",
          isPOSEnabled
        )
      `)
      .eq('isActive', true)
      .order('name');

    if (error) {
      console.error('Error fetching POS data:', error);
      throw error;
    }

    // Separar datos en el cliente
    const categories = products
      ?.map(p => p.POSProductCategory)
      .filter((cat, index, self) => cat && self.findIndex(c => c?.id === cat.id) === index) || [];

    // Transformar productos al formato esperado
    const transformedProducts = products?.map(product => {
      let finalPrice = product.price || 0;
      const prod = (product as any).product as
        | { finalPrice?: number; saleprice?: number; vat?: number | null }
        | undefined;
      if (prod && typeof prod.finalPrice === 'number') {
        finalPrice = prod.finalPrice as number;
      } else if (prod && typeof prod.saleprice === 'number') {
        const vatRate = (prod.vat ?? 19) as number;
        finalPrice = Math.round((prod.saleprice as number) * (1 + vatRate / 100));
      }

      return {
        id: product.id,
        name: product.name,
        price: finalPrice,
        sku: product.sku,
        isActive: product.isActive,
        categoryId: product.categoryId,
        category: product.POSProductCategory
      };
    }) || [];

    // Eliminar productos duplicados por nombre
    const uniqueProducts = transformedProducts.reduce((acc, current) => {
      const existingProduct = acc.find(p => p.name.toLowerCase() === current.name.toLowerCase());
      if (!existingProduct) {
        acc.push(current);
      } else if (current.id < existingProduct.id) {
        const index = acc.findIndex(p => p.name.toLowerCase() === current.name.toLowerCase());
        acc[index] = current;
      }
      return acc;
    }, [] as typeof transformedProducts);

    return {
      success: true,
      products: uniqueProducts,
      categories: categories
    };
  } catch (error) {
    console.error('Error in getPOSDataOptimized:', error);
    return {
      success: false,
      error: String(error),
      products: [],
      categories: []
    };
  }
}

// Optimización 2: Mesas/mostradores con cache
let tablesCache: any[] = [];
let tablesCacheTime = 0;
const CACHE_DURATION = 30000; // 30 segundos

export async function getPOSTablesOptimized() {
  try {
    const now = Date.now();

    if (tablesCache.length > 0 && (now - tablesCacheTime) < CACHE_DURATION) {
      return { success: true, data: tablesCache };
    }

    const supabase = await getSupabaseServerClient();
    const { data: tables, error } = await supabase
      .from('POSTable')
      .select('id, number, name, capacity, status')
      .order('number');

    if (error) {
      console.error('Error fetching tables:', error);
      throw error;
    }

    tablesCache = tables || [];
    tablesCacheTime = now;

    return { success: true, data: tables };
  } catch (error) {
    console.error('Error in getPOSTablesOptimized:', error);
    return {
      success: false,
      error: String(error),
      data: []
    };
  }
}

// Optimización 3: Sesión con cache ligero
let sessionCache: any = null;
let sessionCacheTime = 0;
const SESSION_CACHE_DURATION = 10000; // 10 segundos

export async function getCurrentPOSSessionOptimized(registerTypeId: number) {
  try {
    const now = Date.now();

    if (sessionCache && (now - sessionCacheTime) < SESSION_CACHE_DURATION) {
      return { success: true, data: sessionCache };
    }

    const supabase = await getSupabaseServiceClient();

    const { data: session, error } = await supabase
      .from('CashSession')
      .select(`
        id,
        sessionNumber,
        openingAmount,
        currentAmount,
        status,
        openedAt,
        cashRegisterTypeId,
        cashRegisterId,
        userId
      `)
      .eq('cashRegisterTypeId', registerTypeId)
      .eq('status', 'open')
      .order('openedAt', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching current session:', error);
      throw error;
    }

    let finalSession = session;
    if (session && session.userId) {
      const { data: userData } = await supabase
        .from('User')
        .select('id, name, email')
        .eq('id', session.userId)
        .single();
      if (userData) {
        finalSession = { ...session, User: { name: userData.name, email: userData.email } } as any;
      }
    }

    sessionCache = finalSession;
    sessionCacheTime = now;

    return {
      success: true,
      data: finalSession
    };
  } catch (error) {
    console.error('Error in getCurrentPOSSessionOptimized:', error);
    return {
      success: false,
      error: String(error),
      data: null
    };
  }
}

export async function getPOSSessionById(sessionId: number) {
  try {
    const supabase = await getSupabaseServiceClient();
    const { data: session, error } = await supabase
      .from('CashSession')
      .select(`
        id,
        sessionNumber,
        openingAmount,
        currentAmount,
        status,
        openedAt,
        cashRegisterTypeId,
        cashRegisterId,
        userId
      `)
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching session by id:', error);
      return { success: false, error: error.message };
    }

    let finalSession = session;
    if (session && session.userId) {
      const { data: userData } = await supabase
        .from('User')
        .select('id, name, email')
        .eq('id', session.userId)
        .single();
      if (userData) {
        finalSession = { ...session, User: { name: userData.name, email: userData.email } } as any;
      }
    }

    return { success: true, data: finalSession };
  } catch (error) {
    console.error('Error in getPOSSessionById:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

// Función para limpiar caches
export async function clearPOSCaches() {
  tablesCache = [];
  tablesCacheTime = 0;
  sessionCache = null;
  sessionCacheTime = 0;
}
