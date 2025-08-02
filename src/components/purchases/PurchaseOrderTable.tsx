'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle,
  Send,
  Package,
  Calendar
} from 'lucide-react';
import { PurchaseOrderWithDetails, PurchaseOrderStatus } from '@/types/purchases';
import { listPurchaseOrders, getPurchaseOrderStats } from '@/actions/purchases/orders/list';
import { approvePurchaseOrder, cancelPurchaseOrder } from '@/actions/purchases/orders/create';
import { formatCurrency } from '@/utils/currency';

interface PurchaseOrderTableProps {
  onViewOrder?: (order: PurchaseOrderWithDetails) => void;
  onEditOrder?: (order: PurchaseOrderWithDetails) => void;
  onCreateOrder?: () => void;
}

export default function PurchaseOrderTable({ 
  onViewOrder, 
  onEditOrder, 
  onCreateOrder 
}: PurchaseOrderTableProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<PurchaseOrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Filtros
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [status, setStatus] = useState<PurchaseOrderStatus | ''>('');
  const [search, setSearch] = useState('');
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [warehouseId, setWarehouseId] = useState<number | ''>('');

  // Cargar datos
  const loadOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listPurchaseOrders({
        page,
        limit,
        status: status || undefined,
        search: search || undefined,
        supplier_id: supplierId || undefined,
        warehouse_id: warehouseId || undefined,
      });

      if (result.success && result.data) {
        setOrders(result.data.orders);
      } else {
        setError(result.error || 'Error al cargar las órdenes');
      }
    } catch (err) {
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      const result = await getPurchaseOrderStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  useEffect(() => {
    loadOrders();
    loadStats();
  }, [page, status, search, supplierId, warehouseId]);

  // Manejar acciones
  const handleView = (order: PurchaseOrderWithDetails) => {
    if (onViewOrder) {
      onViewOrder(order);
    } else {
      router.push(`/dashboard/purchases/orders/${order.id}`);
    }
  };

  const handleEdit = (order: PurchaseOrderWithDetails) => {
    if (onEditOrder) {
      onEditOrder(order);
    } else {
      router.push(`/dashboard/purchases/orders/${order.id}/edit`);
    }
  };

  const handleApprove = async (orderId: number) => {
    try {
      const result = await approvePurchaseOrder(orderId);
      if (result.success) {
        loadOrders();
        loadStats();
      } else {
        setError(result.error || 'Error al aprobar la orden');
      }
    } catch (err) {
      setError('Error interno del servidor');
    }
  };

  const handleCancel = async (orderId: number) => {
    try {
      const result = await cancelPurchaseOrder(orderId);
      if (result.success) {
        loadOrders();
        loadStats();
      } else {
        setError(result.error || 'Error al cancelar la orden');
      }
    } catch (err) {
      setError('Error interno del servidor');
    }
  };

  // Obtener color del badge según estado
  const getStatusColor = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'received':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener texto del estado
  const getStatusText = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'draft':
        return 'Borrador';
      case 'sent':
        return 'Enviada';
      case 'approved':
        return 'Aprobada';
      case 'received':
        return 'Recibida';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Órdenes de Compra</h2>
          <Button onClick={onCreateOrder} disabled>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Orden
          </Button>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Órdenes de Compra</h2>
          {stats && (
            <p className="text-gray-600 mt-1">
              {stats.total} órdenes total • {stats.pendingOrders} pendientes
            </p>
          )}
        </div>
        <Button onClick={onCreateOrder}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Orden
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por número o notas..."
                value={search ?? ''}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value as PurchaseOrderStatus | '')}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="sent">Enviada</SelectItem>
                <SelectItem value="approved">Aprobada</SelectItem>
                <SelectItem value="received">Recibida</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={supplierId?.toString() || 'all'} onValueChange={(value) => setSupplierId(value === 'all' ? '' : (value ? parseInt(value) : ''))}>
              <SelectTrigger>
                <SelectValue placeholder="Proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proveedores</SelectItem>
                {/* Aquí se cargarían los proveedores dinámicamente */}
              </SelectContent>
            </Select>

            <Select value={warehouseId?.toString() || 'all'} onValueChange={(value) => setWarehouseId(value === 'all' ? '' : (value ? parseInt(value) : ''))}>
              <SelectTrigger>
                <SelectValue placeholder="Bodega" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las bodegas</SelectItem>
                {/* Aquí se cargarían las bodegas dinámicamente */}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Bodega</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No se encontraron órdenes de compra</p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={onCreateOrder}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear primera orden
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.number}
                    </TableCell>
                    <TableCell>
                      {order.supplier?.name || 'Sin proveedor'}
                    </TableCell>
                    <TableCell>
                      {order.warehouse?.name || 'Sin bodega'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(order.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {(order.status === 'draft' || order.status === 'sent') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(order)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}

                        {order.status === 'sent' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(order.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                        {(order.status === 'draft' || order.status === 'sent') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(order.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginación */}
      {orders.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando {orders.length} de {stats?.total || 0} órdenes
          </p>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage(Math.max(1, page - 1))}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              <PaginationItem>
                <PaginationLink>
                  Página {page}
                </PaginationLink>
              </PaginationItem>
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPage(page + 1)}
                  className="cursor-pointer"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
} 