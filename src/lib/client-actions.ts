'use client';

// Wrapper inteligente para Server Actions con fallback automático a API Routes
// Detecta el entorno y usa el método más apropiado

import { searchClients as serverSearchClients, getClientByRut as serverGetClientByRut, createClient as serverCreateClient } from '@/actions/clients';
import { getProductsModular as serverGetProductsModular, getPackagesWithProducts as serverGetPackagesWithProducts, calculatePackagePriceModular as serverCalculatePackagePriceModular, createModularReservation as serverCreateModularReservation, getAgeMultipliers as serverGetAgeMultipliers } from '@/actions/products/modular-products';
import { getSeasonForDate as serverGetSeasonForDate } from '@/actions/configuration/season-actions';
import { editReservation as serverEditReservation } from '@/actions/reservations/edit';
import { searchSuppliers as serverSearchSuppliers, searchProducts as serverSearchProducts } from '@/actions/purchases/common';
import { findSupplierWithSuggestions as serverFindSupplierWithSuggestions } from '@/actions/purchases/pdf-processor';
import { getProducts as serverGetProducts } from '@/actions/products/list';

// 🧠 DETECCIÓN INTELIGENTE DE ENTORNO
let serverActionsWorking: boolean | null = null;
let lastServerActionCheck = 0;
const CHECK_INTERVAL = 30000; // 30 segundos

async function shouldUseServerActions(): Promise<boolean> {
  const now = Date.now();
  
  // Si ya sabemos que no funcionan y no ha pasado suficiente tiempo, usar API
  if (serverActionsWorking === false && (now - lastServerActionCheck) < CHECK_INTERVAL) {
    return false;
  }
  
  // Si nunca hemos verificado o es tiempo de re-verificar
  if (serverActionsWorking === null || (now - lastServerActionCheck) > CHECK_INTERVAL) {
    lastServerActionCheck = now;
    
    // En desarrollo, asumir que funcionan
    if (process.env.NODE_ENV === 'development') {
      serverActionsWorking = true;
      return true;
    }
    
    // En producción, verificar URL para decidir
    if (typeof window !== 'undefined') {
      const isVercel = window.location.hostname.includes('vercel.app') || 
                      window.location.hostname.includes('termasllifen.cl');
      if (isVercel) {
        serverActionsWorking = false; // Usar API Routes en Vercel
        return false;
      }
    }
  }
  
  return serverActionsWorking !== false;
}

// ═══════════════════════════════════════════════════════════════
// WRAPPERS PARA CLIENTES
// ═══════════════════════════════════════════════════════════════

export async function searchClients(term: string) {
  try {
    console.log('🔍 [CLIENT-WRAPPER] Buscando clientes:', term);
    
    // 🧠 DECISIÓN INTELIGENTE: ¿Usar Server Actions o API directamente?
    const useServerActions = await shouldUseServerActions();
    
    if (useServerActions) {
      // Intentar Server Action primero
      try {
        const result = await serverSearchClients(term);
        console.log('✅ [CLIENT-WRAPPER] Server Action exitosa:', result);
        serverActionsWorking = true; // Marcar como funcionando
        return result;
      } catch (serverError: any) {
        console.warn('⚠️ [CLIENT-WRAPPER] Server Action falló, marcando como no funcional');
        serverActionsWorking = false; // Marcar como no funcionando
        lastServerActionCheck = Date.now();
      }
    } else {
      console.log('🚀 [CLIENT-WRAPPER] Usando API Route directamente (Server Actions deshabilitadas)');
    }
    
    // Usar API Route (ya sea por fallo o por decisión inteligente)
    const response = await fetch(`/api/clients/search?term=${encodeURIComponent(term)}`);
    const result = await response.json();
    console.log('✅ [CLIENT-WRAPPER] API Route exitosa:', result);
    return result;
    
  } catch (error: any) {
    console.error('❌ [CLIENT-WRAPPER] Error en searchClients:', error);
    return { success: false, error: error.message || 'Error buscando clientes', data: [] };
  }
}

