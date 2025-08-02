'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Package, Plus, Edit3, Trash2, Save, X, CheckCircle, DollarSign, Users, Settings, Eye, Tag, BarChart3, TrendingUp, Star, Search, ExternalLink, Edit, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { 
  getProductsModular, 
  updateProductModular as updateProduct, 
  deleteProductModular, 
  searchExistingProducts,
  linkRealProductToModular,
  getPackagesWithProducts,
  updatePackageProducts,
  testProductsModular
} from '@/actions/products/modular-products';
import { 
  createPackageModular, 
  updatePackageName, 
  deletePackageModular, 
  checkPackageNameExists,
  type PackageWithProducts as PackageWithProductsType
} from '@/actions/configuration/package-actions';
import { getProducts } from '@/actions/products/list';
import { Product } from '@/types/product';

// 🏷️ Categorías del sistema
const CATEGORIES = [
  { 
    key: 'alojamiento', 
    name: 'Alojamiento', 
    color: 'blue', 
    icon: '🏨',
    description: 'Habitaciones, suites y tipos de alojamiento disponibles',
    dbCategories: ['Habitaciones', 'Alojamiento', 'Programas Alojamiento']
  },
  { 
    key: 'comida', 
    name: 'Comidas', 
    color: 'green', 
    icon: '🍽️',
    description: 'Servicios de alimentación, restaurante y bebidas',
    dbCategories: ['Alimentación', 'Restaurante', 'Comidas', 'Bebidas']
  },
  { 
    key: 'spa', 
    name: 'Spa & Bienestar', 
    color: 'purple', 
    icon: '💆',
    description: 'Tratamientos de spa, masajes y servicios de bienestar',
    dbCategories: ['Spa', 'Tratamientos Spa', 'Masajes', 'Tratamientos Faciales', 'Circuitos Termales', 'Paquetes Spa']
  },
  { 
    key: 'entretenimiento', 
    name: 'Entretenimiento', 
    color: 'orange', 
    icon: '🎯',
    description: 'Actividades recreativas y entretenimiento para huéspedes',
    dbCategories: ['Entretenimiento', 'Actividades', 'Recreación']
  },
  { 
    key: 'servicios', 
    name: 'Servicios', 
    color: 'gray', 
    icon: '🛎️',
    description: 'Servicios adicionales como transporte, tecnología, etc.',
    dbCategories: ['Servicios', 'Servicios Generales', 'Tecnología', 'Transporte']
  }
];

interface PackageWithProducts extends PackageModular {
  products: string[];
}

interface ProductSearchModal {
  isOpen: boolean;
  category: string;
  searchTerm: string;
  availableProducts: any[];
  loading: boolean;
  searchError?: string;
  searchStrategy?: string;
}

interface AdminModularPanelProps {
  skippedRooms?: string[];
}

