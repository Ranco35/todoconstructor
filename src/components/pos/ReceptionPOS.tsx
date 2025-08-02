'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  Banknote,
  Users,
  Bed,
  DollarSign,
  Calculator,
  Wifi,
  WifiOff,
  Home,
  Settings,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Search,
  User,
  UserPlus,
  X
} from 'lucide-react'
import { 
  getCashRegisterTypes,
  getCurrentPOSSession,
  createPOSSession,
  getPOSProductsByType,
  getPOSProductCategories,
  createPOSSale,
  getPOSSessionStats,
  diagnosePOSIssues,
  syncPOSProducts,
  fixMenuDiaIssue,
  createSampleMenuDiaProducts,
  fixProgramaCategoryIssue,
  type POSProduct
} from '@/actions/pos/pos-actions'
import { createPOSSaleWithMultiplePayments } from '@/actions/pos/multiple-payments-actions'
import MultiplePaymentModal from './MultiplePaymentModal'
import { searchClients, getClientByRut, createClient, getClient } from '@/actions/clients'
import { Client, ClientType, ClientStatus, type CreateClientFormData } from '@/types/client'
import { formatCurrency } from '@/utils/currency'
import Link from 'next/link'
import ClientSelectorWithCreate from './ClientSelectorWithCreate'
import ProductSearch from './ProductSearch'
import SearchResultsIndicator from './SearchResultsIndicator'
import NoProductsMessage from './NoProductsMessage'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  category: string
  discountType?: 'none' | 'percentage' | 'fixed_amount'
  discountValue?: number
  discountAmount?: number
  notes?: string
}

interface SessionStats {
  totalSales: number
  totalAmount: number
  cashSales: number
  cardSales: number
  transferSales: number
  cashAmount: number
}