export async function getClientByRut(rut: string) {
  try {
    console.log('🔍 [CLIENT-WRAPPER] Buscando cliente por RUT:', rut);
    
    // 🧠 DECISIÓN INTELIGENTE
    const useServerActions = await shouldUseServerActions();
    
    if (useServerActions) {
      try {
        const result = await serverGetClientByRut(rut);
        console.log('✅ [CLIENT-WRAPPER] Server Action exitosa:', result);
        serverActionsWorking = true;
        return result;
      } catch (serverError: any) {
        console.warn('⚠️ [CLIENT-WRAPPER] Server Action falló, marcando como no funcional');
        serverActionsWorking = false;
        lastServerActionCheck = Date.now();
      }
    } else {
      console.log('🚀 [CLIENT-WRAPPER] Usando API Route directamente (Server Actions deshabilitadas)');
    }
    
    // Usar API Route
    const response = await fetch(`/api/clients/by-rut?rut=${encodeURIComponent(rut)}`);
    const result = await response.json();
    console.log('✅ [CLIENT-WRAPPER] API Route exitosa:', result);
    return result;
    
  } catch (error: any) {
    console.error('❌ [CLIENT-WRAPPER] Error en getClientByRut:', error);
    return { success: false, error: error.message || 'Error obteniendo cliente por RUT' };
  }
}

export async function createClient(data: any) {
  try {
    console.log('🔍 [CLIENT-WRAPPER] Creando cliente:', data);
    const result = await serverCreateClient(data);
    console.log('✅ [CLIENT-WRAPPER] Cliente creado:', result);
    return result;
  } catch (error: any) {
    console.error('❌ [CLIENT-WRAPPER] Error en createClient:', error);
    return { success: false, error: error.message || 'Error creando cliente' };
  }
}

// ═══════════════════════════════════════════════════════════════
// WRAPPERS PARA PRODUCTOS MODULARES
// ═══════════════════════════════════════════════════════════════

export async function getProductsModular(category?: string) {
  try {
    console.log('🔍 [CLIENT-WRAPPER] Obteniendo productos modulares:', category);
    
    // 🧠 DECISIÓN INTELIGENTE  
    const useServerActions = await shouldUseServerActions();
    
    if (useServerActions) {
      try {
        const result = await serverGetProductsModular(category);
        console.log('✅ [CLIENT-WRAPPER] Server Action exitosa:', result);
        serverActionsWorking = true;
        return result;
      } catch (serverError: any) {
        console.warn('⚠️ [CLIENT-WRAPPER] Server Action falló, marcando como no funcional');
        serverActionsWorking = false;
        lastServerActionCheck = Date.now();
      }
    } else {
      console.log('🚀 [CLIENT-WRAPPER] Usando API Route directamente (Server Actions deshabilitadas)');
    }
    
    // Usar API Route
    const url = category && category !== 'undefined' 
      ? `/api/products/modular?category=${encodeURIComponent(category)}`
      : '/api/products/modular';
    const response = await fetch(url);
    const result = await response.json();
    console.log('✅ [CLIENT-WRAPPER] API Route exitosa:', result);
    return result;
    
  } catch (error: any) {
    console.error('❌ [CLIENT-WRAPPER] Error en getProductsModular:', error);
    return { data: [], error: error.message || 'Error obteniendo productos modulares' };
  }
}

export async function getPackagesWithProducts() {
  try {
    console.log('🔍 [CLIENT-WRAPPER] Obteniendo paquetes con productos');
    const result = await serverGetPackagesWithProducts();
    console.log('✅ [CLIENT-WRAPPER] Paquetes obtenidos:', result);
    return result;
  } catch (error: any) {
    console.error('❌ [CLIENT-WRAPPER] Error en getPackagesWithProducts:', error);
    return [];
  }
}

export async function calculatePackagePriceModular(data: any) {
  try {
    console.log('🔍 [CLIENT-WRAPPER] Calculando precio paquete:', data);
    const result = await serverCalculatePackagePriceModular(data);
    console.log('✅ [CLIENT-WRAPPER] Precio calculado:', result);
    return result;
  } catch (error: any) {
    console.error('❌ [CLIENT-WRAPPER] Error en calculatePackagePriceModular:', error);
    return { data: null, error: error.message || 'Error calculando precio' };
  }
}

