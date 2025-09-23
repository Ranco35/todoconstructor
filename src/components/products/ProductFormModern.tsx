'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ProductType, ProductFormData } from '@/types/product';
import TipoProductoSelector from './TipoProductoSelector';
import BodegaSelector from './BodegaSelector';
import CategorySelector from './CategorySelector';
import UnitMeasureSelector from './UnitMeasureSelector';
import ProductStateSelector from './ProductStateSelector';
import ProductUsageSelector from './ProductUsageSelector';
import StorageSelector from './StorageSelector';
import InvoicePolicySelector from './InvoicePolicySelector';
import SaleLineWarningSelector from './SaleLineWarningSelector';
import SupplierSearchSelector from '@/components/suppliers/shared/SupplierSearchSelector';
import { createProduct } from '@/actions/products/create';
import { updateProduct } from '@/actions/products/update';
import { getWarehouseById } from '@/actions/configuration/warehouse-actions';
import { generateIntelligentSKU } from '@/actions/products/sku';
import POSCategoryDoubleSelector from '@/components/pos/POSCategoryDoubleSelector';
import { Save, Package, Tag, Image, FileText, Building2, Grid3x3, RefreshCw, DollarSign, Truck, Settings, Wrench, Layers } from 'lucide-react';
import { getAllUnits } from '@/utils/unit-conversions';
import { ProductImageUploader } from './ProductImageUploader';
import ComboComponentsManager from './ComboComponentsManager';
import { toast } from '@/hooks/use-toast';

interface ProductFormModernProps {
  initialData?: any;
  action?: (formData: FormData) => Promise<any>;
  isEdit?: boolean;
}

