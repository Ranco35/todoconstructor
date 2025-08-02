'use client';

import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Eye, Settings, Save, X, DollarSign, Users, Tag } from 'lucide-react';
import { 
  getProductsModular, 
  getPackagesModular,
  type ProductModular,
  type PackageModular
} from '@/actions/products/modular-products';

export default function AdminProductsModular() {
  const [products, setProducts] = useState<ProductModular[]>([]);
  const [packages, setPackages] = useState<PackageModular[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'packages'>('products');
  const [editingProduct, setEditingProduct] = useState<ProductModular | null>(null);
  const [editingPackage, setEditingPackage] = useState<PackageModular | null>(null);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showCreatePackage, setShowCreatePackage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsResult, packagesResult] = await Promise.all([
        getProductsModular(),
        getPackagesModular()
      ]);

      if (productsResult.data) setProducts(productsResult.data);
      if (packagesResult.data) setPackages(packagesResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'alojamiento': return '🏨';
      case 'comida': return '🍽️';
      case 'spa': return '🧘';
      case 'entretenimiento': return '🎯';
      case 'servicios': return '🔧';
      default: return '📦';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'alojamiento': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'comida': return 'bg-green-50 border-green-200 text-green-700';
      case 'spa': return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'entretenimiento': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'servicios': return 'bg-gray-50 border-gray-200 text-gray-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const productsByCategory = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, ProductModular[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando productos modulares...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-8 border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Settings className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Administración de Productos Modulares
                </h1>
                <p className="text-gray-600 mt-2">
                  Gestiona productos, paquetes y configuraciones del sistema modular
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl">⚙️</div>
              <div className="text-gray-500">Panel Admin</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 bg-white rounded-t-xl">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="inline-block w-4 h-4 mr-2" />
                Productos ({products.length})
              </button>
              <button
                onClick={() => setActiveTab('packages')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'packages'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Tag className="inline-block w-4 h-4 mr-2" />
                Paquetes ({packages.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Contenido por pestañas */}
        {activeTab === 'products' && (
          <div className="space-y-8">
            {/* Estadísticas de productos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Productos</p>
                    <p className="text-2xl font-semibold text-gray-900">{products.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Package className="text-blue-600" size={20} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Categorías</p>
                    <p className="text-2xl font-semibold text-gray-900">{Object.keys(productsByCategory).length}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Tag className="text-green-600" size={20} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Por Persona</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {products.filter(p => p.per_person).length}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Users className="text-purple-600" size={20} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Precio Promedio</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <DollarSign className="text-yellow-600" size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Botón crear producto */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowCreateProduct(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 shadow-lg"
              >
                <Plus size={20} />
                Crear Producto
              </button>
            </div>

            {/* Productos por categoría */}
            <div className="space-y-8">
              {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                <div key={category} className="bg-white rounded-xl shadow-lg border border-gray-100">
                  <div className={`px-6 py-4 border-b border-gray-200 ${getCategoryColor(category)} rounded-t-xl`}>
                    <h3 className="text-lg font-semibold flex items-center gap-3">
                      <span className="text-2xl">{getCategoryIcon(category)}</span>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                      <span className="text-sm font-normal">({categoryProducts.length} productos)</span>
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryProducts.map(product => (
                        <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{product.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                            </div>
                            <div className="flex gap-2 ml-2">
                              <button
                                onClick={() => setEditingProduct(product)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit size={16} />
                              </button>
                              <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-lg text-green-600">
                              ${product.price.toLocaleString()}
                            </span>
                            <div className="flex items-center gap-2">
                              {product.per_person && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  Por persona
                                </span>
                              )}
                              <span className={`text-xs px-2 py-1 rounded ${
                                product.is_active 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {product.is_active ? 'Activo' : 'Inactivo'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="space-y-8">
            {/* Estadísticas de paquetes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Paquetes</p>
                    <p className="text-2xl font-semibold text-gray-900">{packages.length}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Package className="text-purple-600" size={20} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Paquetes Activos</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {packages.filter(p => p.is_active).length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Eye className="text-green-600" size={20} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Más Popular</p>
                    <p className="text-lg font-semibold text-gray-900">Media Pensión</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Tag className="text-yellow-600" size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Botón crear paquete */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowCreatePackage(true)}
                className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 flex items-center gap-2 shadow-lg"
              >
                <Plus size={20} />
                Crear Paquete
              </button>
            </div>

            {/* Lista de paquetes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map(pkg => (
                <div key={pkg.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${
                    pkg.color === 'blue' ? 'from-blue-400 to-blue-600' :
                    pkg.color === 'green' ? 'from-green-400 to-green-600' :
                    pkg.color === 'purple' ? 'from-purple-400 to-purple-600' :
                    pkg.color === 'red' ? 'from-red-400 to-red-600' :
                    'from-gray-400 to-gray-600'
                  }`}></div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={() => setEditingPackage(pkg)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit size={16} />
                        </button>
                        <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium bg-${pkg.color}-100 text-${pkg.color}-700`}>
                        {pkg.code}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        pkg.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {pkg.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 