export async function createModularReservation(data: any) {
  try {
    console.log('🔍 [CLIENT-WRAPPER] Creando reserva modular:', data);
    const result = await serverCreateModularReservation(data);
    console.log('✅ [CLIENT-WRAPPER] Reserva creada:', result);
    return result;
  } catch (error: any) {
    console.error('❌ [CLIENT-WRAPPER] Error en createModularReservation:', error);
    return { success: false, error: error.message || 'Error creando reserva' };
  }
}

export async function getAgeMultipliers() {
  try {
    console.log('🔍 [CLIENT-WRAPPER] Obteniendo multiplicadores de edad');
    const result = await serverGetAgeMultipliers();
    console.log('✅ [CLIENT-WRAPPER] Multiplicadores obtenidos:', result);
    return result;
  } catch (error: any) {
    console.error('❌ [CLIENT-WRAPPER] Error en getAgeMultipliers:', error);
    return { data: [], error: error.message || 'Error obteniendo multiplicadores' };
  }
}

// ═══════════════════════════════════════════════════════════════
// WRAPPERS PARA OTROS SERVICIOS
// ═══════════════════════════════════════════════════════════════

export async function getSeasonForDate(date: string) {
  try {
    console.log('🔍 [CLIENT-WRAPPER] Obteniendo temporada para fecha:', date);
    const result = await serverGetSeasonForDate(date);
    console.log('✅ [CLIENT-WRAPPER] Temporada obtenida:', result);
    return result;
  } catch (error: any) {
    console.error('❌ [CLIENT-WRAPPER] Error en getSeasonForDate:', error);
    return { data: null, error: error.message || 'Error obteniendo temporada' };
  }
}

export async function editReservation(id: number, data: any) {
  try {
    console.log('🔍 [CLIENT-WRAPPER] Editando reserva:', id, data);
    const result = await serverEditReservation(id, data);
    console.log('✅ [CLIENT-WRAPPER] Reserva editada:', result);
    return result;
  } catch (error: any) {
    console.error('❌ [CLIENT-WRAPPER] Error en editReservation:', error);
    return { success: false, error: error.message || 'Error editando reserva' };
  }
}

// ═══════════════════════════════════════════════════════════════
// WRAPPERS PARA COMPRAS/PROVEEDORES 
// ═══════════════════════════════════════════════════════════════

export async function searchSuppliers(term: string) {
  try {
    console.log('🔍 [CLIENT-WRAPPER] Buscando proveedores:', term);
    
    // 🧠 DECISIÓN INTELIGENTE
    const useServerActions = await shouldUseServerActions();
    
    if (useServerActions) {
      try {
        const result = await serverSearchSuppliers(term);
        console.log('✅ [CLIENT-WRAPPER] Server Action exitosa:', result);
        serverActionsWorking = true;
        return result;
      } catch (serverError: any) {
        console.warn('⚠️ [CLIENT-WRAPPER] Server Action falló, marcando como no funcional');
        serverActionsWorking = false;
        lastServerActionCheck = Date.now();
      }
    } else {
      console.log('🚀 [CLIENT-WRAPPER] Usando API Route directamente (Server Actions deshabilitadas)');
    }
    
    // Usar API Route
    const response = await fetch(`/api/suppliers/search?term=${encodeURIComponent(term)}`);
    const result = await response.json();
    console.log('✅ [CLIENT-WRAPPER] API Route exitosa:', result);
    return result.data || [];
    
  } catch (error: any) {
    console.error('❌ [CLIENT-WRAPPER] Error en searchSuppliers:', error);
    return [];
  }
}