export default function ProductFormModern({ initialData, action, isEdit = false }: ProductFormModernProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warehouseWarning, setWarehouseWarning] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basica');
  const [isGeneratingSKU, setIsGeneratingSKU] = useState(false);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [suggestedPrice, setSuggestedPrice] = useState<number>(0);
  const [autoSaving, setAutoSaving] = useState(false);
  const [hasRestoredData, setHasRestoredData] = useState(false);
  const hasRestoredRef = useRef(false);
  
  // Clave única para localStorage basada en si es edición o creación
  const STORAGE_KEY = isEdit && initialData?.id 
    ? `product-form-edit-${initialData.id}` 
    : 'product-form-create';

  // Funciones para persistencia local del estado
  const saveFormDataToStorage = useCallback((data: any) => {
    try {
      // Solo guardar si hay datos significativos (nombre o SKU)
      if (data.name?.trim() || data.sku?.trim()) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.warn('No se pudo guardar el estado del formulario:', error);
    }
  }, [STORAGE_KEY]);

  const loadFormDataFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedData = JSON.parse(saved);
        // Validar que la data guardada sea válida
        if (parsedData && typeof parsedData === 'object') {
          return parsedData;
        }
      }
    } catch (error) {
      console.warn('No se pudo cargar el estado del formulario:', error);
    }
    return null;
  }, [STORAGE_KEY]);

  const clearFormDataFromStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('No se pudo limpiar el estado del formulario:', error);
    }
  }, [STORAGE_KEY]);

  // Función helper para calcular el precio final con IVA incluido
  // Estado para el precio final congelado
  const [frozenFinalPrice, setFrozenFinalPrice] = useState<number>(0);
  const [isPriceFrozen, setIsPriceFrozen] = useState<boolean>(false);

  const calculateFinalPrice = () => {
    if (!formData.salePrice || formData.salePrice <= 0) return 0;
    const vatRate = formData.vat || 19; // IVA por defecto 19%
    return formData.salePrice * (1 + vatRate / 100);
  };

  // Función para congelar el precio final
  const freezeFinalPrice = () => {
    const finalPrice = calculateFinalPrice();
    setFrozenFinalPrice(finalPrice);
    setIsPriceFrozen(true);
    console.log('🔒 Precio final congelado:', finalPrice);
  };

  // Función para descongelar el precio
  const unfreezePrice = () => {
    setIsPriceFrozen(false);
    setFrozenFinalPrice(0);
    console.log('🔓 Precio descongelado');
  };

  // Convertir initialData a formato del formulario si existe
  const getInitialFormData = () => {
    // Debug: Ver qué datos llegan del servidor
    console.log('🔍 DEBUG - initialData recibido:', initialData);
    console.log('🔍 DEBUG - unit en initialData:', initialData?.unit);
    console.log('🔍 DEBUG - salePrice en initialData:', initialData?.salePrice);
    console.log('🔍 DEBUG - vat en initialData:', initialData?.vat);
    console.log('🔍 DEBUG - finalPrice en initialData:', initialData?.finalPrice);
    console.log('🔍 DEBUG - isForSale en initialData:', initialData?.isForSale);
    // 🔍 NUEVOS LOGS PARA UNIDADES
    console.log('🔍 DEBUG - salesUnitId en initialData:', initialData?.salesUnitId);
    console.log('🔍 DEBUG - purchaseUnitId en initialData:', initialData?.purchaseUnitId);

    // Procesar stock con valores por defecto más robustos
    const stockData = initialData?.stock || {};
    const processedStock = {
      min: stockData.min ?? 0,
      max: stockData.max ?? 0,
      current: stockData.current ?? 0,
      warehouseid: stockData.warehouseid ?? undefined
    };

    // 🔍 LOGS PARA DEBUGGING UNIDADES
    console.log('🔍 DEBUG - getInitialFormData: salesUnitId desde initialData:', initialData?.salesUnitId);
    console.log('🔍 DEBUG - getInitialFormData: purchaseUnitId desde initialData:', initialData?.purchaseUnitId);
    
    const formData = {
      type: initialData?.type || ProductType.ALMACENABLE,
      name: initialData?.name || '',
      sku: initialData?.sku || '',
      barcode: initialData?.barcode || '',
      description: initialData?.description || '',
      brand: initialData?.brand || '',
      image: initialData?.image || '',
      costPrice: initialData?.costPrice || 0,
      salePrice: initialData?.salePrice || 0,
      vat: initialData?.vat || 19,
      finalPrice: initialData?.finalPrice || null,
      categoryId: initialData?.categoryId || undefined,
      supplierId: initialData?.supplierId || undefined,
      supplierCode: initialData?.supplierCode || '',
      unit: initialData?.unit || 'Pieza',
      salesUnitId: initialData?.salesUnitId || 1, // Unidad de venta - por defecto 1 (Unidad)
      purchaseUnitId: initialData?.purchaseUnitId || 1, // Unidad de compra - por defecto 1 (Unidad)
      isPOSEnabled: initialData?.isPOSEnabled || false,
      isForSale: initialData?.isForSale !== false, // Por defecto true
      posCategoryId: initialData?.posCategoryId || undefined,
      stock: processedStock,
      components: initialData?.components || [],
      // Campos específicos para equipos/máquinas (INVENTARIO)
      isEquipment: initialData?.isEquipment || false,
      model: initialData?.model || '',
      serialNumber: initialData?.serialNumber || '',
      purchaseDate: initialData?.purchaseDate || '',
      warrantyExpiration: initialData?.warrantyExpiration || '',
      usefulLife: initialData?.usefulLife || 0,
      maintenanceInterval: initialData?.maintenanceInterval || 0,
      lastMaintenance: initialData?.lastMaintenance || '',
      nextMaintenance: initialData?.nextMaintenance || '',
      maintenanceCost: initialData?.maintenanceCost || 0,
      maintenanceProvider: initialData?.maintenanceProvider || '',
      currentLocation: initialData?.currentLocation || '',
      responsiblePerson: initialData?.responsiblePerson || '',
      operationalStatus: initialData?.operationalStatus || 'OPERATIVO',
    };
    
    // 🔍 LOGS FINALES PARA DEBUGGING UNIDADES
    console.log('🔍 DEBUG - getInitialFormData: formData final salesUnitId:', formData.salesUnitId);
    console.log('🔍 DEBUG - getInitialFormData: formData final purchaseUnitId:', formData.purchaseUnitId);
    
    return formData;
  };

  const [formData, setFormData] = useState<ProductFormData>(getInitialFormData());

  // 🔄 FIJO: Sincronizar formData cuando initialData tenga salesUnitId/purchaseUnitId
  useEffect(() => {
    if (initialData && isEdit && (initialData.salesUnitId || initialData.purchaseUnitId)) {
      console.log('🔄 SINCRONIZACIÓN FORZADA: initialData cambió con unidades');
      console.log('🔄 SINCRONIZACIÓN: salesUnitId:', initialData.salesUnitId, 'purchaseUnitId:', initialData.purchaseUnitId);
      
      const updatedFormData = getInitialFormData();
      console.log('🔄 SINCRONIZACIÓN: Nuevo formData.salesUnitId:', updatedFormData.salesUnitId, 'purchaseUnitId:', updatedFormData.purchaseUnitId);
      setFormData(updatedFormData);
    }
  }, [initialData, isEdit]); // Simplificar dependencias

  // Restaurar datos guardados una sola vez al montar el componente
  useEffect(() => {
    if (!isEdit && !hasRestoredRef.current) {
      const savedData = loadFormDataFromStorage();
      if (savedData) {
        console.log('🔄 Restaurando datos del formulario desde localStorage');
        setFormData(savedData);
        setHasRestoredData(true);
        hasRestoredRef.current = true;
      }
    }
  }, [isEdit, loadFormDataFromStorage]); // Solo depende de isEdit y loadFormDataFromStorage

  // Inicializar precio congelado para productos existentes
  useEffect(() => {
    if (isEdit && initialData?.finalPrice) {
      // Si el producto ya tiene precio final congelado, usarlo
      setFrozenFinalPrice(initialData.finalPrice);
      setIsPriceFrozen(true);
      console.log('🔒 Precio congelado cargado desde BD:', initialData.finalPrice);
    } else if (isEdit && initialData?.salePrice && initialData?.vat) {
      // Si no tiene precio congelado pero tiene precio neto, calcular
      const finalPrice = Math.round(initialData.salePrice * (1 + initialData.vat / 100));
      setFrozenFinalPrice(finalPrice);
      setIsPriceFrozen(false); // No congelado por defecto
      console.log('🔓 Precio calculado (no congelado):', finalPrice);
    }
  }, [isEdit, initialData]);

  // Guardar automáticamente el estado cuando cambie (solo para creación)
  useEffect(() => {
    // No auto-guardar inmediatamente después de restaurar datos
    if (!isEdit && !hasRestoredData && formData && (formData.name?.trim() || formData.sku?.trim())) {
      setAutoSaving(true);
      const timeoutId = setTimeout(() => {
        saveFormDataToStorage(formData);
        setAutoSaving(false);
      }, 1000); // Debounce de 1 segundo

      return () => {
        clearTimeout(timeoutId);
        setAutoSaving(false);
      };
    }
  }, [formData, isEdit, hasRestoredData, saveFormDataToStorage]); // Incluir todas las dependencias necesarias

  // Resetear el flag de datos restaurados después de un pequeño delay
  useEffect(() => {
    if (hasRestoredData) {
      const timeoutId = setTimeout(() => {
        setHasRestoredData(false);
      }, 2000); // Esperar 2 segundos antes de reactivar el auto-guardado

      return () => clearTimeout(timeoutId);
    }
  }, [hasRestoredData]);

  // Advertir antes de salir con cambios sin guardar
  useEffect(() => {
    const hasUnsavedChanges = !isEdit && (formData.name?.trim() || formData.sku?.trim());
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !loading) {
        e.preventDefault();
        e.returnValue = '¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData.name, formData.sku, isEdit, loading]);

  // Utilidades para mostrar campos según tipo
  const isConsumible = formData.type === ProductType.CONSUMIBLE;
  const isAlmacenable = formData.type === ProductType.ALMACENABLE;
  const isInventario = formData.type === ProductType.INVENTARIO;
  const isServicio = formData.type === ProductType.SERVICIO;
  const isCombo = formData.type === ProductType.COMBO;

  // Campos comunes
  const showName = true;
  const showSku = true;
  const showDescription = true;
  const showImage = !isInventario || isInventario;
  const showCategory = true;
  const showSalePrice = formData.isForSale; // 🆕 NUEVO: Depende del selector "¿Es para venta?"
  const showVat = isConsumible || isAlmacenable || isInventario || isServicio || isCombo;

  // Solo Consumible, Almacenable, Inventario y Servicio
  const showSupplier = isConsumible || isAlmacenable || isInventario || isServicio;
  const showBarcode = isConsumible || isAlmacenable || isInventario;
  const showCostPrice = isConsumible || isAlmacenable || isInventario;
  const showStock = isConsumible || isAlmacenable || isInventario;

  // Campos específicos
  const showBrand = isConsumible || isAlmacenable || isInventario;
  
  // Campos adicionales según tipo
  const showSalesUnit = isConsumible || isAlmacenable || isServicio;
  const showPurchaseUnit = isConsumible || isAlmacenable;
  const showUsage = isConsumible || isAlmacenable || isInventario;
  const showState = true;
  const showStorage = isConsumible || isAlmacenable || isInventario;
  const showInvoicePolicy = isConsumible || isAlmacenable || isServicio || isCombo;
  const showSaleLineWarning = isConsumible || isAlmacenable || isServicio || isCombo;
  
  // Campos específicos para equipos/máquinas (INVENTARIO)
  const showEquipmentSection = isInventario;
  const showEquipmentFields = isInventario && formData.isEquipment;

  // Definir pestañas con iconos
  const tabs = [
    { id: 'basica', label: '📋 Básica', icon: FileText },
    { id: 'precios', label: '💰 Precios', icon: DollarSign },
    { id: 'proveedor', label: '🏢 Proveedor', icon: Truck },
    { id: 'stock', label: '📦 Stock', icon: Package },
    { id: 'pos', label: '🏪 Punto de Venta', icon: Settings },
    { id: 'propiedades', label: '⚙️ Propiedades', icon: Settings },
    ...(showEquipmentSection ? [{ id: 'equipos', label: '🔧 Equipos', icon: Wrench }] : []),
    ...(isCombo ? [{ id: 'componentes', label: '🧩 Componentes', icon: Layers }] : [])
  ];

  const handleInputChange = (field: string, value: any) => {
    console.log(`🔍 DEBUG - handleInputChange: ${field} =`, value);
    
    // Si se cambia la unidad de venta, actualizar también la unidad de compra si no se ha seleccionado una específica
    if (field === 'salesUnitId') {
      setFormData(prev => {
        const newData = {
          ...prev,
          [field]: value
        };
        
        // Si purchaseUnitId no se ha cambiado específicamente (es el valor por defecto), actualizarlo también
        if (prev.purchaseUnitId === 1 || prev.purchaseUnitId === undefined) {
          newData.purchaseUnitId = value;
          console.log('🔍 DEBUG - Actualizando purchaseUnitId automáticamente a:', value);
        }
        
        return newData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Manejar cambios en componentes del combo
  const handleComponentsChange = (components: any[]) => {
    handleInputChange('components', components);
  };

  // Manejar cambios en precio sugerido
  const handleSuggestedPriceChange = (price: number) => {
    setSuggestedPrice(price);
  };

  // Función para generar SKU manualmente
  const generateSKU = async () => {
    if (!formData.name.trim() || isEdit) return;
    
    setIsGeneratingSKU(true);
    try {
      const generatedSKU = await generateIntelligentSKU({
        name: formData.name,
        brand: formData.brand,
        categoryId: formData.categoryId,
        type: formData.type
      });
      handleInputChange('sku', generatedSKU);
    } catch (error) {
      console.error('Error generando SKU:', error);
    } finally {
      setIsGeneratingSKU(false);
    }
  };

  // Función para manejar cambios de imagen
  const handleImageChange = (imageUrl: string | null, imagePath: string | null) => {
    handleInputChange('image', imageUrl || '');
    setImagePath(imagePath);
  };

  // 1. Agregar estado para controlar si el usuario está editando el precio final
  type EditSource = 'neto' | 'final';
  const [editSource, setEditSource] = useState<EditSource>('neto');
  const [finalPriceInput, setFinalPriceInput] = useState<number>(calculateFinalPrice());

  // 2. Sincronizar ambos campos
  type PriceChangeType = 'neto' | 'final';
  const handlePriceChange = (value: number, type: PriceChangeType) => {
    const intValue = Math.floor(value); // Solo parte entera
    
    // Si el precio está congelado, no permitir cambios
    if (isPriceFrozen) {
      console.log('🔒 Precio congelado, no se puede modificar');
      return;
    }
    
    if (type === 'neto') {
      setEditSource('neto');
      handleInputChange('salePrice', intValue);
      setFinalPriceInput(intValue * (1 + (formData.vat || 19) / 100));
    } else {
      setEditSource('final');
      setFinalPriceInput(intValue);
      // Calcular neto inverso usando Math.round para precisión exacta
      const neto = Math.round(intValue / (1 + (formData.vat || 19) / 100));
      handleInputChange('salePrice', neto);
    }
  };

  // 3. Sincronizar cuando cambia el neto o el IVA
  type VatChangeType = 'vat' | 'salePrice';
  const handleVatOrNetoChange = (value: number, type: VatChangeType) => {
    if (type === 'vat') {
      handleInputChange('vat', value);
      if (editSource === 'neto') {
        setFinalPriceInput((formData.salePrice || 0) * (1 + value / 100));
      } else {
        // Si el usuario editó el final, recalcular neto usando Math.round para precisión exacta
        const neto = Math.round(finalPriceInput / (1 + value / 100));
        handleInputChange('salePrice', neto);
      }
    } else {
      handleInputChange('salePrice', value);
      setFinalPriceInput(value * (1 + (formData.vat || 19) / 100));
    }
  };

  // 4. Botón Redondear
  const [showRedondeoMsg, setShowRedondeoMsg] = useState(false);
  type RedondeoType = 'mil' | 'unidad';
  const handleRedondear = (tipo: RedondeoType = 'mil') => {
    let rounded = finalPriceInput;
    if (tipo === 'mil') {
      rounded = Math.round(finalPriceInput / 1000) * 1000;
    } else {
      rounded = Math.round(finalPriceInput);
    }
    setFinalPriceInput(rounded);
    // Calcular neto inverso usando Math.round para precisión exacta
    const neto = Math.round(rounded / (1 + (formData.vat || 19) / 100));
    handleInputChange('salePrice', neto);
    setShowRedondeoMsg(true);
    setTimeout(() => setShowRedondeoMsg(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // --- Usar copia local del formData con el neto correcto ---
    let neto = formData.salePrice;
    
    // Si el precio está congelado, usar el precio final congelado
    if (isPriceFrozen && frozenFinalPrice > 0) {
      // Calcular el neto basado en el precio final congelado
      neto = Math.round(frozenFinalPrice / (1 + (formData.vat || 19) / 100));
      console.log('🔒 Usando precio congelado:', frozenFinalPrice, 'Neto calculado:', neto);
    } else if (editSource === 'final') {
      // Usar Math.round para precisión exacta en el cálculo inverso
      neto = Math.round(finalPriceInput / (1 + (formData.vat || 19) / 100));
    }
    const formDataToSend = { 
      ...formData, 
      salePrice: neto,
      // Agregar precio final congelado si está congelado
      finalPrice: isPriceFrozen ? frozenFinalPrice : undefined,
      // Excluir el stock actual - solo se puede modificar por ajuste de inventario
      stock: formData.stock ? {
        ...formData.stock,
        current: undefined // NO enviar el stock actual al servidor
      } : undefined,
      // Corregir nombres de campos para que coincidan con la base de datos
      salesunitid: formData.salesUnitId,
      purchaseunitid: formData.purchaseUnitId
    };
    console.log('🔍 DEBUG - Neto a guardar:', neto, 'Final con IVA:', finalPriceInput);
    console.log('🔍 DEBUG - FormData a enviar:', {
      stock: formDataToSend.stock,
      name: formDataToSend.name,
      type: formDataToSend.type
    });

    try {
      const formDataObj = new FormData();
      Object.entries(formDataToSend).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          // Omitir valores null/undefined
          return;
        }
        
        if (Array.isArray(value)) {
          formDataObj.append(key, JSON.stringify(value));
        } else if (typeof value === 'object') {
          // CORRIGIDO: Usar JSON.stringify para objetos
          formDataObj.append(key, JSON.stringify(value));
          console.log(`🔍 DEBUG - Serializado ${key}:`, JSON.stringify(value));
        } else {
          formDataObj.append(key, value.toString());
        }
      });
      
      // Agregar el ID del producto si es edición
      if (isEdit && initialData?.id) {
        formDataObj.append('id', initialData.id.toString());
      }
      
      // Log para debugging
      console.log('🔍 DEBUG - FormData final keys:', Array.from(formDataObj.keys()));
      console.log('🔍 DEBUG - Stock en FormData:', formDataObj.get('stock'));
      console.log('🔍 DEBUG - Unit en FormData:', formDataObj.get('unit'));
      // 🔍 NUEVOS LOGS PARA UNIDADES
      console.log('🔍 DEBUG - salesUnitId en FormData:', formDataObj.get('salesUnitId'));
      console.log('🔍 DEBUG - purchaseUnitId en FormData:', formDataObj.get('purchaseUnitId'));
      console.log('🔍 DEBUG - salesunitid en FormData:', formDataObj.get('salesunitid'));
      console.log('🔍 DEBUG - purchaseunitid en FormData:', formDataObj.get('purchaseunitid'));
      
      let result;
      if (isEdit) {
        result = await updateProduct(formDataObj);
      } else {
        result = await createProduct(formDataObj);
      }
      if (result.success) {
        // Limpiar datos guardados al guardar exitosamente
        clearFormDataFromStorage();
        
        // Mostrar notificación de éxito
        toast({
          title: "¡Producto creado exitosamente!",
          description: result.message || `El producto "${formData.name}" ha sido creado correctamente.`,
          variant: "success"
        });
        
        router.push('/dashboard/configuration/products');
      } else {
        // Mejorar el mensaje de error según el tipo de problema
        let errorMessage = result.error || 'Error desconocido al guardar el producto';
        
        // Validaciones adicionales del lado del cliente
        if (errorMessage.includes('nombre') && errorMessage.includes('obligatorio')) {
          errorMessage = '❌ El nombre del producto es obligatorio. Por favor, completa este campo.';
        } else if (errorMessage.includes('SKU') && errorMessage.includes('obligatorio')) {
          errorMessage = '❌ El SKU es obligatorio. Presiona el botón "Generar SKU" para crear uno automáticamente.';
        } else if (errorMessage.includes('precio') && errorMessage.includes('obligatorio')) {
          errorMessage = '❌ El precio de venta es obligatorio para este tipo de producto. Ingresa un precio mayor a cero.';
        } else if (errorMessage.includes('tipo') && errorMessage.includes('obligatorio')) {
          errorMessage = '❌ Debes seleccionar un tipo de producto. Elige entre: Almacenable, Consumible, Servicio, Inventario o Combo.';
        } else if (formData.type === ProductType.COMBO && errorMessage.includes('component')) {
          errorMessage = '❌ Los productos tipo COMBO requieren al menos un componente. Agrega productos en la sección de componentes.';
        } else if (formData.type === ProductType.COMBO && (!formData.salePrice || formData.salePrice <= 0)) {
          errorMessage = '❌ Los productos tipo COMBO requieren un precio de venta. Ingresa un precio mayor a cero.';
        } else if (errorMessage.includes('categoría') && errorMessage.includes('válida')) {
          errorMessage = '❌ La categoría seleccionada no es válida. Por favor, selecciona una categoría de la lista.';
        } else if (errorMessage.includes('proveedor') && errorMessage.includes('válido')) {
          errorMessage = '❌ El proveedor seleccionado no es válido. Por favor, selecciona un proveedor de la lista.';
        } else if (errorMessage.includes('SKU') && errorMessage.includes('existe')) {
          errorMessage = '❌ Ya existe un producto con este SKU. Presiona "Generar SKU" para crear uno nuevo.';
        } else if (errorMessage.includes('nombre') && errorMessage.includes('existe')) {
          errorMessage = '❌ Ya existe un producto con este nombre. Por favor, usa un nombre diferente.';
        } else if (errorMessage.includes('permisos')) {
          errorMessage = '🚫 No tienes permisos para crear productos. Contacta al administrador del sistema.';
        } else if (errorMessage.includes('interno')) {
          errorMessage = '⚠️ Error interno del sistema. Contacta al administrador técnico con los detalles del error.';
        }
        
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      setError('❌ Error inesperado al guardar el producto. Verifica tu conexión a internet y vuelve a intentarlo.');
    } finally {
      setLoading(false);
    }
  };

  // Validación básica
  const isBasicFormValid = formData.name && formData.sku;

  // 🎯 NUEVO: Valores reactivos para los selectores de unidades
  const currentSalesUnitId = useMemo(() => {
    // 🔧 FIJO: Usar formData primero, initialData solo como fallback
    const value = formData.salesUnitId !== undefined ? formData.salesUnitId : (isEdit ? initialData?.salesUnitId : undefined);
    console.log('🎯 REACTIVO salesUnitId:', value, 'de:', formData.salesUnitId !== undefined ? 'formData' : 'initialData');
    return value;
  }, [isEdit, initialData?.salesUnitId, formData.salesUnitId]);

  const currentPurchaseUnitId = useMemo(() => {
    // 🔧 FIJO: Usar formData primero, initialData solo como fallback
    const value = formData.purchaseUnitId !== undefined ? formData.purchaseUnitId : (isEdit ? initialData?.purchaseUnitId : undefined);
    console.log('🎯 REACTIVO purchaseUnitId:', value, 'de:', formData.purchaseUnitId !== undefined ? 'formData' : 'initialData');
    return value;
  }, [isEdit, initialData?.purchaseUnitId, formData.purchaseUnitId]);

  // 🎯 NUEVO: Valor reactivo para la unidad básica (usa salesUnitId como fallback)
  const currentBasicUnitId = useMemo(() => {
    // 🔧 FIJO: Usar formData primero, initialData solo como fallback
    const value = formData.salesUnitId !== undefined ? formData.salesUnitId : (isEdit ? initialData?.salesUnitId : undefined);
    console.log('🎯 REACTIVO basicUnitId:', value, 'de:', formData.salesUnitId !== undefined ? 'formData' : 'initialData');
    return value;
  }, [isEdit, initialData?.salesUnitId, formData.salesUnitId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Título grande para edición */}
        {isEdit && (
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-blue-900 leading-tight mb-2">
              Editar Producto
            </h1>
            <h2 className="text-2xl font-bold text-blue-700">
              Modifica la información del producto: <span className="text-blue-800">{formData.name || initialData?.name || ''}</span>
            </h2>
          </div>
        )}
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <Package className="text-blue-600" size={28} />
                {isEdit ? 'Editar Producto' : 'Crear Nuevo Producto'}
              </h1>
              <p className="text-slate-600 mt-1">Utiliza las pestañas para navegar entre las diferentes secciones del formulario</p>
            </div>
            <div className="flex gap-3">
              {!isEdit && (
                <button 
                  type="button"
                  onClick={() => {
                    saveFormDataToStorage(formData);
                    toast({
                      title: "Borrador guardado",
                      description: "Tu progreso ha sido guardado. Puedes continuar más tarde.",
                      variant: "default"
                    });
                  }}
                  disabled={loading}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200 disabled:opacity-50"
                >
                  <Save size={16} />
                  Guardar borrador
                </button>
              )}
              <button 
                type="submit"
                form="product-form"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200 disabled:opacity-50"
              >
                <Save size={18} />
                {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Guardar Producto')}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-max px-6 py-4 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <tab.icon size={18} />
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        
        {/* Form Content */}
        <form id="product-form" onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            {/* Mensajes de Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-red-800">Error al crear el producto</h3>
                    <div className="mt-2 text-sm text-red-700">
                      {error}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="inline-flex text-red-400 hover:text-red-600 focus:outline-none focus:text-red-600 transition-colors duration-200"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Indicadores de Estado */}
            {!isEdit && (hasRestoredData || autoSaving) && (
              <div className="mb-6 space-y-2">
                {hasRestoredData && (
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="text-sm text-blue-700 font-medium">
                        📋 Se han restaurado datos guardados anteriormente
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          clearFormDataFromStorage();
                          setHasRestoredData(false);
                          window.location.reload();
                        }}
                        className="ml-4 text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Empezar desde cero
                      </button>
                    </div>
                  </div>
                )}
                {autoSaving && (
                  <div className="p-2 bg-green-50 border-l-4 border-green-400 rounded-lg">
                    <div className="flex items-center">
                      <svg className="animate-spin h-4 w-4 text-green-400 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-xs text-green-700">
                        💾 Guardando cambios automáticamente...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'basica' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="text-blue-600" size={24} />
                  <h2 className="text-xl font-semibold text-slate-800">Información Básica del Producto</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tipo de Producto */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tipo de Producto
                    </label>
                    <TipoProductoSelector
                      value={formData.type}
                      onChange={(type) => handleInputChange('type', type)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      {formData.type === ProductType.INVENTARIO && "✨ Productos tipo inventario incluyen gestión de equipos y mantenimiento"}
                      {formData.type === ProductType.ALMACENABLE && "🏪 Producto con stock para venta"}
                      {formData.type === ProductType.CONSUMIBLE && "📦 Producto que se agota con el uso"}
                      {formData.type === ProductType.SERVICIO && "⚡ Servicio ofrecido al cliente"}
                      {formData.type === ProductType.COMBO && "🎁 Paquete de múltiples productos"}
                    </p>
                  </div>

                  {/* Nombre del Producto */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ej: Cuchara de té premium"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        formData.name.trim() === '' ? 'border-red-300 bg-red-50' : 'border-slate-300'
                      }`}
                      required
                    />
                    {formData.name.trim() === '' && (
                      <p className="mt-1 text-xs text-red-600">El nombre es obligatorio</p>
                    )}
                  </div>

                  {/* SKU */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      SKU <span className="text-blue-600">(Generado automáticamente)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => handleInputChange('sku', e.target.value)}
                        placeholder="PROD-123456"
                        className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          formData.sku.trim() === '' ? 'border-red-300 bg-red-50' : 'border-slate-300'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={generateSKU}
                        disabled={isGeneratingSKU || !formData.name.trim() || isEdit}
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
                      >
                        <RefreshCw size={18} className={isGeneratingSKU ? 'animate-spin' : ''} />
                      </button>
                    </div>
                    {formData.sku.trim() === '' && (
                      <p className="mt-1 text-xs text-red-600">El SKU es obligatorio. Presiona "Generar SKU" para crear uno automáticamente.</p>
                    )}
                  </div>

                  {/* Marca */}
                  {showBrand && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Marca
                      </label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                        placeholder="Ej: Wolfen"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  )}

                  {/* Unidad de Medida */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Unidad de Medida
                    </label>
                    <UnitMeasureSelector
                      value={currentBasicUnitId}
                      onChange={(unitId) => {
                        handleInputChange('salesUnitId', unitId);
                        // También actualizar el campo unit con el nombre de la unidad
                        if (unitId) {
                          const units = getAllUnits();
                          const selectedUnit = units.find((u: any) => u.id === unitId);
                          if (selectedUnit) {
                            console.log('🔍 DEBUG - Actualizando unit:', selectedUnit.name, 'para unitId:', unitId);
                            handleInputChange('unit', selectedUnit.name);
                          }
                        }
                      }}
                      placeholder="Seleccionar unidad de medida"
                      label=""
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                    <p className="text-xs text-slate-500 mt-1">Selecciona la unidad de medida para cálculos automáticos (ej: Docena = 12 unidades)</p>
                  </div>

                  {/* Categoría */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Categoría
                    </label>
                    <CategorySelector
                      value={formData.categoryId}
                      onChange={(categoryId) => handleInputChange('categoryId', categoryId)}
                      placeholder="Seleccionar categoría"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  {/* Descripción */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe las características principales del producto..."
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    />
                  </div>

                  {/* Upload de Imagen */}
                  {showImage && (
                    <div className="lg:col-span-2">
                      <ProductImageUploader
                        currentImageUrl={formData.image}
                        productId={initialData?.id}
                        onImageChange={handleImageChange}
                        disabled={loading}
                        size="md"
                      />
                    </div>
                  )}
                </div>

                {/* Form Status */}
                <div className="mt-8 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isBasicFormValid ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-sm text-slate-700">
                      {isBasicFormValid 
                        ? '✅ Información básica completa' 
                        : '⚠️ Completa los campos obligatorios (Nombre, SKU)'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'precios' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <DollarSign className="text-blue-600" size={24} />
                  <h2 className="text-xl font-semibold text-slate-800">Información de Precios</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Selector ¿Es para venta? */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      ¿Es para venta? *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="isForSale"
                          value="true"
                          checked={formData.isForSale === true}
                          onChange={(e) => handleInputChange('isForSale', e.target.value === 'true')}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Sí, es para venta al público</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="isForSale"
                          value="false"
                          checked={formData.isForSale === false}
                          onChange={(e) => handleInputChange('isForSale', e.target.value === 'true')}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">No, es para consumo interno/materia prima</span>
                      </label>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {formData.isForSale 
                        ? "Este producto se venderá a clientes y requiere precio de venta" 
                        : "Este producto es para uso interno y no requiere precio de venta"}
                    </p>
                  </div>
                  {/* Precio de Costo */}
                  {showCostPrice && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Precio de Costo
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.costPrice || ''}
                          onChange={(e) => handleInputChange('costPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="0.00"
                          className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Precio de compra al proveedor</p>
                    </div>
                  )}

                  {/* Precio de Venta Neto */}
                  {showSalePrice && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Precio de Venta Neto *
                      </label>
                      <div className="relative flex items-center gap-2">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={formData.salePrice || ''}
                          onChange={e => handlePriceChange(Number(e.target.value), 'neto')}
                          placeholder="0"
                          className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Valor Neto (sin IVA)</p>
                    </div>
                  )}

                  {/* IVA */}
                  {showVat && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        IVA (%)
                      </label>
                      <div className="relative flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={formData.vat || 19}
                          onChange={e => handleVatOrNetoChange(Number(e.target.value), 'vat')}
                          placeholder="19"
                          className="w-full pr-8 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">%</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Porcentaje de impuesto al valor agregado</p>
                    </div>
                  )}

                  {/* Precio Final con IVA */}
                  {showSalePrice && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-green-800">
                          💰 Precio Final con IVA Incluido
                        </label>
                        <div className="flex items-center gap-2">
                          {isPriceFrozen ? (
                            <button
                              type="button"
                              onClick={unfreezePrice}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded border border-orange-200 hover:bg-orange-200 transition-colors"
                              title="Descongelar precio"
                            >
                              🔓 Descongelar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={freezeFinalPrice}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded border border-blue-200 hover:bg-blue-200 transition-colors"
                              title="Congelar precio final"
                            >
                              🔒 Congelar
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="relative flex items-center gap-2">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 font-medium">$</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={isPriceFrozen ? frozenFinalPrice : (finalPriceInput || '')}
                          onChange={e => handlePriceChange(Number(e.target.value), 'final')}
                          disabled={isPriceFrozen}
                          className={`w-full pl-8 pr-4 py-3 border border-green-300 rounded-lg text-green-800 font-semibold text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                            isPriceFrozen ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                          }`}
                        />
                      </div>
                      <p className="text-xs text-green-700 mt-1 font-medium">
                        {isPriceFrozen ? (
                          <span className="text-orange-700">
                            🔒 Precio congelado en ${frozenFinalPrice?.toLocaleString()}. Este será el precio definitivo del producto.
                          </span>
                        ) : (
                          <>
                            Puedes editar el precio final y el sistema ajustará el neto automáticamente. 
                            <span className="text-blue-700 font-medium"> Haz clic en "Congelar" para establecer el precio definitivo.</span> 
                            ({formData.vat || 19}% IVA incluido)
                          </>
                        )}
                      </p>
                    </div>
                  )}



                  {/* Código de Barras */}
                  {showBarcode && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Código de Barras
                      </label>
                      <input
                        type="text"
                        value={formData.barcode || ''}
                        onChange={(e) => handleInputChange('barcode', e.target.value)}
                        placeholder="1234567890123"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      <p className="text-xs text-slate-500 mt-1">Código EAN, UPC u otro formato</p>
                    </div>
                  )}

                  {/* Cálculo de Margen */}
                  {showCostPrice && showSalePrice && formData.costPrice && formData.salePrice && (
                    <div className="lg:col-span-2 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Análisis de Margen</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Margen Bruto:</span>
                          <div className="font-semibold text-green-600">
                            ${((formData.salePrice - formData.costPrice) || 0).toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-600">Margen %:</span>
                          <div className="font-semibold text-green-600">
                            {formData.costPrice > 0 ? (((formData.salePrice - formData.costPrice) / formData.costPrice) * 100).toFixed(1) : 0}%
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-600">Precio con IVA:</span>
                          <div className="font-semibold text-blue-600">
                            ${((formData.salePrice || 0) * (1 + (formData.vat || 19) / 100)).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'proveedor' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Truck className="text-blue-600" size={24} />
                  <h2 className="text-xl font-semibold text-slate-800">Información del Proveedor</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Proveedor */}
                  {showSupplier && (
                    <div>
                      <SupplierSearchSelector
                        value={formData.supplierId}
                        onValueChange={(supplierId) => handleInputChange('supplierId', supplierId)}
                        placeholder="Buscar proveedor por nombre, email, ciudad..."
                        label="Proveedor"
                        showCreateOption={true}
                        onCreateNew={() => {
                          // Abrir nueva pestaña para crear proveedor
                          window.open('/dashboard/suppliers/create', '_blank');
                        }}
                      />
                      <p className="text-xs text-slate-500 mt-1">Proveedor principal del producto</p>
                    </div>
                  )}

                  {/* Código del Proveedor */}
                  {showSupplier && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Código del Proveedor
                      </label>
                      <input
                        type="text"
                        value={formData.supplierCode || ''}
                        onChange={(e) => handleInputChange('supplierCode', e.target.value)}
                        placeholder="Ej: FUM-001, SERV-PLAGAS-MENSUAL"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      <p className="text-xs text-slate-500 mt-1">Código que el proveedor usa para identificar este producto/servicio</p>
                    </div>
                  )}

                  {/* Unidad de Compra */}
                  {showPurchaseUnit && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Unidad de Compra
                      </label>
                      {/* 🔍 LOG SIMPLE: Mostramos en consola el valor que se pasa */}
                      {(() => {
                        console.log('🔍 PROPS → UnitMeasureSelector COMPRA: value=', currentPurchaseUnitId);
                        return null;
                      })()}
                      <UnitMeasureSelector
                        value={currentPurchaseUnitId}
                        onChange={(unitId) => {
                          handleInputChange('purchaseUnitId', unitId);
                          // También actualizar el campo unit con el nombre de la unidad
                          if (unitId) {
                            const units = getAllUnits();
                            const selectedUnit = units.find((u: any) => u.id === unitId);
                            if (selectedUnit) {
                              handleInputChange('unit', selectedUnit.name);
                            }
                          }
                        }}
                        placeholder="Seleccionar unidad"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      <p className="text-xs text-slate-500 mt-1">Unidad en que se compra al proveedor</p>
                    </div>
                  )}

                  {/* Unidad de Venta */}
                  {showSalesUnit && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Unidad de Venta
                      </label>
                      {/* 🔍 LOG SIMPLE: Mostramos en consola el valor que se pasa */}
                      {(() => {
                        console.log('🔍 PROPS → UnitMeasureSelector VENTA: value=', currentSalesUnitId);
                        return null;
                      })()}
                      <UnitMeasureSelector
                        value={currentSalesUnitId}
                        onChange={(unitId) => handleInputChange('salesUnitId', unitId)}
                        placeholder="Seleccionar unidad"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      <p className="text-xs text-slate-500 mt-1">Unidad en que se vende al cliente</p>
                    </div>
                  )}
                </div>

                {!showSupplier && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-yellow-800">
                        Los productos tipo {formData.type.toLowerCase()} no requieren información de proveedor
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stock' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Package className="text-blue-600" size={24} />
                  <h2 className="text-xl font-semibold text-slate-800">Gestión de Stock</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Stock Mínimo */}
                  {showStock && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Stock Mínimo
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stock?.min || 0}
                        onChange={(e) => handleInputChange('stock', {
                          ...formData.stock,
                          min: parseInt(e.target.value) || 0
                        })}
                        placeholder="0"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      <p className="text-xs text-slate-500 mt-1">Cantidad mínima antes de alerta</p>
                    </div>
                  )}

                  {/* Stock Máximo */}
                  {showStock && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Stock Máximo
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stock?.max || 0}
                        onChange={(e) => handleInputChange('stock', {
                          ...formData.stock,
                          max: parseInt(e.target.value) || 0
                        })}
                        placeholder="0"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      <p className="text-xs text-slate-500 mt-1">Cantidad máxima recomendada</p>
                    </div>
                  )}

                  {/* Stock Actual */}
                  {showStock && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Stock Actual
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stock?.current || 0}
                        onChange={(e) => handleInputChange('stock', {
                          ...formData.stock,
                          current: parseInt(e.target.value) || 0
                        })}
                        placeholder="0"
                        disabled={true}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-red-600 mt-1 font-medium">
                        🔒 El stock no se puede modificar desde este formulario. 
                        <br />
                        Utiliza el sistema de <strong>Ajuste de Inventario</strong> para modificar las cantidades.
                      </p>
                    </div>
                  )}

                  {/* Bodega */}
                  {showStock && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Bodega Principal
                      </label>
                      <BodegaSelector
                        value={formData.stock?.warehouseid}
                        onChange={(warehouseId) => handleInputChange('stock', {
                          ...formData.stock,
                          warehouseid: warehouseId
                        })}
                        placeholder="Seleccionar bodega"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      <p className="text-xs text-slate-500 mt-1">Ubicación principal del stock</p>
                    </div>
                  )}

                  {/* Estado del Stock */}
                  {showStock && formData.stock && (
                    <div className="lg:col-span-2 p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-medium text-slate-800 mb-2">Estado del Stock</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Disponible:</span>
                          <div className={`font-semibold ${formData.stock.current > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formData.stock.current} unidades
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-600">Estado:</span>
                          <div className={`font-semibold ${
                            formData.stock.current <= formData.stock.min ? 'text-red-600' :
                            formData.stock.current >= formData.stock.max ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {formData.stock.current <= formData.stock.min ? 'Stock Bajo' :
                             formData.stock.current >= formData.stock.max ? 'Stock Alto' : 'Normal'}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-600">Rango:</span>
                          <div className="font-semibold text-slate-600">
                            {formData.stock.min} - {formData.stock.max}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {!showStock && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-yellow-800">
                        Los productos tipo {formData.type.toLowerCase()} no requieren gestión de stock
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pos' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Settings className="text-blue-600" size={24} />
                  <h2 className="text-xl font-semibold text-slate-800">Configuración del Punto de Venta</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Habilitado para POS */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                      <input
                        type="checkbox"
                        id="isPOSEnabled"
                        checked={formData.isPOSEnabled || false}
                        onChange={(e) => handleInputChange('isPOSEnabled', e.target.checked)}
                        className="w-5 h-5 text-green-600 border-slate-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor="isPOSEnabled" className="text-sm font-medium text-slate-700">
                        ✅ Habilitado para venta en punto de venta (POS)
                      </label>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Permite vender este producto en el sistema POS del restaurante y recepción</p>
                  </div>

                  {/* Categoría POS - Solo aparece si está habilitado para POS */}
                  {formData.isPOSEnabled && (
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        🏷️ Categoría del Punto de Venta
                      </label>
                      <POSCategoryDoubleSelector
                        value={{
                          restaurante: formData.posCategories?.find(x => x.cashRegisterTypeId === 2)?.posCategoryId || '',
                          recepcion: formData.posCategories?.find(x => x.cashRegisterTypeId === 1)?.posCategoryId || ''
                        }}
                        onChange={val => {
                          const arr = [];
                          if (val.restaurante) arr.push({ posCategoryId: val.restaurante, cashRegisterTypeId: 2 });
                          if (val.recepcion) arr.push({ posCategoryId: val.recepcion, cashRegisterTypeId: 1 });
                          handleInputChange('posCategories', arr);
                        }}
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Selecciona la categoría para cada punto de venta donde debe aparecer este producto.
                      </p>
                    </div>
                  )}

                  {/* Información adicional cuando NO está habilitado */}
                  {!formData.isPOSEnabled && (
                    <div className="lg:col-span-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-yellow-800 font-medium">
                          ℹ️ Este producto no está habilitado para POS
                        </span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-2">
                        Para vender este producto en el punto de venta, activa la casilla de verificación superior y selecciona una categoría POS.
                      </p>
                    </div>
                  )}

                  {/* Vista previa de cómo aparecerá en el POS */}
                  {formData.isPOSEnabled && (
                    <div className="lg:col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-3">🖥️ Vista Previa del POS</h4>
                      <div className="bg-white rounded-lg p-4 border shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-semibold text-slate-800">{formData.name || 'Nombre del Producto'}</h5>
                            <p className="text-sm text-slate-600">{formData.description || 'Sin descripción'}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              ${((formData.salePrice || 0) * (1 + (formData.vat || 19) / 100)).toLocaleString('es-CL')}
                            </div>
                            <div className="text-xs text-slate-500">IVA incluido</div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        💡 Así es como se verá este producto en la interfaz del punto de venta
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'propiedades' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Settings className="text-blue-600" size={24} />
                  <h2 className="text-xl font-semibold text-slate-800">Propiedades del Producto</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Estado del Producto */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Estado del Producto
                    </label>
                    <ProductStateSelector
                      value={formData.stateid}
                      onChange={(stateId) => handleInputChange('stateid', stateId)}
                      placeholder="Seleccionar estado"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                    <p className="text-xs text-slate-500 mt-1">Estado actual del producto</p>
                  </div>

                  {/* Uso del Producto */}
                  {showUsage && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Uso del Producto
                      </label>
                      <ProductUsageSelector
                        value={formData.usageid}
                        onChange={(usageId) => handleInputChange('usageid', usageId)}
                        placeholder="Seleccionar uso"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      <p className="text-xs text-slate-500 mt-1">Tipo de uso del producto</p>
                    </div>
                  )}

                  {/* Almacenamiento */}
                  {showStorage && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Tipo de Almacenamiento
                      </label>
                      <StorageSelector
                        value={formData.storageid}
                        onChange={(storageId) => handleInputChange('storageid', storageId)}
                        placeholder="Seleccionar almacenamiento"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      <p className="text-xs text-slate-500 mt-1">Condiciones de almacenamiento requeridas</p>
                    </div>
                  )}

                  {/* Política de Facturación */}
                  {showInvoicePolicy && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Política de Facturación
                      </label>
                      <InvoicePolicySelector
                        value={formData.invoicepolicyid}
                        onChange={(policyId) => handleInputChange('invoicepolicyid', policyId)}
                        placeholder="Seleccionar política"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      <p className="text-xs text-slate-500 mt-1">Política de facturación aplicable</p>
                    </div>
                  )}

                  {/* Advertencia de Línea de Venta */}
                  {showSaleLineWarning && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Advertencia de Línea de Venta
                      </label>
                      <SaleLineWarningSelector
                        value={formData.salelinewarnid}
                        onChange={(warningId) => handleInputChange('salelinewarnid', warningId)}
                        placeholder="Seleccionar advertencia"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      <p className="text-xs text-slate-500 mt-1">Advertencias al vender este producto</p>
                    </div>
                  )}


                </div>
              </div>
            )}

            {activeTab === 'equipos' && showEquipmentSection && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Wrench className="text-blue-600" size={24} />
                  <h2 className="text-xl font-semibold text-slate-800">Información de Equipos</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Es Equipo */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <input
                        type="checkbox"
                        id="isEquipment"
                        checked={formData.isEquipment || false}
                        onChange={(e) => handleInputChange('isEquipment', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="isEquipment" className="text-sm font-medium text-slate-700">
                        Este producto es un equipo o máquina
                      </label>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Activa esta opción para habilitar campos específicos de equipos</p>
                  </div>

                  {formData.isEquipment && (
                    <>
                      {/* Modelo */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Modelo
                        </label>
                        <input
                          type="text"
                          value={formData.model || ''}
                          onChange={(e) => handleInputChange('model', e.target.value)}
                          placeholder="Ej: XPS-2000"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      {/* Número de Serie */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Número de Serie
                        </label>
                        <input
                          type="text"
                          value={formData.serialNumber || ''}
                          onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                          placeholder="SN123456789"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      {/* Fecha de Compra */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Fecha de Compra
                        </label>
                        <input
                          type="date"
                          value={formData.purchaseDate || ''}
                          onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      {/* Vencimiento de Garantía */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Vencimiento de Garantía
                        </label>
                        <input
                          type="date"
                          value={formData.warrantyExpiration || ''}
                          onChange={(e) => handleInputChange('warrantyExpiration', e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      {/* Vida Útil (años) */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Vida Útil (años)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.usefulLife || ''}
                          onChange={(e) => handleInputChange('usefulLife', e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="5"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      {/* Intervalo de Mantenimiento (días) */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Intervalo de Mantenimiento (días)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.maintenanceInterval || ''}
                          onChange={(e) => handleInputChange('maintenanceInterval', e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="90"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      {/* Último Mantenimiento */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Último Mantenimiento
                        </label>
                        <input
                          type="date"
                          value={formData.lastMaintenance || ''}
                          onChange={(e) => handleInputChange('lastMaintenance', e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      {/* Próximo Mantenimiento */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Próximo Mantenimiento
                        </label>
                        <input
                          type="date"
                          value={formData.nextMaintenance || ''}
                          onChange={(e) => handleInputChange('nextMaintenance', e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      {/* Costo de Mantenimiento */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Costo de Mantenimiento
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.maintenanceCost || ''}
                            onChange={(e) => handleInputChange('maintenanceCost', e.target.value ? parseFloat(e.target.value) : undefined)}
                            placeholder="0.00"
                            className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Proveedor de Mantenimiento */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Proveedor de Mantenimiento
                        </label>
                        <input
                          type="text"
                          value={formData.maintenanceProvider || ''}
                          onChange={(e) => handleInputChange('maintenanceProvider', e.target.value)}
                          placeholder="Empresa de mantenimiento"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      {/* Ubicación Actual */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Ubicación Actual
                        </label>
                        <input
                          type="text"
                          value={formData.currentLocation || ''}
                          onChange={(e) => handleInputChange('currentLocation', e.target.value)}
                          placeholder="Sala de máquinas"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      {/* Persona Responsable */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Persona Responsable
                        </label>
                        <input
                          type="text"
                          value={formData.responsiblePerson || ''}
                          onChange={(e) => handleInputChange('responsiblePerson', e.target.value)}
                          placeholder="Juan Pérez"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      {/* Estado Operacional */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Estado Operacional
                        </label>
                        <select
                          value={formData.operationalStatus || 'OPERATIVO'}
                          onChange={(e) => handleInputChange('operationalStatus', e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="OPERATIVO">Operativo</option>
                          <option value="MANTENIMIENTO">En Mantenimiento</option>
                          <option value="FUERA_SERVICIO">Fuera de Servicio</option>
                          <option value="REPARACION">En Reparación</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                {!formData.isEquipment && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-blue-800">
                        Activa la opción "Es equipo" para configurar información específica de equipos y mantenimiento
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'componentes' && isCombo && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Layers className="text-purple-600" size={24} />
                  <h2 className="text-xl font-semibold text-slate-800">Componentes del Combo</h2>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <ComboComponentsManager
                    components={formData.components || []}
                    onComponentsChange={handleComponentsChange}
                    onSuggestedPriceChange={handleSuggestedPriceChange}
                  />
                  
                  {/* Mostrar precio sugerido si hay componentes */}
                  {suggestedPrice > 0 && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="text-purple-600" size={20} />
                          <span className="font-medium text-purple-800">Precio Sugerido:</span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-purple-600">
                            ${suggestedPrice.toLocaleString('es-CL')}
                          </p>
                          <button
                            type="button"
                            onClick={() => handlePriceChange(suggestedPrice, 'final')}
                            className="text-sm text-purple-600 hover:text-purple-800 underline"
                          >
                            Aplicar precio sugerido
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Información sobre componentes */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p><strong>Funcionalidad:</strong> Los componentes definen qué productos incluye este combo.</p>
                        <p><strong>Precio Sugerido:</strong> Se calcula automáticamente con un margen del 20% sobre el costo total de componentes.</p>
                        <p><strong>Gestión de Stock:</strong> Al vender el combo, se descuenta automáticamente el stock de cada componente.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-slate-500">
            * Campos obligatorios
          </div>
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              form="product-form"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? 'Guardando...' : 'Guardar y Continuar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 