'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Percent,
  DollarSign,
  Users,
  Package,
  Tag,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { getDiscounts, deleteDiscount } from '@/actions/sales/discounts';
import type { Discount } from '@/actions/sales/discounts';

const DiscountsPage = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      const result = await getDiscounts();
      
      if (result.success && result.data) {
        setDiscounts(result.data);
      } else {
        setError(result.error || 'Error al cargar descuentos');
      }
    } catch (error) {
      console.error('Error cargando descuentos:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este descuento?')) {
      return;
    }

    try {
      const result = await deleteDiscount(id);
      
      if (result.success) {
        setDiscounts(prev => prev.filter(d => d.id !== id));
      } else {
        alert('Error al eliminar descuento: ' + result.error);
      }
    } catch (error) {
      console.error('Error eliminando descuento:', error);
      alert('Error al eliminar descuento');
    }
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString('es-CL')}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const getDiscountTypeLabel = (type: string): string => {
    switch (type) {
      case 'percentage': return 'Porcentaje';
      case 'fixed': return 'Monto Fijo';
      case 'buy_x_get_y': return 'Compra X Obtén Y';
      default: return type;
    }
  };

  const getDiscountTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage': return Percent;
      case 'fixed': return DollarSign;
      case 'buy_x_get_y': return Tag;
      default: return Tag;
    }
  };

  const getAppliesToLabel = (appliesTo: string): string => {
    switch (appliesTo) {
      case 'all': return 'Todos';
      case 'products': return 'Productos';
      case 'categories': return 'Categorías';
      case 'clients': return 'Clientes';
      default: return appliesTo;
    }
  };

  const getAppliesToIcon = (appliesTo: string) => {
    switch (appliesTo) {
      case 'all': return Tag;
      case 'products': return Package;
      case 'categories': return Tag;
      case 'clients': return Users;
      default: return Tag;
    }
  };

  const getStatusBadge = (discount: Discount) => {
    const now = new Date();
    const validFrom = new Date(discount.validFrom);
    const validTo = new Date(discount.validTo);

    if (!discount.isActive) {
      return <Badge variant="secondary">Inactivo</Badge>;
    }

    if (now < validFrom) {
      return <Badge variant="outline">Pendiente</Badge>;
    }

    if (now > validTo) {
      return <Badge variant="destructive">Expirado</Badge>;
    }

    if (discount.usageLimit && discount.currentUsage >= discount.usageLimit) {
      return <Badge variant="destructive">Límite Alcanzado</Badge>;
    }

    return <Badge variant="default">Activo</Badge>;
  };

  const getStatusIcon = (discount: Discount) => {
    const now = new Date();
    const validFrom = new Date(discount.validFrom);
    const validTo = new Date(discount.validTo);

    if (!discount.isActive) {
      return XCircle;
    }

    if (now < validFrom) {
      return Clock;
    }

    if (now > validTo) {
      return XCircle;
    }

    if (discount.usageLimit && discount.currentUsage >= discount.usageLimit) {
      return XCircle;
    }

    return CheckCircle;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/sales">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎯 Descuentos y Promociones</h1>
              <p className="text-gray-600">Gestión de descuentos, cupones y promociones</p>
            </div>
          </div>
          
          <Link href="/dashboard/sales/discounts/create">
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Nuevo Descuento</span>
            </Button>
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Descuentos</p>
                  <p className="text-2xl font-bold text-gray-900">{discounts.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Activos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {discounts.filter(d => d.isActive).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Con Código</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {discounts.filter(d => d.code).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expirados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {discounts.filter(d => new Date() > new Date(d.validTo)).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Descuentos */}
        <div className="space-y-6">
          {discounts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Tag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay descuentos</h3>
                <p className="text-gray-500 mb-4">Crea tu primer descuento para empezar</p>
                <Link href="/dashboard/sales/discounts/create">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Descuento
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            discounts.map((discount) => {
              const TypeIcon = getDiscountTypeIcon(discount.type);
              const AppliesToIcon = getAppliesToIcon(discount.appliesTo);
              const StatusIcon = getStatusIcon(discount);

              return (
                <Card key={discount.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">{discount.name}</h3>
                          {getStatusBadge(discount)}
                        </div>
                        
                        <p className="text-gray-600 mb-4">{discount.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <TypeIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {getDiscountTypeLabel(discount.type)}: {discount.type === 'percentage' ? `${discount.value}%` : formatCurrency(discount.value)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <AppliesToIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Aplica a: {getAppliesToLabel(discount.appliesTo)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {formatDate(discount.validFrom)} - {formatDate(discount.validTo)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <StatusIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Uso: {discount.currentUsage}{discount.usageLimit ? `/${discount.usageLimit}` : ''}
                            </span>
                          </div>
                        </div>
                        
                        {discount.code && (
                          <div className="flex items-center space-x-2 mb-4">
                            <Tag className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">Código: {discount.code}</span>
                          </div>
                        )}
                        
                        {discount.minAmount && (
                          <div className="text-sm text-gray-500">
                            Monto mínimo: {formatCurrency(discount.minAmount)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Link href={`/dashboard/sales/discounts/${discount.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        
                        <Link href={`/dashboard/sales/discounts/edit/${discount.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(discount.id!)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscountsPage; 