export default function ReceptionPOS() {
  // Estados principales
  const [session, setSession] = useState<any>(null)
  const [products, setProducts] = useState<POSProduct[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(true)
  const [stats, setStats] = useState<SessionStats | null>(null)

  // Estados del modal de pago
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash')
  const [customerName, setCustomerName] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [cashReceived, setCashReceived] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Estados para pagos múltiples
  const [showMultiplePaymentModal, setShowMultiplePaymentModal] = useState(false)

  // Estados para descuentos (eliminados - ahora se manejan por producto)

  // Estados para búsqueda de clientes
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [clientRut, setClientRut] = useState('')

  // Función para manejar selección de cliente desde el nuevo componente
  const handleClientSelection = async (clientId: number | undefined, clientName?: string) => {
    if (clientId) {
      try {
        console.log('🔍 ReceptionPOS: Seleccionando cliente ID:', clientId);
        
        // Buscar el cliente por ID y establecerlo
        const foundClient = searchResults.find(c => c.id === clientId);
        if (foundClient) {
          console.log('✅ ReceptionPOS: Cliente encontrado en searchResults:', foundClient);
          setSelectedClient(foundClient);
          setCustomerName(clientName || '');
        } else {
          console.log('🔍 ReceptionPOS: Cliente no en searchResults, buscando por ID...');
          // Si no está en los resultados de búsqueda, hacer consulta directa por ID
          const result = await getClient(clientId);
          if (result.success && result.data) {
            console.log('✅ ReceptionPOS: Cliente obtenido por ID:', result.data);
            setSelectedClient(result.data);
            setCustomerName(clientName || '');
          } else {
            console.log('❌ ReceptionPOS: Error obteniendo cliente:', result.error);
          }
        }
      } catch (error) {
        console.error('❌ ReceptionPOS: Error obteniendo cliente:', error);
      }
    } else {
      console.log('🔄 ReceptionPOS: Limpiando selección de cliente');
      setSelectedClient(null);
      setCustomerName('');
    }
  }

  // Estados para crear cliente
  const [showCreateClientModal, setShowCreateClientModal] = useState(false)
  const [isCreatingClient, setIsCreatingClient] = useState(false)
  const [newClientData, setNewClientData] = useState<Partial<CreateClientFormData>>({
    tipoCliente: ClientType.PERSONA,
    nombrePrincipal: '',
    apellido: '',
    rut: '',
    email: '',
    telefono: '',
    ciudad: '',
    region: ''
  })

  // Estados del modal de sesión
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [initialAmount, setInitialAmount] = useState<number>(0)
  
  // Estados para notificaciones de diagnóstico
  const [diagnosticMessages, setDiagnosticMessages] = useState<string[]>([])
  const [showDiagnosticAlert, setShowDiagnosticAlert] = useState(false)

  const REGISTER_TYPE_ID = 1 // Recepción

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  // Búsqueda de clientes por término
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (clientSearchTerm.length >= 2) {
        setIsSearching(true)
        try {
          const result = await searchClients(clientSearchTerm)
          if (result.success) {
            // Filtrar solo clientes activos
            const validClients = (result.data || []).filter((c: any): c is Client =>
              c && typeof c.id === 'number' &&
              typeof c.nombrePrincipal === 'string' &&
              c.estado === ClientStatus.ACTIVO
            )
            setSearchResults(validClients)
          } else {
            setSearchResults([])
          }
        } catch (error) {
          console.error('Error buscando clientes:', error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(searchTimer)
  }, [clientSearchTerm])

  // Función para obtener totales finales (sin descuentos globales, solo por producto)
  const getCartTotals = () => {
    // Calcular subtotal bruto con IVA antes de descuentos
    const subtotalBeforeDiscount = cart.reduce((sum, item) => {
      return sum + (item.price * item.quantity)
    }, 0)
    
    // Calcular descuentos totales usando los descuentos ya calculados por producto
    const totalDiscounts = cart.reduce((sum, item) => {
      return sum + (item.discountAmount || 0)
    }, 0)
    
    // Calcular subtotal después de descuentos
    const subtotalAfterDiscount = subtotalBeforeDiscount - totalDiscounts
    
    // CORREGIDO: Los precios YA incluyen IVA, calcular correctamente
    // Si el precio mostrado es $18.000 con IVA incluido, entonces:
    // - Precio neto = $18.000 / 1.19 = $15.126
    // - IVA = $18.000 - $15.126 = $2.874
    const subtotalNeto = Math.round(subtotalBeforeDiscount / 1.19)
    const discountNeto = Math.round(totalDiscounts / 1.19)
    const subtotalNetoAfterDiscount = subtotalNeto - discountNeto
    const taxAmount = subtotalBeforeDiscount - subtotalNeto - (totalDiscounts - discountNeto)
    
    // Total final - usar el mismo cálculo que getItemFinalPrice para consistencia
    const total = cart.reduce((sum, item) => {
      return sum + getItemFinalPrice(item)
    }, 0)
    
    return {
      subtotal: subtotalNeto, // Subtotal neto antes de descuentos
      discountAmount: discountNeto, // Descuento neto
      subtotalAfterDiscount: subtotalNetoAfterDiscount, // Subtotal neto después de descuentos
      taxAmount,
      total
    }
  }

  const loadInitialData = async () => {
    setIsLoading(true)
    try {
      // Cargar sesión actual
      const sessionResult = await getCurrentPOSSession(REGISTER_TYPE_ID)
      if (sessionResult.success && sessionResult.data) {
        setSession(sessionResult.data)
        loadSessionStats(sessionResult.data.id)
      }

      // Cargar productos y categorías
      await loadProductsAndCategories()

    } catch (error) {
      console.error('Error loading initial data:', error)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  const loadProductsAndCategories = async () => {
    try {
      const messages: string[] = []
      
      // Ejecutar diagnóstico primero
      console.log('🔍 Ejecutando diagnóstico POS...')
      messages.push('🔍 Ejecutando diagnóstico del sistema POS...')
      
      const diagnosticResult = await diagnosePOSIssues(REGISTER_TYPE_ID)
      if (diagnosticResult.success) {
        console.log('📊 Diagnóstico completado:', diagnosticResult.data)
        messages.push(`📊 Diagnóstico completado: ${diagnosticResult.data?.totalCategories || 0} categorías, ${diagnosticResult.data?.activeCategories || 0} activas`)
        
        // Si hay productos habilitados para POS pero no sincronizados, intentar sincronización
        if (diagnosticResult.data?.enabledProducts > 0) {
          console.log('🔄 Intentando sincronización automática de productos POS...')
          messages.push('🔄 Sincronizando productos POS...')
          
          const syncResult = await syncPOSProducts()
          if (syncResult.success) {
            console.log('✅ Sincronización exitosa:', syncResult.data)
            messages.push(`✅ Sincronización exitosa: ${syncResult.data?.message || 'Productos sincronizados'}`)
          } else {
            console.error('❌ Error en sincronización:', syncResult.error)
            messages.push(`❌ Error en sincronización: ${syncResult.error}`)
          }
        }
        
        // Corregir problema específico de "Menu Dia"
        console.log('🔧 Verificando y corrigiendo problema de "Menu Dia"...')
        messages.push('🔧 Verificando categoría "Menu Dia"...')
        
        const fixMenuDiaResult = await fixMenuDiaIssue()
        if (fixMenuDiaResult.success) {
          console.log('✅ Problema de Menu Dia corregido:', fixMenuDiaResult.data)
          messages.push(`✅ ${fixMenuDiaResult.data?.message || 'Categoría Menu Dia corregida'}`)
          
          // Crear productos de prueba para Menu Dia si no existen
          console.log('🍽️ Creando productos de prueba para Menu Dia si es necesario...')
          messages.push('🍽️ Verificando productos de Menu Dia...')
          
          const sampleProductsResult = await createSampleMenuDiaProducts()
          if (sampleProductsResult.success) {
            console.log('✅ Productos de prueba Menu Dia:', sampleProductsResult.data)
            messages.push(`✅ ${sampleProductsResult.data?.message || 'Productos de Menu Dia verificados'}`)
          } else {
            console.error('❌ Error creando productos de prueba Menu Dia:', sampleProductsResult.error)
            messages.push(`❌ Error con productos Menu Dia: ${sampleProductsResult.error}`)
          }
          
          // Corregir categorización de productos con "Programa"
          console.log('🔧 Corrigiendo categorización de productos con "Programa"...')
          messages.push('🔧 Verificando productos de Programas...')
          
          const programaCategoryResult = await fixProgramaCategoryIssue()
          if (programaCategoryResult.success) {
            console.log('✅ Corrección de categoría Programas:', programaCategoryResult.data)
            messages.push(`✅ ${programaCategoryResult.data?.message || 'Productos de Programas verificados'}`)
          } else {
            console.error('❌ Error corrigiendo categoría Programas:', programaCategoryResult.error)
            messages.push(`❌ Error con productos Programas: ${programaCategoryResult.error}`)
          }
        } else {
          console.error('❌ Error corrigiendo Menu Dia:', fixMenuDiaResult.error)
          messages.push(`❌ Error corrigiendo Menu Dia: ${fixMenuDiaResult.error}`)
        }
      } else {
        console.error('❌ Error en diagnóstico:', diagnosticResult.error)
        messages.push(`❌ Error en diagnóstico: ${diagnosticResult.error}`)
      }
      
      // Mostrar resultados del diagnóstico
      setDiagnosticMessages(messages)
      setShowDiagnosticAlert(true)
      
      // Ocultar alerta después de 10 segundos
      setTimeout(() => {
        setShowDiagnosticAlert(false)
      }, 10000)

      const [productsResult, categoriesResult] = await Promise.all([
        getPOSProductsByType(REGISTER_TYPE_ID),
        getPOSProductCategories(REGISTER_TYPE_ID)
      ])

      if (productsResult.success) {
        setProducts(productsResult.data || [])
        console.log('📦 Productos cargados en ReceptionPOS:', productsResult.data?.length || 0)
      } else {
        console.error('❌ Error cargando productos:', productsResult.error)
      }

      if (categoriesResult.success) {
        setCategories(categoriesResult.data || [])
        console.log('📋 Categorías cargadas en ReceptionPOS:', categoriesResult.data?.length || 0)
        console.log('📋 Categorías detalle:', categoriesResult.data?.map(c => ({ 
          id: c.id, 
          name: c.name, 
          displayName: c.displayName 
        })))
      } else {
        console.error('❌ Error cargando categorías:', categoriesResult.error)
      }
    } catch (error) {
      console.error('Error loading products and categories:', error)
    }
  }

  const loadSessionStats = async (sessionId: number) => {
    try {
      const statsResult = await getPOSSessionStats(sessionId)
      if (statsResult.success) {
        setStats(statsResult.data)
      }
    } catch (error) {
      console.error('Error loading session stats:', error)
    }
  }

  const handleCreateSession = async () => {
    setIsProcessing(true)
    try {
      const result = await createPOSSession(REGISTER_TYPE_ID, initialAmount)
      if (result.success) {
        setSession(result.data)
        setShowSessionModal(false)
        setInitialAmount(0)
        await loadSessionStats(result.data.id)
      } else {
        alert(result.error || 'Error creando sesión')
      }
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Error interno del servidor')
    } finally {
      setIsProcessing(false)
    }
  }

  const addToCart = (product: POSProduct) => {
    const existingItem = cart.find(item => item.id === product.id)
    // CORREGIDO: Usar precio directo sin agregar IVA adicional (ya incluye IVA)
    const finalPrice = Math.round(product.price) // Precio directo sin IVA adicional
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: finalPrice, // Guardar precio directo sin IVA adicional
        quantity: 1,
        category: product.category?.displayName || 'Sin categoría',
        discountType: 'none',
        discountValue: 0,
        discountAmount: 0
      }])
    }
  }

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id)
    } else {
      setCart(cart.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ))
    }
  }

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id))
  }

  const clearCart = () => {
    setCart([])
  }

  // Función para calcular el precio con descuento por producto
  const calculateItemDiscount = (item: CartItem): number => {
    const subtotal = item.price * item.quantity
    if (!item.discountType || item.discountType === 'none' || !item.discountValue) return 0
    
    if (item.discountType === 'percentage') {
      return Math.round(subtotal * (item.discountValue / 100))
    } else if (item.discountType === 'fixed_amount') {
      return Math.min(item.discountValue, subtotal)
    }
    return 0
  }

  // Función para obtener el precio final de un producto con descuento
  const getItemFinalPrice = (item: CartItem): number => {
    const subtotal = item.price * item.quantity
    const discount = calculateItemDiscount(item)
    return subtotal - discount
  }

  // Función para aplicar descuento a un producto específico
  const applyProductDiscount = (itemId: number, discountType: 'none' | 'percentage' | 'fixed_amount', discountValue: number) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const discountAmount = discountType === 'none' ? 0 : calculateItemDiscount({
          ...item,
          discountType,
          discountValue
        })
        return {
          ...item,
          discountType,
          discountValue: discountType === 'none' ? 0 : discountValue,
          discountAmount
        }
      }
      return item
    }))
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + getItemFinalPrice(item), 0)
  }

  const getFilteredProducts = () => {
    let filtered = products
    if (productSearchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
      )
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.category?.name === selectedCategory
      )
    }
    return filtered
  }

  const handleProcessPayment = async () => {
    if (cart.length === 0) return

    // Cliente es obligatorio - no permitir ventas sin cliente
    if (!selectedClient) {
      alert('⚠️ Debe seleccionar un cliente para procesar la venta')
      return
    }

    setIsProcessing(true)
    try {
      const { subtotal, discountAmount, subtotalAfterDiscount, taxAmount, total } = getCartTotals()
      const change = paymentMethod === 'cash' && cashReceived > total ? cashReceived - total : 0

      // Determinar el nombre del cliente de forma más robusta
      let finalCustomerName = 'Cliente sin nombre'
      if (selectedClient) {
        if (selectedClient.tipoCliente === 'EMPRESA') {
          finalCustomerName = selectedClient.razonSocial || selectedClient.nombrePrincipal || 'Empresa sin nombre'
        } else {
          const nombre = selectedClient.nombrePrincipal || ''
          const apellido = selectedClient.apellido || ''
          finalCustomerName = `${nombre} ${apellido}`.trim() || 'Cliente sin nombre'
        }
      }

      const saleData = {
        sessionId: session.id,
        customerName: finalCustomerName,
        clientId: selectedClient?.id || undefined,
        roomNumber: roomNumber || undefined,
        subtotal,
        discountAmount,
        discountReason: getDiscountReason(),
        taxAmount,
        total,
        paymentMethod,
        cashReceived: paymentMethod === 'cash' ? cashReceived : undefined,
        change: change > 0 ? change : undefined,
        notes: notes || undefined,
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.price * item.quantity
        }))
      }

      const result = await createPOSSale(saleData)
      
      if (result.success) {
        // Limpiar formulario
        clearCart()
        clearClientSelection()
        setRoomNumber('')
        setCashReceived(0)
        setNotes('')
        // Los descuentos se limpian automáticamente al limpiar el carrito
        setShowPaymentModal(false)
        
        // Recargar estadísticas
        await loadSessionStats(session.id)
        
        alert('Venta procesada exitosamente')
      } else {
        alert(result.error || 'Error procesando venta')
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      alert('Error interno del servidor')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMultiplePayment = async (payments: any[]) => {
    if (cart.length === 0) return

    // Cliente es obligatorio - no permitir ventas sin cliente
    if (!selectedClient) {
      alert('⚠️ Debe seleccionar un cliente para procesar la venta')
      return
    }

    setIsProcessing(true)
    try {
      const { subtotal, discountAmount, subtotalAfterDiscount, taxAmount, total } = getCartTotals()

      // Determinar el nombre del cliente de forma más robusta
      let finalCustomerName = 'Cliente sin nombre'
      if (selectedClient) {
        if (selectedClient.tipoCliente === 'EMPRESA') {
          finalCustomerName = selectedClient.razonSocial || selectedClient.nombrePrincipal || 'Empresa sin nombre'
        } else {
          const nombre = selectedClient.nombrePrincipal || ''
          const apellido = selectedClient.apellido || ''
          finalCustomerName = `${nombre} ${apellido}`.trim() || 'Cliente sin nombre'
        }
      }

      const saleData = {
        sessionId: session.id,
        customerName: finalCustomerName,
        clientId: selectedClient?.id || undefined,
        roomNumber: roomNumber || undefined,
        subtotal,
        discountAmount,
        discountReason: getDiscountReason(),
        taxAmount,
        total,
        notes: notes || undefined,
        payments: payments.map(payment => ({
          paymentMethod: payment.paymentMethod,
          amount: payment.amount,
          receivedAmount: payment.receivedAmount,
          changeAmount: payment.changeAmount,
          cardReference: payment.cardReference,
          bankReference: payment.bankReference,
          cardLast4: payment.cardLast4,
          notes: payment.notes
        })),
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.price * item.quantity
        }))
      }

      const result = await createPOSSaleWithMultiplePayments(saleData)
      
      if (result.success) {
        // Limpiar formulario
        clearCart()
        clearClientSelection()
        setRoomNumber('')
        setCashReceived(0)
        setNotes('')
        // Los descuentos se limpian automáticamente al limpiar el carrito
        setShowMultiplePaymentModal(false)
        
        // Recargar estadísticas
        await loadSessionStats(session.id)
        
        alert('Venta procesada exitosamente con múltiples pagos')
      } else {
        alert(result.error || 'Error procesando venta')
      }
    } catch (error) {
      console.error('Error processing multiple payment:', error)
      alert('Error interno del servidor')
    } finally {
      setIsProcessing(false)
    }
  }

  // Manejo de selección de cliente
  const handleSelectClient = (client: Client) => {
    setSelectedClient(client)
    
    // Generar nombre del cliente de forma más robusta
    let clientName = ''
    if (client.tipoCliente === 'EMPRESA') {
      clientName = client.razonSocial || client.nombrePrincipal || 'Empresa sin nombre'
    } else {
      const nombre = client.nombrePrincipal || ''
      const apellido = client.apellido || ''
      clientName = `${nombre} ${apellido}`.trim() || 'Cliente sin nombre'
    }
    
    setCustomerName(clientName)
    setSearchResults([])
    setClientSearchTerm('')
  }

  // Búsqueda por RUT
  const handleSearchByRut = async () => {
    if (!clientRut.trim()) return
    
    setIsSearching(true)
    try {
      const result = await getClientByRut(clientRut)
      if (result.success && result.data) {
        handleSelectClient(result.data)
      } else {
        setSearchResults([])
        // Opcionalmente mostrar mensaje de "cliente no encontrado"
      }
    } catch (error) {
      console.error('Error buscando cliente por RUT:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Limpiar selección de cliente
  const clearClientSelection = () => {
    setSelectedClient(null)
    setCustomerName('')
    setClientSearchTerm('')
    setClientRut('')
    setSearchResults([])
  }

  // Función para crear nuevo cliente
  const handleCreateClient = async () => {
    if (!newClientData.nombrePrincipal || !newClientData.rut) {
      alert('Por favor, complete al menos el nombre y RUT del cliente')
      return
    }

    setIsCreatingClient(true)
    try {
      const clientData: CreateClientFormData = {
        tipoCliente: newClientData.tipoCliente || ClientType.PERSONA,
        nombrePrincipal: newClientData.nombrePrincipal,
        apellido: newClientData.apellido || '',
        rut: newClientData.rut,
        email: newClientData.email || '',
        telefono: newClientData.telefono || '',
        calle: '',
        ciudad: newClientData.ciudad || '',
        region: newClientData.region || '',
        estado: ClientStatus.ACTIVO,
        esClienteFrecuente: false,
        fechaCreacion: new Date(),
        fechaModificacion: new Date(),
        idioma: 'es',
        totalCompras: 0,
        rankingCliente: 0,
        recibirNewsletter: false,
        aceptaMarketing: false
      }

      const result = await createClient(clientData)
      
      if (result.success && result.data) {
        // Crear objeto Client con los datos devueltos
        const newClient: Client = {
          id: result.data.id || 0,
          tipoCliente: result.data.tipoCliente as ClientType,
          nombrePrincipal: result.data.nombrePrincipal,
          apellido: result.data.apellido,
          rut: result.data.rut,
          email: result.data.email,
          telefono: result.data.telefono,
          telefonoMovil: result.data.telefonoMovil,
          estado: result.data.estado === 'activo' ? ClientStatus.ACTIVO : ClientStatus.INACTIVO,
          fechaCreacion: new Date(result.data.fechaCreacion || Date.now()),
          fechaModificacion: new Date(result.data.fechaModificacion || Date.now()),
          calle: result.data.calle,
          calle2: result.data.calle2,
          ciudad: result.data.ciudad,
          codigoPostal: result.data.codigoPostal,
          region: result.data.region,
          paisId: result.data.paisId,
          sitioWeb: result.data.sitioWeb,
          idioma: result.data.idioma || 'es',
          zonaHoraria: result.data.zonaHoraria,
          imagen: result.data.imagen,
          comentarios: result.data.comentarios,
          razonSocial: result.data.razonSocial,
          giro: result.data.giro,
          numeroEmpleados: result.data.numeroEmpleados,
          facturacionAnual: result.data.facturacionAnual,
          sectorEconomicoId: result.data.sectorEconomicoId,
          fechaNacimiento: result.data.fechaNacimiento ? new Date(result.data.fechaNacimiento) : undefined,
          genero: result.data.genero,
          profesion: result.data.profesion,
          titulo: result.data.titulo,
          esClienteFrecuente: !!result.data.esClienteFrecuente,
          fechaUltimaCompra: result.data.fechaUltimaCompra ? new Date(result.data.fechaUltimaCompra) : undefined,
          totalCompras: result.data.totalCompras || 0,
          rankingCliente: result.data.rankingCliente || 0,
          origenCliente: result.data.origenCliente,
          recibirNewsletter: !!result.data.recibirNewsletter,
          aceptaMarketing: !!result.data.aceptaMarketing,
          pais: result.data.pais,
          sectorEconomico: result.data.sectorEconomico,
          contactos: result.data.contactos || [],
          etiquetas: result.data.etiquetas || []
        }

        // Seleccionar el cliente recién creado
        handleSelectClient(newClient)
        
        // Cerrar modal y limpiar formulario
        setShowCreateClientModal(false)
        resetCreateClientForm()
        
        alert('Cliente creado exitosamente')
      } else {
        alert(result.error || 'Error al crear el cliente')
      }
    } catch (error) {
      console.error('Error creando cliente:', error)
      alert('Error interno al crear el cliente')
    } finally {
      setIsCreatingClient(false)
    }
  }

  // Resetear formulario de crear cliente
  const resetCreateClientForm = () => {
    setNewClientData({
      tipoCliente: ClientType.PERSONA,
      nombrePrincipal: '',
      apellido: '',
      rut: '',
      email: '',
      telefono: '',
      ciudad: '',
      region: ''
    })
  }

  const quickCalculateChange = (amount: number) => {
    const { total } = getCartTotals() // Con IVA y descuentos aplicados
    setCashReceived(amount)
    return amount - total
  }

  // Función para generar razón de descuento automática basada en productos con descuento
  const getDiscountReason = (): string | undefined => {
    const discountedItems = cart.filter(item => item.discountType && item.discountType !== 'none');
    if (discountedItems.length === 0) return undefined;
    
    if (discountedItems.length === 1) {
      return `Descuento aplicado a ${discountedItems[0].name}`;
    } else {
      return `Descuentos aplicados a ${discountedItems.length} productos`;
    }
  };

  // Vista cuando no hay sesión activa
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Home className="h-6 w-6 text-purple-600" />
                POS Recepción - AdminTermas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No hay una sesión de caja activa. Debe iniciar una sesión para comenzar a vender.
                </AlertDescription>
              </Alert>
              
              <div className="text-center space-y-4">
                <Button 
                  onClick={() => setShowSessionModal(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  Iniciar Sesión de Caja
                </Button>
                
                <div className="flex justify-center space-x-4">
                  <Link href="/dashboard/pettyCash">
                    <Button variant="outline">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Caja Chica
                    </Button>
                  </Link>
                  <Link href="/dashboard/pos">
                    <Button variant="outline">
                      <Home className="h-4 w-4 mr-2" />
                      Seleccionar POS
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal de creación de sesión */}
        <Dialog open={showSessionModal} onOpenChange={setShowSessionModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Iniciar Sesión de Caja - Recepción</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="initialAmount">Monto inicial en caja</Label>
                <Input
                  id="initialAmount"
                  type="number"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSessionModal(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateSession}
                  disabled={isProcessing}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isProcessing ? 'Creando...' : 'Crear Sesión'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando POS Recepción...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Home className="h-5 w-5 text-purple-600" />
                POS Recepción
              </h1>
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Badge variant="outline" className="text-green-600">
                    <Wifi className="h-3 w-3 mr-1" />
                    Conectado
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Sin conexión
                  </Badge>
                )}
                <Badge className="bg-purple-100 text-purple-800">
                  Sesión #{session.sessionNumber || session.id}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link href="/dashboard/pettyCash">
                <Button variant="outline" size="sm">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Caja Chica
                </Button>
              </Link>
              <Link href="/dashboard/pos/sales">
                <Button variant="outline" size="sm">
                  <Receipt className="h-4 w-4 mr-2" />
                  Ver Ventas
                </Button>
              </Link>
              <Link href="/dashboard/pos">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Cambiar POS
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de diagnóstico */}
      {showDiagnosticAlert && diagnosticMessages.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mx-4 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Diagnóstico y Correcciones Automáticas
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="space-y-1">
                  {diagnosticMessages.map((message, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{message}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setShowDiagnosticAlert(false)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de productos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Estadísticas rápidas */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{stats.totalSales}</p>
                      <p className="text-sm text-gray-600">Ventas</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(stats.totalAmount)}
                      </p>
                      <p className="text-sm text-gray-600">Total</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.cashSales}</p>
                      <p className="text-sm text-gray-600">Efectivo</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{stats.cardSales}</p>
                      <p className="text-sm text-gray-600">Tarjeta</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Buscador de productos */}
            <ProductSearch
              searchTerm={productSearchTerm}
              onSearchChange={setProductSearchTerm}
              placeholder="Buscar productos..."
            />
            
            {/* Indicador de resultados */}
            <SearchResultsIndicator
              searchTerm={productSearchTerm}
              selectedCategory={selectedCategory}
              filteredCount={getFilteredProducts().length}
              totalCount={products.length}
              categories={categories}
              onClearSearch={() => setProductSearchTerm('')}
            />

            {/* Filtros de categorías */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                    className={selectedCategory === 'all' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  >
                    Todas las categorías
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.name ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category.name)}
                      className={selectedCategory === category.name ? 'bg-purple-600 hover:bg-purple-700' : ''}
                      style={{
                        backgroundColor: selectedCategory === category.name ? category.color : undefined,
                        borderColor: category.color
                      }}
                    >
                      {category.icon} {category.displayName}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Grid de productos */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {getFilteredProducts().map((product) => (
                <Card 
                  key={product.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <div 
                        className="w-16 h-16 mx-auto rounded-lg flex items-center justify-center bg-white overflow-hidden border" style={{ backgroundColor: product.category?.color + '20' }}
                      >
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="object-cover w-full h-full"
                            onError={(e) => { e.currentTarget.src = '/public/placeholder-product.png'; }}
                          />
                        ) : (
                          <span className="text-2xl">{product.category?.icon || '🏨'}</span>
                        )}
                      </div>
                                                <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                          <p className="text-lg font-bold text-purple-600">
                            {formatCurrency(Math.round(product.price))}
                          </p>
                          <p className="text-xs text-gray-500">
                            IVA incluido
                          </p>
                      <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                        <Plus className="h-3 w-3 mr-1" />
                        Agregar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {getFilteredProducts().length === 0 && (
              <NoProductsMessage
                searchTerm={productSearchTerm}
                selectedCategory={selectedCategory}
                onClearSearch={() => setProductSearchTerm('')}
              />
            )}
          </div>

          {/* Panel del carrito */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Carrito de Compra
                  {cart.length > 0 && (
                    <Badge className="ml-2">{cart.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Datos del cliente y habitación */}
                <div className="space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Cliente *
                      </Label>
                      <Badge variant="destructive" className="text-xs">
                        Obligatorio
                      </Badge>
                    </div>
                    <ClientSelectorWithCreate
                      value={selectedClient?.id}
                      onValueChange={handleClientSelection}
                      className="bg-white"
                      required={true}
                      showRequiredIndicator={true}
                      label=""
                    />
                    
                    {/* Mostrar información del cliente seleccionado */}
                    {selectedClient && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-green-900 text-sm">
                              {selectedClient.nombrePrincipal} {selectedClient.apellido}
                            </p>
                            <p className="text-xs text-green-700">
                              {selectedClient.rut}
                            </p>
                            <p className="text-xs text-green-600">
                              Cliente registrado - {selectedClient.tipoCliente}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={clearClientSelection}
                            className="text-green-600 hover:text-green-800"
                            title="Quitar cliente seleccionado"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Mensaje de advertencia cuando no hay cliente seleccionado */}
                    {!selectedClient && cart.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <p className="text-sm text-red-700">
                            ⚠️ Debe seleccionar un cliente para procesar la venta
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="roomNumber" className="text-xs font-medium text-gray-700 mb-1 block">
                      Número de habitación (opcional)
                    </Label>
                    <Input
                      id="roomNumber"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="Ej: 101, 205..."
                      className="bg-white text-sm"
                    />
                  </div>
                </div>

                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    El carrito está vacío
                  </p>
                ) : (
                  <>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.id} className="p-3 bg-gray-50 rounded-lg space-y-3">
                          {/* Línea superior: Info del producto y controles de cantidad */}
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <p className="text-xs text-gray-600">{item.category}</p>
                              <div className="flex items-center gap-2 mt-1">
                                                              <p className="text-sm font-bold text-purple-600">
                                {formatCurrency(item.price)}
                              </p>
                                <span className="text-xs text-gray-500">x {item.quantity}</span>
                                {item.discountType && item.discountType !== 'none' && (
                                  <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                                    -{item.discountType === 'percentage' ? `${item.discountValue}%` : formatCurrency(item.discountValue || 0)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="font-medium w-8 text-center">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeFromCart(item.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Sección de descuento por producto */}
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                            <div className="flex items-center gap-2 mb-2">
                              <Label className="text-xs font-medium">💸 Descuento:</Label>
                              <Select
                                value={item.discountType || 'none'}
                                onValueChange={(value: 'none' | 'percentage' | 'fixed_amount') => {
                                  applyProductDiscount(item.id, value, 0)
                                }}
                              >
                                <SelectTrigger className="h-6 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Sin descuento</SelectItem>
                                  <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                                  <SelectItem value="fixed_amount">Monto fijo ($)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {item.discountType && item.discountType !== 'none' && (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={item.discountValue || 0}
                                  onChange={(e) => applyProductDiscount(item.id, item.discountType!, Number(e.target.value))}
                                  placeholder={item.discountType === 'percentage' ? '10' : '1000'}
                                  min="0"
                                  max={item.discountType === 'percentage' ? '100' : (item.price * item.quantity).toString()}
                                  className="h-6 text-xs flex-1"
                                />
                                {calculateItemDiscount(item) > 0 && (
                                  <span className="text-green-600 font-medium">
                                    -{formatCurrency(calculateItemDiscount(item))}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Total del producto */}
                          <div className="flex justify-between items-center text-sm font-medium pt-2 border-t border-gray-200">
                            <span>Total producto:</span>
                            <span className="text-purple-600">
                              {formatCurrency(getItemFinalPrice(item))}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />
                    
                    {/* Totales */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal (neto):</span>
                        <span>{formatCurrency(getCartTotals().subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Descuentos aplicados:</span>
                        <span className="text-green-600">
                          -{formatCurrency(getCartTotals().discountAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Subtotal con descuentos:</span>
                        <span>{formatCurrency(getCartTotals().subtotalAfterDiscount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IVA (19%):</span>
                        <span>{formatCurrency(getCartTotals().taxAmount)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Final:</span>
                        <span className="text-purple-600">
                          {formatCurrency(getCartTotals().total)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Precios netos + IVA 19% - Descuentos por producto
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                        onClick={() => setShowMultiplePaymentModal(true)}
                        disabled={!selectedClient}
                        title={!selectedClient ? "Debe seleccionar un cliente" : ""}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Procesar Pago
                        {!selectedClient && " (Cliente requerido)"}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={clearCart}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpiar Carrito
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Acceso rápido a Caja Chica */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Caja Chica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard/pettyCash">
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Abrir Caja Chica
                  </Button>
                </Link>
                <p className="text-xs text-gray-600">
                  Accede a gastos, compras e ingresos de caja chica
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de pago */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-purple-600" />
              Procesar Pago
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna izquierda: Resumen e información */}
            <div className="space-y-4">
              {/* Resumen de venta */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Resumen de Venta
                </h3>
                <div className="space-y-2">
                  {(() => {
                    const { subtotal, discountAmount, subtotalAfterDiscount, taxAmount, total } = getCartTotals();
                    return (
                      <>
                        <div className="flex justify-between">
                          <span>Subtotal inicial:</span>
                          <span className="font-medium">{formatCurrency(subtotal)}</span>
                        </div>
                        {discountAmount > 0 && (
                          <>
                            <div className="flex justify-between text-green-600">
                              <span>Descuento aplicado:</span>
                              <span className="font-medium">-{formatCurrency(discountAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Subtotal con descuento:</span>
                              <span className="font-medium">{formatCurrency(subtotalAfterDiscount)}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between">
                          <span>IVA (19%):</span>
                          <span className="font-medium">{formatCurrency(taxAmount)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total a pagar:</span>
                          <span className="text-purple-600 text-xl">
                            {formatCurrency(total)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {discountAmount > 0 ? 'Precio final con descuento e IVA incluido' : 'Los precios mostrados incluyen IVA'}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Sección de descuentos */}
              {/* Los descuentos ahora se aplican individualmente por producto en el carrito */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-green-800">💡 Información</span>
                </div>
                <p className="text-xs text-green-700">
                  Los descuentos se aplican directamente a cada producto en el carrito antes de procesar el pago.
                  El total mostrado ya incluye todos los descuentos aplicados.
                </p>
              </div>

              {/* Método de pago */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Método de pago</Label>
                <Select value={paymentMethod} onValueChange={(value: 'cash' | 'card' | 'transfer') => setPaymentMethod(value)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        Efectivo
                      </div>
                    </SelectItem>
                    <SelectItem value="card">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Tarjeta
                      </div>
                    </SelectItem>
                    <SelectItem value="transfer">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Transferencia
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Columna derecha: Datos del cliente y otros campos */}
            <div className="space-y-4">



              {/* Efectivo recibido */}
              {paymentMethod === 'cash' && (
                <div>
                  <Label htmlFor="cashReceived" className="text-sm font-medium mb-2 block">
                    Efectivo recibido
                  </Label>
                  <Input
                    id="cashReceived"
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    placeholder="0"
                    className="h-11"
                  />
                  
                  {/* Calculadora rápida */}
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[10000, 20000, 50000].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => quickCalculateChange(amount)}
                        className="text-xs h-8"
                      >
                        {formatCurrency(amount)}
                      </Button>
                    ))}
                  </div>
                  
                  {cashReceived > 0 && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <p className="text-sm">
                        Vuelto: <span className="font-bold text-green-700">
                          {formatCurrency(Math.max(0, cashReceived - getCartTotals().total))}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Notas */}
              <div>
                <Label htmlFor="notes" className="text-sm font-medium mb-2 block">
                  Notas (opcional)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones adicionales..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowPaymentModal(false)}
              className="min-w-24"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleProcessPayment}
              disabled={isProcessing || (paymentMethod === 'cash' && cashReceived < getCartTotals().total)}
              className="bg-green-600 hover:bg-green-700 min-w-32"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4 mr-2" />
                  Confirmar Pago
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para crear cliente */}
      <Dialog open={showCreateClientModal} onOpenChange={setShowCreateClientModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Crear Nuevo Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Tipo de cliente */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Tipo de cliente</Label>
              <Select 
                value={newClientData.tipoCliente} 
                onValueChange={(value: ClientType) => setNewClientData(prev => ({ ...prev, tipoCliente: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ClientType.PERSONA}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Persona Natural
                    </div>
                  </SelectItem>
                  <SelectItem value={ClientType.EMPRESA}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Empresa
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Información básica */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="newClientName" className="text-sm font-medium mb-1 block">
                  Nombre *
                </Label>
                <Input
                  id="newClientName"
                  value={newClientData.nombrePrincipal}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, nombrePrincipal: e.target.value }))}
                  placeholder="Nombre"
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="newClientLastName" className="text-sm font-medium mb-1 block">
                  Apellido
                </Label>
                <Input
                  id="newClientLastName"
                  value={newClientData.apellido}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, apellido: e.target.value }))}
                  placeholder="Apellido"
                  className="text-sm"
                />
              </div>
            </div>

            {/* RUT */}
            <div>
              <Label htmlFor="newClientRut" className="text-sm font-medium mb-1 block">
                RUT *
              </Label>
              <Input
                id="newClientRut"
                value={newClientData.rut}
                onChange={(e) => setNewClientData(prev => ({ ...prev, rut: e.target.value }))}
                placeholder="12.345.678-9"
                className="text-sm"
              />
            </div>

            {/* Contacto */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="newClientEmail" className="text-sm font-medium mb-1 block">
                  Email
                </Label>
                <Input
                  id="newClientEmail"
                  type="email"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@ejemplo.com"
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="newClientPhone" className="text-sm font-medium mb-1 block">
                  Teléfono
                </Label>
                <Input
                  id="newClientPhone"
                  value={newClientData.telefono}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="+56 9 1234 5678"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Ubicación */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="newClientCity" className="text-sm font-medium mb-1 block">
                  Ciudad
                </Label>
                <Input
                  id="newClientCity"
                  value={newClientData.ciudad}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, ciudad: e.target.value }))}
                  placeholder="Santiago"
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="newClientRegion" className="text-sm font-medium mb-1 block">
                  Región
                </Label>
                <Input
                  id="newClientRegion"
                  value={newClientData.region}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, region: e.target.value }))}
                  placeholder="Metropolitana"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="text-xs text-gray-500">
              * Campos requeridos
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateClientModal(false)
                resetCreateClientForm()
              }}
              disabled={isCreatingClient}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateClient}
              disabled={isCreatingClient || !newClientData.nombrePrincipal || !newClientData.rut}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreatingClient ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Crear Cliente
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de pagos múltiples */}
      <MultiplePaymentModal
        isOpen={showMultiplePaymentModal}
        onClose={() => setShowMultiplePaymentModal(false)}
        onConfirm={handleMultiplePayment}
        saleTotal={getCartTotals().total}
        customerName={customerName}
        roomNumber={roomNumber}
        isProcessing={isProcessing}
      />
    </div>
  )
} 