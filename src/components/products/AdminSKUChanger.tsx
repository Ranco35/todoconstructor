'use client';

import { useState } from 'react';
import { updateProductSKUAdmin, getProductForSKUChange } from '@/actions/products/update-sku-admin';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, Save, Search, Shield } from 'lucide-react';

interface AdminSKUChangerProps {
  productId?: number;
}

export default function AdminSKUChanger({ productId }: AdminSKUChangerProps) {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [productInfo, setProductInfo] = useState<{ id: number; sku: string; name: string } | null>(null);
  const [newSku, setNewSku] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [searchId, setSearchId] = useState(productId?.toString() || '');

  const handleSearch = async () => {
    if (!searchId) {
      toast({
        title: "Error",
        description: "Ingresa un ID de producto válido",
        variant: "destructive"
      });
      return;
    }

    setSearching(true);
    try {
      const result = await getProductForSKUChange(parseInt(searchId));
      if (result.success && result.product) {
        setProductInfo(result.product);
        setNewSku(result.product.sku);
        toast({
          title: "Producto encontrado",
          description: `SKU actual: ${result.product.sku}`
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Producto no encontrado",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al buscar el producto",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const handleUpdateSKU = async () => {
    if (!productInfo || !newSku.trim()) {
      toast({
        title: "Error",
        description: "Completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    if (confirmationCode !== "ADMIN-SKU-CHANGE") {
      toast({
        title: "Error",
        description: "Código de confirmación incorrecto",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await updateProductSKUAdmin(productInfo.id, newSku, confirmationCode);
      if (result.success) {
        toast({
          title: "SKU actualizado",
          description: result.message || "SKU cambiado exitosamente"
        });
        setProductInfo(null);
        setNewSku('');
        setConfirmationCode('');
        setSearchId('');
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al actualizar SKU",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error interno al actualizar SKU",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-orange-800">
          🔒 Cambio de SKU - Solo Administradores
        </h3>
      </div>

      <div className="space-y-4">
        {/* Buscar producto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar producto por ID
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="ID del producto"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {searching ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>

        {/* Información del producto */}
        {productInfo && (
          <div className="bg-white border border-orange-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Producto encontrado:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>ID:</strong> {productInfo.id}</p>
              <p><strong>Nombre:</strong> {productInfo.name}</p>
              <p><strong>SKU actual:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{productInfo.sku}</code></p>
            </div>
          </div>
        )}

        {/* Nuevo SKU */}
        {productInfo && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nuevo SKU
            </label>
            <input
              type="text"
              value={newSku}
              onChange={(e) => setNewSku(e.target.value)}
              placeholder="Nuevo SKU"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Código de confirmación */}
        {productInfo && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de confirmación
            </label>
            <input
              type="text"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              placeholder="ADMIN-SKU-CHANGE"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Ingresa: <code className="bg-gray-100 px-1 rounded">ADMIN-SKU-CHANGE</code>
            </p>
          </div>
        )}

        {/* Botón de actualización */}
        {productInfo && (
          <button
            onClick={handleUpdateSKU}
            disabled={loading || !newSku.trim() || !confirmationCode}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            {loading ? 'Actualizando...' : 'Cambiar SKU (PELIGROSO)'}
          </button>
        )}

        {/* Advertencia */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium mb-1">⚠️ ADVERTENCIA CRÍTICA:</p>
              <ul className="space-y-1 text-xs">
                <li>• Cambiar SKUs puede causar errores en importaciones</li>
                <li>• Puede afectar integraciones con sistemas externos</li>
                <li>• Solo usar en casos excepcionales</li>
                <li>• Notificar al equipo de desarrollo antes del cambio</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