export default function AdminModularPanel({ skippedRooms }: AdminModularPanelProps) {
  const [activeTab, setActiveTab] = useState('packages');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para búsqueda de productos
  const [productSearch, setProductSearch] = useState<ProductSearchModal>({
    isOpen: false,
    category: '',
    searchTerm: '',
    availableProducts: [],
    loading: false
  });

  // Estados para gestión de paquetes
  const [editingPackageId, setEditingPackageId] = useState<number | null>(null);
  const [editingPackageName, setEditingPackageName] = useState<string>('');
  const [isCreatingPackage, setIsCreatingPackage] = useState<boolean>(false);
  const [newPackageName, setNewPackageName] = useState<string>('');
  const [packageError, setPackageError] = useState<string>('');
  const [deletingPackageId, setDeletingPackageId] = useState<number | null>(null);
  
  // Simulador configuración
  const [simAdults, setSimAdults] = useState(2);
  const [simChildren, setSimChildren] = useState(1);
  const [simNights, setSimNights] = useState(3);
  const [simRoom, setSimRoom] = useState('habitacion_estandar');
  
  const [products, setProducts] = useState<ProductModular[]>([]);
  const [packages, setPackages] = useState<PackageWithProductsType[]>([]);
  const [mainProducts, setMainProducts] = useState<Product[]>([]); // Nuevo estado para productos principales

  // 🔄 Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    console.log('🚨 LOAD DATA INICIADO - VERSIÓN DIRECTA CLIENTE');
    
    try {
      // DIAGNÓSTICO DIRECTO INLINE - Usando cliente de Supabase del lado cliente
      console.log('🔍 DIAGNÓSTICO DIRECTO: Importando createClient...');
      const { createClient } = await import('@/lib/supabase');
      
      console.log('🔍 DIAGNÓSTICO DIRECTO: Obteniendo cliente del lado cliente...');
      const supabase = createClient();
      
      console.log('🔍 DIAGNÓSTICO DIRECTO: Consultando products_modular...');
      const { data: rawData, error: rawError } = await supabase
        .from('products_modular')
        .select('*')
        .eq('is_active', true);
        
      console.log('🔍 DIAGNÓSTICO DIRECTO: Resultado RAW:', { rawData, rawError });
      
      if (rawData && rawData.length > 0) {
        console.log('✅ PRODUCTOS ENCONTRADOS EN BD:', rawData.length);
        rawData.forEach(p => console.log('📦 Producto:', p.id, p.name, p.category));
        
        // Mapear manualmente sin funciones externas
        const mappedProducts = rawData.map(product => ({
          id: product.id,
          code: product.code,
          name: product.name,
          description: product.description || '',
          price: Number(product.price) || 0,
          category: product.category,
          per_person: Boolean(product.per_person),
          is_active: Boolean(product.is_active),
          sort_order: Number(product.sort_order) || 0,
          original_id: product.original_id,
          sku: product.sku || ''
        }));
        
        console.log('✅ PRODUCTOS MAPEADOS:', mappedProducts);
        setProducts(mappedProducts);
      } else {
        console.log('❌ NO SE ENCONTRARON PRODUCTOS O ERROR:', rawError);
        setProducts([]);
      }

      // Cargar paquetes usando también cliente del lado cliente
      console.log('📦 Cargando paquetes...');
      const packagesWithProductsResult = await getPackagesWithProducts();
      console.log('📦 DEBUG - Resultado de getPackagesWithProducts:', packagesWithProductsResult);
      if (Array.isArray(packagesWithProductsResult)) {
        setPackages(packagesWithProductsResult);
      } else {
        console.error('Respuesta inesperada de getPackagesWithProducts:', packagesWithProductsResult);
        setPackages([]);
      }

      // Cargar productos principales para búsqueda
      const mainProductsResult = await getProducts({ page: 1, pageSize: 1000 });
      setMainProducts(mainProductsResult.products || []);
      
    } catch (error) {
      console.error('💥 ERROR COMPLETO en loadData:', error);
      console.error('💥 Stack trace:', error.stack);
      setProducts([]);
      setPackages([]);
      setMainProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // 📊 Estadísticas calculadas
  const stats = useMemo(() => {
    // Asegurar que products sea un array
    const productsArray = Array.isArray(products) ? products : [];
    const packagesArray = Array.isArray(packages) ? packages : [];
    
    return {
      totalProducts: productsArray.length,
      totalPackages: packagesArray.length,
      byCategory: CATEGORIES.map(cat => ({
        ...cat,
        count: productsArray.filter(p => p.category === cat.key).length,
        totalValue: productsArray.filter(p => p.category === cat.key).reduce((sum, p) => sum + p.price, 0)
      }))
    };
  }, [products, packages]);

  // 💰 Calcular precio de paquete
  const calculatePackagePrice = (packageId: number, adults = 2, children = 1, nights = 3) => {
    const packagesArray = Array.isArray(packages) ? packages : [];
    const productsArray = Array.isArray(products) ? products : [];
    
    const pkg = packagesArray.find(p => p.id === packageId);
    if (!pkg) return 0;

    let total = 0;
    pkg.products.forEach(productCode => {
      const product = productsArray.find(p => p.code === productCode);
      if (!product) return;

      if (product.per_person) {
        const adultsPrice = adults * product.price;
        const childrenPrice = children * product.price * 0.5;
        total += (adultsPrice + childrenPrice) * nights;
      } else {
        total += product.price * nights;
      }
    });

    return total;
  };

  // ✏️ Actualizar producto
  const updateProduct = async (productId: number, field: keyof ProductModular, value: any) => {
    try {
      const productsArray = Array.isArray(products) ? products : [];
      const product = productsArray.find(p => p.id === productId);
      if (!product) return;

      const updatedProduct = { ...product, [field]: value };
      const result = await updateProductModular(productId, updatedProduct);

      if (result.success) {
        setProducts(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map(p => p.id === productId ? updatedProduct : p);
        });
      } else {
        alert(`Error al actualizar producto: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  // 🗑️ Eliminar producto
  const deleteProduct = async (productId: number) => {
    const productsArray = Array.isArray(products) ? products : [];
    const product = productsArray.find(p => p.id === productId);
    if (!product) return;

    const confirmMessage = product.original_id 
      ? `¿Desactivar "${product.name}"? Este producto de la base de datos será ocultado del sistema modular.`
      : `¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const result = await deleteProductModular(productId);
      if (result.success) {
        setProducts(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.filter(p => p.id !== productId);
        });
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error inesperado al eliminar producto');
    }
  };

  // 🔍 Buscar productos existentes en la BD
  const searchExistingProducts = async (category: string) => {
    setProductSearch(prev => ({ 
      ...prev, 
      isOpen: true, 
      category, 
      loading: false,
      searchTerm: '',
      availableProducts: [],
      searchError: undefined,
      searchStrategy: undefined
    }));

    // CASO ESPECIAL: Para categoría "spa", ejecutar búsqueda automáticamente
    if (category === 'spa') {
      // Pequeño delay para asegurar que el modal se abra primero
      setTimeout(() => {
        performSearch();
      }, 100);
    }
  };

  // 🔎 Realizar búsqueda de productos
  const performSearch = async () => {
    setProductSearch(prev => ({ ...prev, loading: true }));

    // Timeout de seguridad para evitar búsquedas infinitas
    const searchTimeout = setTimeout(() => {
      console.warn('⏰ Timeout de búsqueda alcanzado - Cancelando búsqueda');
      setProductSearch(prev => ({ 
        ...prev, 
        loading: false, 
        availableProducts: [],
        searchError: 'La búsqueda tardó demasiado. Intenta con términos más específicos.'
      }));
    }, 30000); // 30 segundos de timeout

    try {
      const categoryData = CATEGORIES.find(c => c.key === productSearch.category);
      let allProducts: any[] = [];

      // CASO ESPECIAL: Para categoría "spa", mostrar todos los productos de spa y subcategorías
      if (productSearch.category === 'spa') {
        console.log('🧘 Búsqueda especial para categoría Spa - Mostrando todos los productos de spa y subcategorías');
        
        // Búsqueda robusta con manejo de errores mejorado
        const spaSearchTerms = [
          'spa', 'masaje', 'tratamiento', 
          'facial', 'termal', 'circuito', 'paquete'
        ];
        
        // Procesar búsquedas en lotes más pequeños para evitar saturar la conexión
        for (let i = 0; i < spaSearchTerms.length; i += 2) {
          const batch = spaSearchTerms.slice(i, i + 2);
          
          // Procesar lote con delay entre búsquedas
          for (const searchTerm of batch) {
            try {
              const searchResults = await getProducts({
                page: '1',
                pageSize: '50', // Reducir tamaño para evitar timeouts
                search: searchTerm
              });

              // Agregar productos únicos (evitar duplicados)
              const newProducts = (searchResults.products || []).filter(newProduct => 
                !allProducts.some(existingProduct => existingProduct.id === newProduct.id)
              );
              
              allProducts = [...allProducts, ...newProducts];
              console.log(`📦 Encontrados ${newProducts.length} productos para término "${searchTerm}"`);
              
              // Pequeño delay entre búsquedas para evitar sobrecarga
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              console.warn(`⚠️ Error buscando término "${searchTerm}":`, error);
              // Continuar con el siguiente término en lugar de fallar
            }
          }
        }

        // Búsqueda adicional por nombres de categorías específicas de BD
        if (categoryData?.dbCategories) {
          for (const dbCategory of categoryData.dbCategories) {
            try {
              const categoryResults = await getProducts({
                page: '1',
                pageSize: '50',
                search: dbCategory
              });

              const newProducts = (categoryResults.products || []).filter(newProduct => 
                !allProducts.some(existingProduct => existingProduct.id === newProduct.id)
              );
              
              allProducts = [...allProducts, ...newProducts];
              console.log(`🏷️ Encontrados ${newProducts.length} productos para categoría BD "${dbCategory}"`);
            } catch (error) {
              console.warn(`⚠️ Error buscando categoría BD "${dbCategory}":`, error);
            }
          }
        }

        // Si hay término de búsqueda específico, también buscar por ese término
        if (productSearch.searchTerm.trim()) {
          try {
            const specificResults = await getProducts({
              page: '1',
              pageSize: '50',
              search: productSearch.searchTerm
            });
            
            const newProducts = (specificResults.products || []).filter(newProduct => 
              !allProducts.some(existingProduct => existingProduct.id === newProduct.id)
            );
            
            allProducts = [...allProducts, ...newProducts];
            console.log(`🎯 Encontrados ${newProducts.length} productos para término específico "${productSearch.searchTerm}"`);
          } catch (error) {
            console.warn(`⚠️ Error buscando término específico "${productSearch.searchTerm}":`, error);
          }
        }
      } else {
        // Estrategia de búsqueda normal para otras categorías
        if (!productSearch.searchTerm.trim()) return;

        // PASO 1: Búsqueda directa por término del usuario
        const searchResults = await getProducts({ 
          page: '1', 
          pageSize: '100',
          search: productSearch.searchTerm
        });

        allProducts = [...(searchResults.products || [])];

        // PASO 2: Si hay pocas coincidencias, buscar por términos relacionados con la categoría
        if (allProducts.length < 5 && categoryData) {
          console.log(`🔍 Pocas coincidencias (${allProducts.length}), expandiendo búsqueda...`);
          
          // Buscar por cada término de categoría relacionado
          for (const categoryTerm of categoryData.dbCategories) {
            try {
              const categoryResults = await getProducts({
                page: '1',
                pageSize: '50', 
                search: categoryTerm
              });

              // Agregar productos únicos (evitar duplicados)
              const newProducts = (categoryResults.products || []).filter(newProduct => 
                !allProducts.some(existingProduct => existingProduct.id === newProduct.id)
              );
              
              allProducts = [...allProducts, ...newProducts];
              console.log(`📦 Encontrados ${newProducts.length} productos adicionales para "${categoryTerm}"`);
            } catch (error) {
              console.warn(`⚠️ Error buscando categoría "${categoryTerm}":`, error);
            }
          }
        }

        // PASO 3: Si aún hay pocas coincidencias, buscar por palabras clave generales
        if (allProducts.length < 3 && categoryData) {
          console.log(`🔍 Expandiendo búsqueda con palabras clave para ${categoryData.name}...`);
          
          const keywordsByCategory = {
            'alojamiento': ['habitacion', 'suite', 'room', 'alojamiento', 'dormitorio'],
            'comida': ['desayuno', 'almuerzo', 'cena', 'comida', 'bebida', 'buffet', 'restaurante'],
            'spa': ['spa', 'masaje', 'tratamiento', 'relajacion', 'termal', 'bienestar'],
            'entretenimiento': ['actividad', 'juego', 'entretenimiento', 'recreacion', 'piscina'],
            'servicios': ['servicio', 'wifi', 'transporte', 'parking', 'tecnologia']
          };

          const keywords = keywordsByCategory[productSearch.category] || [];
          
          for (const keyword of keywords) {
            try {
              const keywordResults = await getProducts({
                page: '1',
                pageSize: '20',
                search: keyword
              });
              
              const newProducts = (keywordResults.products || []).filter(newProduct => 
                !allProducts.some(existingProduct => existingProduct.id === newProduct.id)
              );
              
              allProducts = [...allProducts, ...newProducts];
              
              if (newProducts.length > 0) {
                console.log(`🎯 Encontrados ${newProducts.length} productos para palabra clave "${keyword}"`);
              }
            } catch (error) {
              console.warn(`⚠️ Error buscando palabra clave "${keyword}":`, error);
            }
          }
        }
      }

      // Filtrar productos que ya están en el sistema modular
      const productsArray = Array.isArray(products) ? products : [];
      const existingCodes = productsArray.map(p => p.original_id || p.id);
      const filteredResults = allProducts.filter(product => 
        !existingCodes.includes(product.id)
      );

      console.log(`📊 Búsqueda completada: ${allProducts.length} encontrados, ${filteredResults.length} disponibles`);

      // Limpiar timeout
      clearTimeout(searchTimeout);

      setProductSearch(prev => ({ 
        ...prev, 
        availableProducts: filteredResults,
        loading: false
      }));

    } catch (error) {
      console.error('Error searching products:', error);
      
      // Limpiar timeout en caso de error
      clearTimeout(searchTimeout);
      
      setProductSearch(prev => ({ 
        ...prev, 
        loading: false, 
        availableProducts: [],
        searchError: 'Error al buscar productos. Intenta con otros términos.'
      }));
    }
  };

  // ➕ Agregar producto existente al sistema modular
  const addExistingProductToModular = async (product: any) => {
    // Mostrar indicador de carga
    setProductSearch(prev => ({ ...prev, loading: true }));
    
    try {
      console.log('🔍 Vinculando producto al sistema modular:', product);
      
      // Determinar categoría modular
      const modularCategory = mapCategoryToModular(product.categoryName, product.name);
      console.log('📂 Categoría modular asignada:', modularCategory);
      
      // Usar la función de vinculación corregida
      const result = await linkRealProductToModular(product.id, modularCategory);
      
      if (result.success && result.data) {
        console.log('✅ Producto vinculado exitosamente:', result.data);
        
        // Recargar datos para asegurar sincronización
        await loadData();
        
        // Forzar re-render con un delay mínimo
        setTimeout(() => {
          setProducts(prev => [...prev]); // Force re-render
        }, 100);
        
        // Mostrar confirmación
        alert(`Producto "${product.name}" vinculado exitosamente a la categoría ${CATEGORIES.find(c => c.key === modularCategory)?.name}`);
        
        // Remover de disponibles y cerrar modal si no hay más productos
        setProductSearch(prev => ({
          ...prev,
          availableProducts: prev.availableProducts.filter(p => p.id !== product.id)
        }));
      } else {
        console.error('❌ Error al vincular producto:', result.error);
        alert(`Error al vincular producto: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Error linking product to modular system:', error);
      alert('Error inesperado al vincular producto al sistema modular');
    } finally {
      // Ocultar indicador de carga
      setProductSearch(prev => ({ ...prev, loading: false }));
    }
  };

  // 🗺️ Mapear categoría de BD a categoría modular
  const mapCategoryToModular = (categoryName?: string, productName?: string): string => {
    // Verificar también el nombre del producto para mejor detección
    const category = (categoryName || '').toLowerCase();
    const product = (productName || '').toLowerCase();
    
    // Detectar alojamiento por categoría O nombre del producto
    if (category.includes('alojamiento') || category.includes('habitacion') || category.includes('programa') ||
        product.includes('habitacion') || product.includes('suite') || product.includes('cuarto') ||
        product.includes('dormitorio') || product.includes('alojamiento')) {
      return 'alojamiento';
    }
    
    // Detectar comida
    if (category.includes('alimentacion') || category.includes('comida') || category.includes('bebida') || 
        category.includes('restaurante') || category.includes('desayuno') || category.includes('almuerzo') ||
        product.includes('desayuno') || product.includes('almuerzo') || product.includes('cena') ||
        product.includes('comida') || product.includes('buffet')) {
      return 'comida';
    }
    
    // Detectar spa
    if (category.includes('spa') || category.includes('masaje') || category.includes('tratamiento') || 
        category.includes('termal') || product.includes('spa') || product.includes('masaje') ||
        product.includes('tratamiento') || product.includes('termal')) {
      return 'spa';
    }
    
    // Detectar entretenimiento
    if (category.includes('entretenimiento') || category.includes('actividad') ||
        product.includes('entretenimiento') || product.includes('actividad') || product.includes('juego')) {
      return 'entretenimiento';
    }
    
    return 'servicios';
  };

  // 🏷️ Generar código de producto
  const generateProductCode = (name: string, id: number): string => {
    const cleanName = name.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '_')
          .substring(0, 20);
    return `${cleanName}_${id}`;
  };

  const savePackageName = async () => {
    // Validaciones
    if (!editingPackageName.trim()) {
      setPackageError('El nombre del paquete no puede estar vacío');
      return;
    }

    const trimmedName = editingPackageName.trim();
    
    try {
      // Verificar si existe un paquete con ese nombre
      const nameExists = await checkPackageNameExists(trimmedName, editingPackageId);
      if (nameExists) {
        setPackageError('Ya existe un paquete con ese nombre');
        return;
      }

      // Actualizar en la base de datos
      await updatePackageName(editingPackageId!, trimmedName);
      
      // Actualizar estado local
      const packagesArray = Array.isArray(packages) ? packages : [];
      const updatedPackages = packagesArray.map(pkg => 
        pkg.id === editingPackageId 
          ? { ...pkg, name: trimmedName }
          : pkg
      );
      setPackages(updatedPackages);
      
      setEditingPackageId(null);
      setEditingPackageName('');
      setPackageError('');
    } catch (error) {
      console.error('Error guardando paquete:', error);
      setPackageError('Error al guardar el paquete');
    }
  };

  const createPackage = async () => {
    // Validaciones
    if (!newPackageName.trim()) {
      setPackageError('El nombre del paquete no puede estar vacío');
      return;
    }

    const trimmedName = newPackageName.trim();
    
    try {
      // Verificar si existe un paquete con ese nombre
      const nameExists = await checkPackageNameExists(trimmedName);
      if (nameExists) {
        setPackageError('Ya existe un paquete con ese nombre');
        return;
      }

      // Crear en la base de datos
      const newPackage = await createPackageModular(trimmedName);
      
      // Agregar a estado local
      const packageWithProducts: PackageWithProductsType = {
        ...newPackage,
        products: []
      };
      
      const packagesArray = Array.isArray(packages) ? packages : [];
      setPackages([packageWithProducts, ...packagesArray]);
      setIsCreatingPackage(false);
      setNewPackageName('');
      setPackageError('');
    } catch (error) {
      console.error('Error creando paquete:', error);
      setPackageError('Error al crear el paquete');
    }
  };

  const deletePackage = async () => {
    if (!deletingPackageId) return;

    try {
      // Eliminar de la base de datos
      await deletePackageModular(deletingPackageId);
      
      // Actualizar estado local
      const packagesArray = Array.isArray(packages) ? packages : [];
      const updatedPackages = packagesArray.filter(pkg => pkg.id !== deletingPackageId);
      setPackages(updatedPackages);
      setDeletingPackageId(null);
    } catch (error) {
      console.error('Error eliminando paquete:', error);
      setPackageError('Error al eliminar el paquete');
    }
  };

  // Funciones auxiliares para gestión de paquetes
  const startEditingPackage = (packageId: number, currentName: string) => {
    setEditingPackageId(packageId);
    setEditingPackageName(currentName);
    setPackageError('');
  };

  const cancelEditingPackage = () => {
    setEditingPackageId(null);
    setEditingPackageName('');
    setPackageError('');
  };

  const startCreatingPackage = () => {
    setIsCreatingPackage(true);
    setNewPackageName('');
    setPackageError('');
  };

  const cancelCreatingPackage = () => {
    setIsCreatingPackage(false);
    setNewPackageName('');
    setPackageError('');
  };

  const confirmDeletePackage = (packageId: number) => {
    setDeletingPackageId(packageId);
  };

  const cancelDeletePackage = () => {
    setDeletingPackageId(null);
  };

  const toggleProductInPackage = async (packageId: number, productCode: string) => {
    setPackageError('');
    
    try {
      // Encontrar el paquete
      const packagesArray = Array.isArray(packages) ? packages : [];
      const packageToUpdate = packagesArray.find(p => p.id === packageId);
      if (!packageToUpdate) {
        console.error('Paquete no encontrado:', packageId);
        setPackageError('Paquete no encontrado.');
        return;
      }

      // Verificar si el producto ya está en el paquete
      const isProductInPackage = packageToUpdate.products.includes(productCode);
      
      // Crear nueva lista de productos
      let newProductCodes: string[];
      if (isProductInPackage) {
        // Remover producto del paquete
        newProductCodes = packageToUpdate.products.filter(code => code !== productCode);
      } else {
        // Agregar producto al paquete
        newProductCodes = [...packageToUpdate.products, productCode];
      }

      // Usar la función updatePackageProducts corregida
      const result = await updatePackageProducts(packageId, newProductCodes);
      
      if (result.success) {
        // Actualizar estado local
        const updatedPackages = packages.map(pkg => 
          pkg.id === packageId 
            ? { ...pkg, products: newProductCodes }
            : pkg
        );
        setPackages(updatedPackages);
      } else {
        setPackageError(result.error || 'Error al actualizar productos del paquete');
      }
    } catch (error) {
      console.error('Error toggleando producto en paquete:', error);
      setPackageError('Error al actualizar productos del paquete');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sistema modular...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Profesional */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Settings className="text-blue-600" size={28} />
                </div>
                Panel de Administración - Sistema Modular
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona productos individuales y configura paquetes de forma inteligente
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Última actualización</p>
              <p className="text-sm font-medium text-gray-900">Hoy {new Date().toLocaleTimeString()}</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    console.log('🔍 Estado actual de productos:', products);
                    console.log('🔍 Productos por categoría:', products.reduce((acc, p) => {
                      if (!acc[p.category]) acc[p.category] = [];
                      acc[p.category].push(p.name);
                      return acc;
                    }, {} as Record<string, string[]>));
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                >
                  🔍 Debug
                </button>
                <button 
                  onClick={loadData}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                >
                  🔄 Recargar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Información de Integración */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <BarChart3 className="text-blue-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                🔗 Integración con Base de Datos Principal
              </h3>
              <p className="text-blue-800 mb-3">
                Este sistema usa exclusivamente productos de tu base de datos principal, organizándolos automáticamente en categorías modulares para crear paquetes.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">🔍</span>
                  <span className="text-sm text-blue-700">Buscar productos existentes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">➕</span>
                  <span className="text-sm text-blue-700">Crear nuevos en gestión principal</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full font-medium">📦</span>
                  <span className="text-sm text-blue-700">Organizar en paquetes modulares</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard de Estadísticas Mejorado */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Productos Total */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Productos</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalProducts}</p>
                <p className="text-xs text-green-600 mt-1">↗ +3 este mes</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          {/* Paquetes Total */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Paquetes</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalPackages}</p>
                <p className="text-xs text-blue-600 mt-1">→ Estable</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Tag className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          {/* Categorías dinámicas */}
          {stats.byCategory.slice(0, 3).map((cat, index) => (
            <div key={cat.key} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{cat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{cat.count} productos</p>
                  <p className="text-xs text-gray-500">${cat.totalValue.toLocaleString()}</p>
                </div>
                <div className="text-2xl">{cat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs Mejorada */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="inline mr-2" size={16} />
                Gestión de Productos
              </button>
              <button
                onClick={() => setActiveTab('packages')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'packages'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Tag className="inline mr-2" size={16} />
                Configuración de Paquetes
              </button>
              <button
                onClick={() => setActiveTab('simulator')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'simulator'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DollarSign className="inline mr-2" size={16} />
                Simulador de Precios
              </button>
            </nav>
          </div>
        </div>

        {/* CONTENIDO: Gestión de Productos */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Renderizar productos por categoría */}
            {CATEGORIES.map(category => {
              const categoryProducts = Array.isArray(products) ? products.filter(p => p.category === category.key) : [];
              
              if (categoryProducts.length === 0 && selectedCategory === 'all') {
                return null;
              }
              
              return (
                <div key={category.key} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-600">
                          {categoryProducts.length} productos • ${categoryProducts.reduce((sum, p) => sum + p.price, 0).toLocaleString()} <span className="text-blue-600 font-medium">(IVA incluido)</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => searchExistingProducts(category.key)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
                      >
                        <Plus size={14} />
                        Agregar
                      </button>
                      <button
                        onClick={() => {
                          setTimeout(() => setProducts(prev => [...prev]), 100);
                        }}
                        className="bg-gray-500 text-white px-3 py-1 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-1 text-sm"
                      >
                        <RefreshCw size={14} />
                        Actualizar
                      </button>
                    </div>
                  </div>

                  {categoryProducts.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryProducts.map(product => (
                        <div key={product.id} className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-500">
                              {product.code}
                            </span>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                              title={product.original_id ? "Desactivar producto" : "Eliminar producto"}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-3">{product.name}</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Precio:</span>
                              {editingProduct === product.id ? (
                                <input
                                  type="number"
                                  value={product.price}
                                  onChange={(e) => updateProduct(product.id, 'price', parseFloat(e.target.value))}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                  onBlur={() => setEditingProduct(null)}
                                  autoFocus
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-lg">
                                    ${product.price.toLocaleString('es-CL')}
                                  </span>
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">IVA incluido</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Tipo:</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                product.per_person ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {product.per_person ? 'Por Persona' : 'Precio Fijo'}
                              </span>
                            </div>
                            {product.original_id && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Fuente:</span>
                                <span className="text-xs text-blue-600">
                                  Producto DB #{product.original_id}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* CONTENIDO: Configuración de Paquetes */}
        {activeTab === 'packages' && (
          <div className="space-y-6">
            {/* Header con botón crear paquete */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Gestión de Paquetes</h3>
                {!isCreatingPackage && (
                  <button
                    onClick={startCreatingPackage}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Crear Paquete
                  </button>
                )}
              </div>

              {/* Crear nuevo paquete */}
              {isCreatingPackage && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newPackageName}
                      onChange={(e) => setNewPackageName(e.target.value)}
                      placeholder="Nombre del nuevo paquete..."
                      className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          createPackage();
                        }
                      }}
                    />
                    <button
                      onClick={createPackage}
                      disabled={!newPackageName.trim()}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={cancelCreatingPackage}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                  {packageError && (
                    <p className="text-red-600 text-sm mt-2">{packageError}</p>
                  )}
                </div>
              )}

              {/* Lista de paquetes */}
              <div className="space-y-4">
            {packages.map(pkg => (
                  <div key={pkg.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    {/* Header del paquete con edición inline */}
                    <div className={`p-4 ${
                  pkg.color === 'blue' ? 'bg-blue-50 border-l-4 border-blue-500' :
                  pkg.color === 'green' ? 'bg-green-50 border-l-4 border-green-500' :
                  pkg.color === 'purple' ? 'bg-purple-50 border-l-4 border-purple-500' :
                  pkg.color === 'red' ? 'bg-red-50 border-l-4 border-red-500' :
                  'bg-gray-50 border-l-4 border-gray-500'
                }`}>
                  <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {editingPackageId === pkg.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingPackageName}
                                onChange={(e) => setEditingPackageName(e.target.value)}
                                className="flex-1 px-3 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    savePackageName();
                                  }
                                }}
                              />
                              <button
                                onClick={savePackageName}
                                className="p-1 text-green-600 hover:bg-green-100 rounded"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                onClick={cancelEditingPackage}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
                              <button
                                onClick={() => startEditingPackage(pkg.id, pkg.name)}
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Edit size={16} />
                              </button>
                            </div>
                          )}
                      <p className="text-sm text-gray-600 mt-1">
                        {pkg.products.length} productos incluidos • Precio ejemplo (1 persona, 1 noche): ${calculatePackagePrice(pkg.id, 1, 0, 1).toLocaleString()} <span className="text-green-600 font-medium">(IVA incluido)</span>
                      </p>
                    </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium uppercase tracking-wide ${
                      pkg.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                      pkg.color === 'green' ? 'bg-green-100 text-green-800' :
                      pkg.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                      pkg.color === 'red' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {pkg.code}
                    </span>
                          <button
                            onClick={() => confirmDeletePackage(pkg.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                  </div>
                      </div>
                      {packageError && editingPackageId === pkg.id && (
                        <p className="text-red-600 text-sm mt-2">{packageError}</p>
                      )}
                </div>

                {/* Contenido del paquete */}
                    <div className="p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Productos Incluidos */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CheckCircle className="text-green-500" size={20} />
                        Productos Incluidos
                      </h4>
                      <div className="space-y-3">
                        {pkg.products.map(productCode => {
                          const product = products.find(p => p.code === productCode);
                          if (!product) return null;
                          return (
                            <div key={productCode} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <CheckCircle size={16} className="text-green-500" />
                                <div>
                                  <span className="font-medium text-gray-900">{product.name}</span>
                                  <p className="text-xs text-gray-500">{CATEGORIES.find(c => c.key === product.category)?.name}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="font-bold text-gray-900">${product.price.toLocaleString('es-CL')}</span>
                                  <div className="text-xs text-green-600 font-medium">IVA incluido</div>
                                </div>
                                <button
                                  onClick={() => toggleProductInPackage(pkg.id, productCode)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Productos Disponibles */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Plus className="text-blue-500" size={20} />
                        Productos Disponibles
                      </h4>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {products
                          .filter(product => !pkg.products.includes(product.code))
                          .filter(product => product.category !== 'alojamiento')
                          .map(product => (
                            <div key={product.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm">{CATEGORIES.find(c => c.key === product.category)?.icon}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900">{product.name}</span>
                                  <p className="text-xs text-gray-500">{CATEGORIES.find(c => c.key === product.category)?.name}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="font-bold text-gray-900">${product.price.toLocaleString('es-CL')}</span>
                                  <div className="text-xs text-green-600 font-medium">IVA incluido</div>
                                </div>
                                <button
                                  onClick={() => toggleProductInPackage(pkg.id, product.code)}
                                  className="p-1 text-green-500 hover:bg-green-50 rounded transition-colors"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO: Simulador de Precios */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            {/* Controles del Simulador */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <DollarSign className="text-green-600" />
                Simulador de Precios Interactivo
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">Precios con IVA incluido</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adultos</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSimAdults(Math.max(1, simAdults - 1))}
                      className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-bold text-lg">{simAdults}</span>
                    <button
                      onClick={() => setSimAdults(simAdults + 1)}
                      className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Niños</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSimChildren(Math.max(0, simChildren - 1))}
                      className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-bold text-lg">{simChildren}</span>
                    <button
                      onClick={() => setSimChildren(simChildren + 1)}
                      className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Noches</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSimNights(Math.max(1, simNights - 1))}
                      className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-bold text-lg">{simNights}</span>
                    <button
                      onClick={() => setSimNights(simNights + 1)}
                      className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Habitación</label>
                  <select
                    value={simRoom}
                    onChange={(e) => setSimRoom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {(Array.isArray(products) ? products : []).filter(p => p.category === 'alojamiento').map(room => (
                      <option key={room.code} value={room.code}>{room.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Resultados del Simulador */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(Array.isArray(packages) ? packages : []).map(pkg => {
                  const roomPrice = (Array.isArray(products) ? products : []).find(p => p.code === simRoom)?.price || 0;
                  const servicesPrice = calculatePackagePrice(pkg.id, simAdults, simChildren, simNights);
                  const totalPrice = (roomPrice * simNights) + servicesPrice;

                  return (
                    <div key={pkg.id} className={`border-2 rounded-xl p-6 ${
                      pkg.color === 'blue' ? 'border-blue-200 bg-blue-50' :
                      pkg.color === 'green' ? 'border-green-200 bg-green-50' :
                      pkg.color === 'purple' ? 'border-purple-200 bg-purple-50' :
                      pkg.color === 'red' ? 'border-red-200 bg-red-50' :
                      'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-gray-900">{pkg.name}</h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium uppercase ${
                          pkg.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          pkg.color === 'green' ? 'bg-green-100 text-green-800' :
                          pkg.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                          pkg.color === 'red' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {pkg.code}
                        </span>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Habitación ({simNights} noches):</span>
                          <span className="font-semibold">${(roomPrice * simNights).toLocaleString('es-CL')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Servicios incluidos:</span>
                          <span className="font-semibold">${servicesPrice.toLocaleString('es-CL')}</span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex justify-between">
                            <span className="text-lg font-bold text-gray-900">Total:</span>
                            <span className="text-lg font-bold text-gray-900">${totalPrice.toLocaleString('es-CL')}</span>
                          </div>
                          <p className="text-xs text-gray-500 text-right">
                            ${Math.round(totalPrice / simNights).toLocaleString('es-CL')} por noche
                          </p>
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="text-green-600" size={14} />
                              <span className="text-xs font-medium text-green-800">PRECIO FINAL CON IVA INCLUIDO (19%)</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600 mb-2">Productos incluidos:</p>
                        <div className="flex flex-wrap gap-1">
                          {pkg.products.slice(0, 3).map(productCode => {
                            const product = (Array.isArray(products) ? products : []).find(p => p.code === productCode);
                            return product ? (
                              <span key={productCode} className="text-xs bg-white bg-opacity-70 text-gray-700 px-2 py-1 rounded-full">
                                {product.name}
                              </span>
                            ) : null;
                          })}
                          {pkg.products.length > 3 && (
                            <span className="text-xs text-gray-500">+{pkg.products.length - 3} más</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación para eliminar paquete */}
        {deletingPackageId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="text-red-600" size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Eliminar Paquete</h3>
                </div>
                
                <p className="text-gray-600 mb-6">
                  ¿Estás seguro de que quieres eliminar el paquete "{(Array.isArray(packages) ? packages : []).find(p => p.id === deletingPackageId)?.name}"?
                </p>
                
                <p className="text-sm text-red-600 mb-6 bg-red-50 p-3 rounded-lg">
                  ⚠️ Esta acción no se puede deshacer. Se eliminarán todos los productos asociados al paquete.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={deletePackage}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={cancelDeletePackage}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Búsqueda de Producto */}
        {productSearch.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Search className="text-blue-600" />
                    Buscar Producto - {CATEGORIES.find(c => c.key === productSearch.category)?.name}
                  </h3>
                  <button
                    onClick={() => setProductSearch(prev => ({ 
                      ...prev, 
                      isOpen: false, 
                      searchError: undefined,
                      searchStrategy: undefined,
                      availableProducts: [],
                      searchTerm: ''
                    }))}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Búsqueda y botón crear */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Buscar productos existentes
                    </label>
                      <div className="flex gap-2">
                    <input
                      type="text"
                          value={productSearch.searchTerm}
                          onChange={(e) => setProductSearch(prev => ({ 
                            ...prev, 
                            searchTerm: e.target.value,
                            searchError: undefined // Reset error al escribir
                          }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={productSearch.category === 'spa' ? "Filtrar productos de spa (opcional)..." : "Buscar por nombre, categoría, SKU..."}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              // Realizar búsqueda
                              performSearch();
                            }
                          }}
                        />
                        <button
                          onClick={performSearch}
                          disabled={!productSearch.searchTerm.trim() && productSearch.category !== 'spa'}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          <Search size={16} />
                          {productSearch.category === 'spa' ? 'Mostrar Todo' : 'Buscar'}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col justify-end">
                      <Link href="/dashboard/configuration/products/create">
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                          <ExternalLink size={16} />
                          Crear Nuevo
                        </button>
                      </Link>
                    </div>
                  </div>

                  {/* Información de categoría */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{CATEGORIES.find(c => c.key === productSearch.category)?.icon}</span>
                      <span className="font-medium">Categoría: {CATEGORIES.find(c => c.key === productSearch.category)?.name}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {CATEGORIES.find(c => c.key === productSearch.category)?.description}
                    </p>
                    
                    {/* Mensaje especial para categoría Spa */}
                    {productSearch.category === 'spa' ? (
                      <div className="mt-3 p-3 bg-purple-50 rounded border border-purple-200">
                        <p className="text-xs text-purple-800 font-medium mb-1">🧘 Búsqueda automática para Spa:</p>
                        <ul className="text-xs text-purple-700 space-y-1">
                          <li>• <strong>Mostrando automáticamente</strong> todos los productos de Spa y subcategorías</li>
                          <li>• <strong>Categorías incluidas:</strong> Spa, Tratamientos Spa, Masajes, Tratamientos Faciales, Circuitos Termales, Paquetes Spa</li>
                          <li>• <strong>Palabras clave:</strong> spa, masaje, tratamiento, relajación, termal, bienestar</li>
                        </ul>
                        <p className="text-xs text-purple-600 mt-2 italic">
                          💡 Puedes escribir un término específico para filtrar los resultados mostrados
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-xs text-blue-800 font-medium mb-1">🔍 Estrategia de búsqueda inteligente:</p>
                        <ul className="text-xs text-blue-700 space-y-1">
                          <li>• <strong>Paso 1:</strong> Buscar por tu término exacto</li>
                          <li>• <strong>Paso 2:</strong> Si hay pocas coincidencias, buscar en categorías: {CATEGORIES.find(c => c.key === productSearch.category)?.dbCategories.join(', ')}</li>
                          <li>• <strong>Paso 3:</strong> Expandir con palabras clave relacionadas si es necesario</li>
                        </ul>
                        <p className="text-xs text-blue-600 mt-2 italic">
                          💡 No te preocupes si las categorías específicas no existen, el sistema buscará de forma inteligente
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Resultados de búsqueda */}
                  {productSearch.loading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <span className="text-gray-600 text-center">Buscando productos...</span>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Aplicando búsqueda inteligente en múltiples pasos
                      </p>
                      <button
                        onClick={() => setProductSearch(prev => ({ 
                          ...prev, 
                          loading: false, 
                          availableProducts: [],
                          searchError: 'Búsqueda cancelada por el usuario'
                        }))}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <X size={16} />
                        Cancelar Búsqueda
                      </button>
                    </div>
                  ) : productSearch.searchError ? (
                    <div className="text-center py-8">
                      <div className="text-red-400 mb-2">⚠️</div>
                      <p className="text-red-600 mb-4">{productSearch.searchError}</p>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Sugerencias:</p>
                        <ul className="text-xs text-gray-500 space-y-1">
                          <li>• Intenta con términos más generales (ej: "habitacion" en lugar de "habitación deluxe")</li>
                          <li>• Usa palabras clave simples (ej: "spa", "comida", "servicio")</li>
                          <li>• Verifica que existan productos en tu base de datos</li>
                        </ul>
                  </div>
                    </div>
                  ) : productSearch.availableProducts.length > 0 ? (
                  <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">
                          Productos encontrados ({productSearch.availableProducts.length})
                        </h4>
                        <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          ✅ Búsqueda exitosa
                    </div>
                  </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                        {productSearch.availableProducts.map(product => (
                          <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900">{product.name}</h5>
                                <p className="text-sm text-gray-500">{product.categoryName}</p>
                                {product.sku && (
                                  <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                                )}
                    </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">${product.salePrice?.toLocaleString() || 0}</p>
                                <p className="text-xs text-green-600 font-medium">IVA incluido</p>
                                <button
                                  onClick={() => addExistingProductToModular(product)}
                                  className="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                                >
                                  <Plus size={14} />
                                  Agregar
                                </button>
                              </div>
                            </div>
                            {product.description && (
                              <p className="text-sm text-gray-600">{product.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : productSearch.searchTerm && !productSearch.loading ? (
                    <div className="text-center py-8">
                      <div className="text-orange-400 mb-2">🔍</div>
                      <p className="text-gray-600 mb-2">No se encontraron productos disponibles para "{productSearch.searchTerm}"</p>
                      <p className="text-sm text-gray-500 mb-4">
                        Esto puede significar que los productos ya están agregados al sistema modular o que no existen productos con esos términos.
                      </p>
                      <div className="space-y-3">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-xs text-yellow-800 font-medium mb-1">💡 Qué puedes hacer:</p>
                          <ul className="text-xs text-yellow-700 space-y-1 text-left">
                            <li>• Probar con términos diferentes o más generales</li>
                            <li>• Crear un nuevo producto si no existe</li>
                            <li>• Verificar si el producto ya está en otra categoría</li>
                          </ul>
                  </div>
                        <Link href="/dashboard/configuration/products/create">
                          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto">
                            <Plus size={16} />
                            Crear nuevo producto
                          </button>
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Botón cerrar */}
                <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setProductSearch(prev => ({ 
                      ...prev, 
                      isOpen: false, 
                      searchError: undefined,
                      searchStrategy: undefined,
                      availableProducts: [],
                      searchTerm: ''
                    }))}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Advertencia de habitaciones no sincronizadas eliminada por obsoleta. */}
    </div>
  );
} 