export async function searchProducts(term: string) {
  try {
    console.log('🔍 [CLIENT-WRAPPER] Buscando productos:', term);
    
    // 🧠 DECISIÓN INTELIGENTE
    const useServerActions = await shouldUseServerActions();
    
    if (useServerActions) {
      try {
        const result = await serverSearchProducts(term);
        console.log('✅ [CLIENT-WRAPPER] Server Action exitosa:', result);
        serverActionsWorking = true;
        return result;
      } catch (serverError: any) {
        console.warn('⚠️ [CLIENT-WRAPPER] Server Action falló, marcando como no funcional');
        serverActionsWorking = false;
        lastServerActionCheck = Date.now();
      }
    } else {
      console.log('🚀 [CLIENT-WRAPPER] Usando API Route directamente (Server Actions deshabilitadas)');
    }
    
    // Usar API Route
    const response = await fetch(`/api/products/search?term=${encodeURIComponent(term)}`);
    const result = await response.json();
    console.log('✅ [CLIENT-WRAPPER] API Route exitosa:', result);
    return result.data || [];
    
  } catch (error: any) {
    console.error('❌ [CLIENT-WRAPPER] Error en searchProducts:', error);
    return [];
  }
}

export async function findSupplierWithSuggestions(rut?: string, name?: string) {
  try {
    console.log('🔍 [CLIENT-WRAPPER] Buscando proveedor con sugerencias:', { rut, name });
    
    // 🧠 DECISIÓN INTELIGENTE
    const useServerActions = await shouldUseServerActions();
    
    if (useServerActions) {
      try {
        const result = await serverFindSupplierWithSuggestions(rut, name);
        console.log('✅ [CLIENT-WRAPPER] Server Action exitosa:', result);
        serverActionsWorking = true;
        return result;
      } catch (serverError: any) {
        console.warn('⚠️ [CLIENT-WRAPPER] Server Action falló, marcando como no funcional');
        serverActionsWorking = false;
        lastServerActionCheck = Date.now();
      }
    } else {
      console.log('🚀 [CLIENT-WRAPPER] Usando API Route directamente (Server Actions deshabilitadas)');
    }
    
    // Usar API Route
    const params = new URLSearchParams();
    if (rut) params.append('rut', rut);
    if (name) params.append('name', name);
    
    const response = await fetch(`/api/suppliers/suggestions?${params}`);
    const result = await response.json();
    console.log('✅ [CLIENT-WRAPPER] API Route exitosa:', result);
    return result.data || { exactMatch: null, suggestions: [], hasExactMatch: false };
    
  } catch (error: any) {
    console.error('❌ [CLIENT-WRAPPER] Error en findSupplierWithSuggestions:', error);
    return { exactMatch: null, suggestions: [], hasExactMatch: false };
  }
}

export async function getProducts(params: any) {
  try {
    console.log('🔍 [CLIENT-WRAPPER] Obteniendo productos:', params);
    
    // 🧠 DECISIÓN INTELIGENTE
    const useServerActions = await shouldUseServerActions();
    
    if (useServerActions) {
      try {
        const result = await serverGetProducts(params);
        console.log('✅ [CLIENT-WRAPPER] Server Action exitosa:', result);
        serverActionsWorking = true;
        return result;
      } catch (serverError: any) {
        console.warn('⚠️ [CLIENT-WRAPPER] Server Action falló, marcando como no funcional');
        serverActionsWorking = false;
        lastServerActionCheck = Date.now();
      }
    } else {
      console.log('🚀 [CLIENT-WRAPPER] Usando API Route directamente (Server Actions deshabilitadas)');
    }
    
    // Usar API Route
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params.categoryId) searchParams.append('categoryId', params.categoryId.toString());
    if (params.warehouseId) searchParams.append('warehouseId', params.warehouseId.toString());
    
    const response = await fetch(`/api/products/list?${searchParams}`);
    const result = await response.json();
    console.log('✅ [CLIENT-WRAPPER] API Route exitosa:', result);
    return result.data || { products: [], totalCount: 0 };
    
  } catch (error: any) {
    console.error('❌ [CLIENT-WRAPPER] Error en getProducts:', error);
    return { products: [], totalCount: 0 };
  }
}

// Re-exportar tipos para mantener compatibilidad
export type { ProductModular, PackageModular, PriceResult } from '@/actions/products/modular-products';