'use client';

import React from 'react';
import NormalProductSearch from '@/components/products/NormalProductSearch';

export default function NormalReservationClient() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Sistema de Reservas - Productos Normales
              </h1>
              <p className="text-gray-600 mt-2">
                Gestión de reservas con productos del inventario normal, búsqueda por categoría y mejor control de ventas
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Nueva Funcionalidad</div>
              <div className="text-lg font-semibold text-blue-600">🎯 Productos por Categoría</div>
            </div>
          </div>
        </div>

        {/* Funcionalidades Implementadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <span className="text-2xl">🏷️</span>
              </div>
              <h3 className="font-semibold text-gray-900">Búsqueda por Categoría</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Primero selecciona una categoría, luego explora productos específicos de esa categoría
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="font-semibold text-gray-900">Productos Normales</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Usa productos directamente del inventario sin sistema híbrido
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-100 p-2 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold text-gray-900">Control de Ventas</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Seguimiento separado de ventas individuales vs ventas en paquetes
            </p>
          </div>
        </div>

        {/* Demostración del Componente de Búsqueda */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="text-3xl">🔍</span>
            Demostración: Búsqueda de Productos por Categoría
          </h2>
          
          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">📋 Flujo de Trabajo:</h3>
              <ol className="text-blue-700 text-sm space-y-1">
                <li>1. <strong>Selecciona una categoría</strong> (ej: Spa, Comidas, Servicios)</li>
                <li>2. <strong>Explora productos</strong> de esa categoría específica</li>
                <li>3. <strong>Busca y filtra</strong> dentro de la categoría seleccionada</li>
                <li>4. <strong>Selecciona múltiples productos</strong> para el paquete</li>
                <li>5. <strong>Control granular</strong> de ventas individuales vs paquetes</li>
              </ol>
            </div>
          </div>

          {/* Componente de búsqueda */}
          <NormalProductSearch
            multiSelect={true}
            showSelectedCount={true}
            placeholder="Buscar productos por nombre, SKU o descripción..."
            categoryFirst={true}
            onProductsSelect={(products) => {
              console.log('Productos seleccionados:', products);
            }}
          />
        </div>

        {/* Beneficios del Nuevo Sistema */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="text-3xl">✅</span>
            Beneficios del Sistema Mejorado
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 text-lg">Para Usuarios:</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span><strong>Navegación intuitiva:</strong> Primero categoría, luego productos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span><strong>Búsqueda eficiente:</strong> Filtros avanzados y búsqueda por texto</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span><strong>Selección múltiple:</strong> Agrega varios productos al mismo tiempo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span><strong>Información completa:</strong> SKU, precios, categorías visibles</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 text-lg">Para el Negocio:</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span><strong>Control de ventas:</strong> Seguimiento separado individual vs paquetes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span><strong>Inventario unificado:</strong> Un solo sistema de productos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span><strong>Reportes mejorados:</strong> Análisis detallado por categorías</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span><strong>Escalabilidad:</strong> Fácil agregar nuevos productos y categorías</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Ejemplo de Caso de Uso */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-lg p-6 mt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <span className="text-3xl">💡</span>
            Ejemplo: "Piscina Termal Adulto"
          </h2>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Flujo Tradicional vs Nuevo Flujo:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-red-700">❌ Sistema Anterior (Híbrido):</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>1. Buscar en tabla products_modular</li>
                  <li>2. Si no existe, crear producto híbrido</li>
                  <li>3. Mapear categorías manualmente</li>
                  <li>4. Gestión compleja de dos sistemas</li>
                  <li>5. Dificultad para reportes de ventas</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-green-700">✅ Nuevo Sistema (Directo):</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>1. Seleccionar categoría "Spa"</li>
                  <li>2. Buscar "piscina termal adulto"</li>
                  <li>3. Seleccionar producto directamente</li>
                  <li>4. Sistema unificado de productos</li>
                  <li>5. Reportes automáticos por ventas individuales/paquetes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 