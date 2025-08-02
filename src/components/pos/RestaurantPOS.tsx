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
  UtensilsCrossed,
  DollarSign,
  Calculator,
  Wifi,
  WifiOff,
  ChefHat,
  Settings,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  Table,
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
  getPOSTables,
  updateTableStatus,
  type POSProduct,
  type POSTable
} from '@/actions/pos/pos-actions'
import { getClient } from '@/actions/clients'
import { createPOSSaleWithMultiplePayments } from '@/actions/pos/multiple-payments-actions'
import { formatCurrency } from '@/utils/currency'
import Link from 'next/link'
import ClientSelector from '@/components/clients/ClientSelector'
import ClientSelectorWithCreate from './ClientSelectorWithCreate'
import MultiplePaymentModal from './MultiplePaymentModal'
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

export default function RestaurantPOS() {
  // Estados principales
  const [session, setSession] = useState<any>(null)
  const [products, setProducts] = useState<POSProduct[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [tables, setTables] = useState<POSTable[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [selectedTable, setSelectedTable] = useState<POSTable | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(true)
  const [stats, setStats] = useState<SessionStats | null>(null)

  // Estados del modal de pago (legacy)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash')
  const [cashReceived, setCashReceived] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Estados para pagos múltiples
  const [showMultiplePaymentModal, setShowMultiplePaymentModal] = useState(false)

  // Estados para descuentos (eliminados - ahora se manejan por producto)

  // Estados del modal de sesión
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [initialAmount, setInitialAmount] = useState<number>(0)

  // Estados de mesas
  const [showTableModal, setShowTableModal] = useState(false)
  const [viewMode, setViewMode] = useState<'products' | 'tables'>('tables')

  // Estado para cliente seleccionado
  const [customerId, setCustomerId] = useState<number | undefined>(undefined);
  const [customerName, setCustomerName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  const REGISTER_TYPE_ID = 2 // Restaurante

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  // Funciones de descuento eliminadas - ahora se manejan por producto

  // Función para obtener información del cliente seleccionado
  const handleClientSelection = async (clientId: number | undefined, clientName?: string) => {
    console.log('🔍 RestaurantPOS: Seleccionando cliente ID:', clientId);
    setCustomerId(clientId);
    if (clientId) {
      try {
        const result = await getClient(clientId);
        if (result.success && result.data) {
          console.log('✅ RestaurantPOS: Cliente obtenido:', result.data);
          const client = result.data;
          // Extraer el nombre según el tipo de cliente (igual que en ClientSelector)
          const name = client.tipoCliente === 'EMPRESA' 
            ? client.razonSocial || client.nombrePrincipal
            : `${client.nombrePrincipal} ${client.apellido || ''}`.trim();
          setCustomerName(name);
        } else {
          console.log('❌ RestaurantPOS: Error obteniendo cliente:', result.error);
        }
      } catch (error) {
        console.error('❌ RestaurantPOS: Error obteniendo información del cliente:', error);
      }
    } else {
      console.log('🔄 RestaurantPOS: Limpiando selección de cliente');
      setCustomerName('');
    }
  };

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

      // Cargar productos, categorías y mesas
      await Promise.all([
        loadProductsAndCategories(),
        loadTables()
      ])

    } catch (error) {
      console.error('Error loading initial data:', error)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  const loadProductsAndCategories = async () => {
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        getPOSProductsByType(REGISTER_TYPE_ID),
        getPOSProductCategories(REGISTER_TYPE_ID)
      ])

      if (productsResult.success) {
        setProducts(productsResult.data || [])
      }

      if (categoriesResult.success) {
        setCategories(categoriesResult.data || [])
      }
    } catch (error) {
      console.error('Error loading products and categories:', error)
    }
  }

  const loadTables = async () => {
    try {
      const tablesResult = await getPOSTables()
      if (tablesResult.success) {
        setTables(tablesResult.data || [])
      }
    } catch (error) {
      console.error('Error loading tables:', error)
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

  const handleSelectTable = (table: POSTable) => {
    setSelectedTable(table)
    setViewMode('products')
    setShowTableModal(false)
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

  const updateItemNotes = (id: number, notes: string) => {
    setCart(cart.map(item => 
      item.id === id ? { ...item, notes } : item
    ))
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

  const handleSendToKitchen = async () => {
    if (cart.length === 0 || !selectedTable) return

    try {
      // Marcar mesa como ocupada
      await updateTableStatus(selectedTable.id, 'occupied')
      
      // Aquí se podría implementar envío a cocina
      alert('Orden enviada a cocina')
      
      // Recargar mesas
      await loadTables()
    } catch (error) {
      console.error('Error sending to kitchen:', error)
      alert('Error enviando a cocina')
    }
  }

  const handleProcessPayment = async () => {
    if (cart.length === 0 || !selectedTable) return

    // Cliente es obligatorio - no permitir ventas sin cliente
    if (!customerId) {
      alert('⚠️ Debe seleccionar un cliente para procesar la venta')
      return
    }

    setIsProcessing(true)
    try {
      const { subtotal, discountAmount, subtotalAfterDiscount, taxAmount, total } = getCartTotals()
      const change = paymentMethod === 'cash' && cashReceived > total ? cashReceived - total : 0

      // Determinar el nombre del cliente de forma más robusta
      let finalCustomerName = 'Cliente sin nombre'
      if (customerId) {
        try {
          const result = await getClient(customerId)
          if (result.success && result.data) {
            const client = result.data
            if (client.tipoCliente === 'EMPRESA') {
              finalCustomerName = client.razonSocial || client.nombrePrincipal || 'Empresa sin nombre'
            } else {
              const nombre = client.nombrePrincipal || ''
              const apellido = client.apellido || ''
              finalCustomerName = `${nombre} ${apellido}`.trim() || 'Cliente sin nombre'
            }
          }
        } catch (error) {
          console.error('Error obteniendo información del cliente:', error)
        }
      }

      const saleData = {
        sessionId: session.id,
        customerName: finalCustomerName,
        tableNumber: selectedTable.number,
        subtotal,
        discountAmount,
        discountReason: discountReason || undefined,
        taxAmount,
        total,
        paymentMethod,
        cashReceived: paymentMethod === 'cash' ? cashReceived : undefined,
        change: change > 0 ? change : undefined,
        notes: notes || undefined,
        customerId: customerId,
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.price * item.quantity,
          notes: item.notes
        }))
      }

      const result = await createPOSSale(saleData)
      
      if (result.success) {
        // Liberar mesa
        await updateTableStatus(selectedTable.id, 'available')
        
        // Limpiar formulario
        clearCart()
        setCustomerId(undefined)
        setCustomerName('')
        setRoomNumber('')
        setCashReceived(0)
        setNotes('')
        clearDiscount()
        setSelectedTable(null)
        setShowPaymentModal(false)
        setViewMode('tables')
        
        // Recargar datos
        await Promise.all([
          loadSessionStats(session.id),
          loadTables()
        ])
        
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
    if (cart.length === 0 || !selectedTable) return

    // Cliente es obligatorio - no permitir ventas sin cliente
    if (!customerId) {
      alert('⚠️ Debe seleccionar un cliente para procesar la venta')
      return
    }

    setIsProcessing(true)
    try {
      const { subtotal, discountAmount, subtotalAfterDiscount, taxAmount, total } = getCartTotals()

      // Determinar el nombre del cliente de forma más robusta
      let finalCustomerName = 'Cliente sin nombre'
      if (customerId) {
        try {
          const result = await getClient(customerId)
          if (result.success && result.data) {
            const client = result.data
            if (client.tipoCliente === 'EMPRESA') {
              finalCustomerName = client.razonSocial || client.nombrePrincipal || 'Empresa sin nombre'
            } else {
              const nombre = client.nombrePrincipal || ''
              const apellido = client.apellido || ''
              finalCustomerName = `${nombre} ${apellido}`.trim() || 'Cliente sin nombre'
            }
          }
        } catch (error) {
          console.error('Error obteniendo información del cliente:', error)
        }
      }

      const saleData = {
        sessionId: session.id,
        customerName: finalCustomerName,
        clientId: customerId,
        tableNumber: selectedTable.number,
        roomNumber: roomNumber || undefined,
        subtotal,
        discountAmount,
        discountReason: discountReason || undefined,
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
          total: item.price * item.quantity,
          notes: item.notes
        }))
      }

      const result = await createPOSSaleWithMultiplePayments(saleData)
      
      if (result.success) {
        // Liberar mesa
        await updateTableStatus(selectedTable.id, 'available')
        
        // Limpiar formulario
        clearCart()
        setCustomerId(undefined)
        setCustomerName('')
        setRoomNumber('')
        setCashReceived(0)
        setNotes('')
        clearDiscount()
        setSelectedTable(null)
        setShowMultiplePaymentModal(false)
        setViewMode('tables')
        
        // Recargar datos
        await Promise.all([
          loadSessionStats(session.id),
          loadTables()
        ])
        
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

  const quickCalculateChange = (amount: number) => {
    const { total } = getCartTotals() // Con IVA y descuentos aplicados
    setCashReceived(amount)
    return amount - total
  }

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 border-green-300 text-green-800'
      case 'occupied': return 'bg-red-100 border-red-300 text-red-800'
      case 'reserved': return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      case 'cleaning': return 'bg-blue-100 border-blue-300 text-blue-800'
      default: return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  const getTableStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible'
      case 'occupied': return 'Ocupada'
      case 'reserved': return 'Reservada'
      case 'cleaning': return 'Limpieza'
      default: return 'Desconocido'
    }
  }

  // Vista cuando no hay sesión activa
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <UtensilsCrossed className="h-6 w-6 text-orange-600" />
                POS Restaurante - AdminTermas
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
                  className="bg-orange-600 hover:bg-orange-700"
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
                      <UtensilsCrossed className="h-4 w-4 mr-2" />
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
              <DialogTitle>Iniciar Sesión de Caja - Restaurante</DialogTitle>
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
                  className="bg-orange-600 hover:bg-orange-700"
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando POS Restaurante...</p>
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
                <UtensilsCrossed className="h-5 w-5 text-orange-600" />
                POS Restaurante
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
                <Badge className="bg-orange-100 text-orange-800">
                  Sesión #{session.sessionNumber || session.id}
                </Badge>
                {selectedTable && (
                  <Badge className="bg-blue-100 text-blue-800">
                    Mesa {selectedTable.number}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant={viewMode === 'tables' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('tables')}
                className={viewMode === 'tables' ? 'bg-orange-600 hover:bg-orange-700' : ''}
              >
                <Table className="h-4 w-4 mr-2" />
                Mesas
              </Button>
              <Button 
                variant={viewMode === 'products' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('products')}
                disabled={!selectedTable}
                className={viewMode === 'products' ? 'bg-orange-600 hover:bg-orange-700' : ''}
              >
                <UtensilsCrossed className="h-4 w-4 mr-2" />
                Menú
              </Button>
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

      <div className="max-w-7xl mx-auto p-4">
        {/* Estadísticas rápidas */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{stats.totalSales}</p>
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
                  <p className="text-2xl font-bold text-purple-600">{stats.cardSales}</p>
                  <p className="text-sm text-gray-600">Tarjeta</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel principal */}
          <div className="lg:col-span-2 space-y-6">
            {viewMode === 'tables' ? (
              /* Vista de mesas */
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Table className="h-5 w-5" />
                    Mesas del Restaurante
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {tables.map((table) => (
                      <Card 
                        key={table.id}
                        className={`cursor-pointer hover:shadow-md transition-shadow border-2 ${getTableStatusColor(table.status)}`}
                        onClick={() => handleSelectTable(table)}
                      >
                        <CardContent className="p-4">
                          <div className="text-center space-y-2">
                            <div className="w-12 h-12 mx-auto rounded-full bg-white flex items-center justify-center text-xl font-bold">
                              {table.number}
                            </div>
                            <h3 className="font-medium">{table.name || `Mesa ${table.number}`}</h3>
                            <Badge variant="outline" className="text-xs">
                              {getTableStatusText(table.status)}
                            </Badge>
                            {table.capacity && (
                              <p className="text-xs text-gray-600">
                                <Users className="h-3 w-3 inline mr-1" />
                                {table.capacity} personas
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Vista de productos/menú */
              <>
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
                        className={selectedCategory === 'all' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                      >
                        Todo el menú
                      </Button>
                      {categories.map((category) => (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.name ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedCategory(category.name)}
                          className={selectedCategory === category.name ? 'bg-orange-600 hover:bg-orange-700' : ''}
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
                              <span className="text-2xl">{product.category?.icon || '🍽️'}</span>
                            )}
                          </div>
                          <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                          <p className="text-lg font-bold text-orange-600">
                            {formatCurrency(Math.round(product.price))}
                          </p>
                          <p className="text-xs text-gray-500">
                            IVA incluido
                          </p>
                          <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">
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
              </>
            )}
          </div>

          {/* Panel de orden */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Orden Actual
                  {cart.length > 0 && (
                    <Badge className="ml-2">{cart.length}</Badge>
                  )}
                </CardTitle>
                {selectedTable && (
                  <p className="text-sm text-gray-600">Mesa {selectedTable.number}</p>
                )}
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
                      value={customerId}
                      onValueChange={(clientId, clientName) => handleClientSelection(clientId)}
                      className="bg-white"
                      required={true}
                      showRequiredIndicator={true}
                      label=""
                    />

                    {/* Mensaje de advertencia cuando no hay cliente seleccionado */}
                    {!customerId && cart.length > 0 && (
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
                    {!selectedTable ? 'Selecciona una mesa para comenzar' : 'La orden está vacía'}
                  </p>
                ) : (
                  <>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <p className="text-xs text-gray-600">{item.category}</p>
                              <p className="text-sm font-bold text-orange-600">
                                {formatCurrency(item.price)}
                              </p>
                              <p className="text-xs text-gray-500">IVA incluido</p>
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
                          <Input
                            placeholder="Notas especiales..."
                            value={item.notes || ''}
                            onChange={(e) => updateItemNotes(item.id, e.target.value)}
                            className="text-xs"
                          />
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
                        <span className="text-orange-600">
                          {formatCurrency(getCartTotals().total)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 text-center mt-2">
                        Precios netos + IVA 19% - Descuentos por producto
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={handleSendToKitchen}
                        disabled={!selectedTable}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Enviar a Cocina
                      </Button>
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                        onClick={() => setShowMultiplePaymentModal(true)}
                        disabled={!selectedTable || !customerId}
                        title={!customerId ? "Debe seleccionar un cliente" : ""}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Procesar Pago
                        {!customerId && " (Cliente requerido)"}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={clearCart}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpiar Orden
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Procesar Pago - Mesa {selectedTable?.number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Resumen de venta */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                {(() => {
                  const { subtotal, discountAmount, subtotalAfterDiscount, taxAmount, total } = getCartTotals();
                  return (
                    <>
                      <div className="flex justify-between">
                        <span>Subtotal inicial:</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <>
                          <div className="flex justify-between text-green-600">
                            <span>Descuento aplicado:</span>
                            <span>-{formatCurrency(discountAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Subtotal con descuento:</span>
                            <span>{formatCurrency(subtotalAfterDiscount)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between">
                        <span>IVA (19%):</span>
                        <span>{formatCurrency(taxAmount)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total a pagar:</span>
                        <span className="text-orange-600">
                          {formatCurrency(total)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {discountAmount > 0 ? 'Precio final con descuento e IVA incluido' : 'Los precios mostrados incluyen IVA'}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Sección de descuentos */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-800">💸 Descuento Especial</span>
                  {discountType !== 'none' && (
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                      Aplicado
                    </Badge>
                  )}
                </div>
                {discountType !== 'none' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearDiscount}
                    className="h-7 px-2 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Quitar
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {/* Tipo de descuento */}
                <div>
                  <Label className="text-xs">Tipo de descuento</Label>
                  <Select 
                    value={discountType} 
                    onValueChange={(value: 'none' | 'percentage' | 'fixed_amount') => {
                      setDiscountType(value);
                      if (value === 'none') {
                        setDiscountValue(0);
                        setDiscountReason('');
                      }
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin descuento</SelectItem>
                      <SelectItem value="percentage">Descuento por porcentaje (%)</SelectItem>
                      <SelectItem value="fixed_amount">Descuento por monto fijo ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Valor del descuento */}
                {discountType !== 'none' && (
                  <div>
                    <Label className="text-xs">
                      {discountType === 'percentage' ? 'Porcentaje (%)' : 'Monto ($)'}
                    </Label>
                    <Input
                      type="number"
                      value={discountValue}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        const subtotal = getCartTotal();
                        
                        if (discountType === 'percentage') {
                          setDiscountValue(Math.min(100, Math.max(0, value)));
                        } else if (discountType === 'fixed_amount') {
                          setDiscountValue(Math.min(subtotal, Math.max(0, value)));
                        }
                      }}
                      placeholder={discountType === 'percentage' ? '10' : '1000'}
                      min="0"
                      max={discountType === 'percentage' ? '100' : getCartTotal().toString()}
                      className="h-8"
                    />
                    {discountType === 'percentage' && discountValue > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        Equivale a {formatCurrency(calculateDiscountAmount(getCartTotal(), discountType, discountValue))}
                      </p>
                    )}
                  </div>
                )}

                {/* Razón del descuento */}
                {discountType !== 'none' && (
                  <div>
                    <Label className="text-xs">Razón del descuento</Label>
                    <Input
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      placeholder="Ej: Cliente frecuente, promoción especial..."
                      className="h-8 text-xs"
                    />
                  </div>
                )}

                {/* Vista previa del descuento */}
                {discountType !== 'none' && discountValue > 0 && (
                  <div className="p-2 bg-white rounded border text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Descuento aplicado:</span>
                      <span className="font-bold text-green-600">
                        -{formatCurrency(calculateDiscountAmount(getCartTotal(), discountType, discountValue))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Método de pago */}
            <div>
              <Label>Método de pago</Label>
              <Select value={paymentMethod} onValueChange={(value: 'cash' | 'card' | 'transfer') => setPaymentMethod(value)}>
                <SelectTrigger>
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



            {/* Efectivo recibido */}
            {paymentMethod === 'cash' && (
              <div>
                <Label htmlFor="cashReceived">Efectivo recibido</Label>
                <Input
                  id="cashReceived"
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(Number(e.target.value))}
                  placeholder="0"
                />
                
                {/* Calculadora rápida */}
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[10000, 20000, 50000].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => quickCalculateChange(amount)}
                      className="text-xs"
                    >
                      {formatCurrency(amount)}
                    </Button>
                  ))}
                </div>
                
                {cashReceived > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 rounded">
                    <p className="text-sm">
                      Vuelto: <span className="font-bold">
                        {formatCurrency(Math.max(0, cashReceived - getCartTotals().total))}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Notas */}
            <div>
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones adicionales..."
                rows={2}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentModal(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleProcessPayment}
                disabled={isProcessing || (paymentMethod === 'cash' && cashReceived < getCartTotals().total)}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? 'Procesando...' : (
                  <>
                    <Receipt className="h-4 w-4 mr-2" />
                    Confirmar Pago
                  </>
                )}
              </Button>
            </div>
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
        tableNumber={selectedTable?.number}
        roomNumber={roomNumber}
        isProcessing={isProcessing}
      />
    </div>
  )
} 