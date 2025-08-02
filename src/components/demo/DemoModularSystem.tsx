'use client';

import React, { useState, useMemo } from 'react';
import { Package, Plus, DollarSign, Users, Clock, CheckCircle, Settings, Eye, Sparkles, Calculator, TrendingUp } from 'lucide-react';

// 🗄️ Base de datos de productos individuales (demo)
const DEMO_PRODUCTS = {
  // Alojamiento
  habitacion_estandar: { 
    id: 1, name: 'Habitación Estándar', price: 85000, category: 'alojamiento', 
    description: 'Habitación cómoda con baño privado', perPerson: false 
  },
  habitacion_superior: { 
    id: 2, name: 'Habitación Superior', price: 110000, category: 'alojamiento', 
    description: 'Habitación superior con vista', perPerson: false 
  },
  suite_junior: { 
    id: 3, name: 'Suite Junior', price: 140000, category: 'alojamiento', 
    description: 'Suite espaciosa con sala de estar', perPerson: false 
  },

  // Comidas
  desayuno: { 
    id: 4, name: 'Desayuno Buffet', price: 15000, category: 'comida', 
    description: 'Desayuno buffet continental', perPerson: true 
  },
  almuerzo: { 
    id: 5, name: 'Almuerzo', price: 25000, category: 'comida', 
    description: 'Almuerzo en restaurante principal', perPerson: true 
  },
  cena: { 
    id: 6, name: 'Cena', price: 30000, category: 'comida', 
    description: 'Cena en restaurante principal', perPerson: true 
  },
  snacks: { 
    id: 7, name: 'Snacks Todo el Día', price: 8000, category: 'comida', 
    description: 'Snacks y bebidas durante el día', perPerson: true 
  },

  // Servicios del Spa
  piscina_termal: { 
    id: 8, name: 'Piscina Termal', price: 12000, category: 'spa', 
    description: 'Acceso ilimitado a piscinas termales', perPerson: true 
  },
  spa_basico: { 
    id: 9, name: 'Spa Básico', price: 18000, category: 'spa', 
    description: 'Sesiones básicas de spa incluidas', perPerson: true 
  },
  spa_premium: { 
    id: 10, name: 'Spa Premium', price: 35000, category: 'spa', 
    description: 'Tratamientos premium de spa', perPerson: true 
  },

  // Entretenimiento
  actividades_basicas: { 
    id: 11, name: 'Actividades Básicas', price: 5000, category: 'entretenimiento', 
    description: 'Actividades recreativas básicas', perPerson: true 
  },
  actividades_premium: { 
    id: 12, name: 'Actividades Premium', price: 15000, category: 'entretenimiento', 
    description: 'Actividades recreativas premium', perPerson: true 
  },
  bar_incluido: { 
    id: 13, name: 'Bar Incluido', price: 20000, category: 'entretenimiento', 
    description: 'Bebidas alcohólicas y no alcohólicas', perPerson: true 
  },

  // Servicios adicionales
  wifi: { 
    id: 14, name: 'WiFi Premium', price: 0, category: 'servicios', 
    description: 'WiFi gratuito en todo el hotel', perPerson: false 
  },
  parking: { 
    id: 15, name: 'Estacionamiento', price: 5000, category: 'servicios', 
    description: 'Estacionamiento privado', perPerson: false 
  }
};

// 📦 Configuración de paquetes (qué productos incluye cada uno)
const DEMO_PACKAGES = {
  SOLO_ALOJAMIENTO: {
    name: 'Solo Alojamiento',
    description: 'Solo la habitación',
    products: ['wifi'],
    color: 'gray'
  },
  DESAYUNO: {
    name: 'Solo Desayuno', 
    description: 'Alojamiento + desayuno + servicios básicos',
    products: ['desayuno', 'piscina_termal', 'wifi'],
    color: 'blue'
  },
  MEDIA_PENSION: {
    name: 'Media Pensión',
    description: 'Desayuno + almuerzo + piscina termal',
    products: ['desayuno', 'almuerzo', 'piscina_termal', 'actividades_basicas', 'wifi'],
    color: 'green'
  },
  PENSION_COMPLETA: {
    name: 'Pensión Completa',
    description: 'Todas las comidas + servicios spa',
    products: ['desayuno', 'almuerzo', 'cena', 'piscina_termal', 'spa_basico', 'actividades_basicas', 'wifi'],
    color: 'purple'
  },
  TODO_INCLUIDO: {
    name: 'Todo Incluido',
    description: 'Todo incluido + entretenimiento premium',
    products: ['desayuno', 'almuerzo', 'cena', 'snacks', 'piscina_termal', 'spa_premium', 'actividades_premium', 'bar_incluido', 'wifi', 'parking'],
    color: 'red'
  }
};

// 💰 Precios por edad
const AGE_MULTIPLIERS = {
  adult: 1.0,      // 13+ años: precio completo
  child: 0.5,      // 4-12 años: 50% descuento
  baby: 0.0        // 0-3 años: gratis
};

function getAgeCategory(age: number) {
  if (age <= 3) return 'baby';
  if (age <= 12) return 'child';
  return 'adult';
}

export default function DemoModularSystem() {
  const [selectedRoom, setSelectedRoom] = useState('suite_junior');
  const [selectedPackage, setSelectedPackage] = useState('MEDIA_PENSION');
  const [guests, setGuests] = useState({
    adults: 2,
    children: 1,
    childrenAges: [8]
  });
  const [nights, setNights] = useState(3);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [customProducts, setCustomProducts] = useState<string[]>([]);
  const [activeDemo, setActiveDemo] = useState<'calculator' | 'comparison' | 'analytics'>('calculator');

  // Calcular precio total del paquete
  const packageCalculation = useMemo(() => {
    const roomProduct = DEMO_PRODUCTS[selectedRoom as keyof typeof DEMO_PRODUCTS];
    const packageConfig = DEMO_PACKAGES[selectedPackage as keyof typeof DEMO_PACKAGES];
    
    // Precio habitación (fijo por noche)
    const roomTotal = roomProduct.price * nights;
    
    // Calcular productos incluidos en el paquete
    let packageProductsTotal = 0;
    const productBreakdown: any[] = [];
    
    packageConfig.products.forEach(productKey => {
      const product = DEMO_PRODUCTS[productKey as keyof typeof DEMO_PRODUCTS];
      if (!product) return;
      
      let productTotal = 0;
      
      if (product.perPerson) {
        // Precio por persona según edad
        let adultsPrice = guests.adults * product.price * AGE_MULTIPLIERS.adult;
        let childrenPrice = 0;
        
        guests.childrenAges.forEach(age => {
          const category = getAgeCategory(age);
          childrenPrice += product.price * AGE_MULTIPLIERS[category];
        });
        
        productTotal = (adultsPrice + childrenPrice) * nights;
      } else {
        // Precio fijo (no depende de personas)
        productTotal = product.price * nights;
      }
      
      packageProductsTotal += productTotal;
      productBreakdown.push({
        ...product,
        total: productTotal,
        adultsPrice: product.perPerson ? product.price * guests.adults * AGE_MULTIPLIERS.adult * nights : 0,
        childrenPrice: product.perPerson ? guests.childrenAges.reduce((sum, age) => {
          const category = getAgeCategory(age);
          return sum + (product.price * AGE_MULTIPLIERS[category] * nights);
        }, 0) : 0
      });
    });

    // Productos adicionales personalizados
    let customProductsTotal = 0;
    const customBreakdown: any[] = [];
    
    customProducts.forEach(productKey => {
      const product = DEMO_PRODUCTS[productKey as keyof typeof DEMO_PRODUCTS];
      if (!product) return;
      
      let productTotal = 0;
      if (product.perPerson) {
        let adultsPrice = guests.adults * product.price * AGE_MULTIPLIERS.adult;
        let childrenPrice = guests.childrenAges.reduce((sum, age) => {
          const category = getAgeCategory(age);
          return sum + (product.price * AGE_MULTIPLIERS[category]);
        }, 0);
        productTotal = (adultsPrice + childrenPrice) * nights;
      } else {
        productTotal = product.price * nights;
      }
      
      customProductsTotal += productTotal;
      customBreakdown.push({
        ...product,
        total: productTotal
      });
    });
    
    const grandTotal = roomTotal + packageProductsTotal + customProductsTotal;
    
    return {
      roomTotal,
      packageProductsTotal,
      customProductsTotal,
      grandTotal,
      productBreakdown,
      customBreakdown,
      dailyTotal: grandTotal / nights
    };
  }, [selectedRoom, selectedPackage, guests, nights, customProducts]);

  const handleChildrenChange = (count: number) => {
    const newAges = Array(count).fill(8);
    setGuests(prev => ({ ...prev, children: count, childrenAges: newAges }));
  };

  const handleChildAgeChange = (index: number, age: number) => {
    const newAges = [...guests.childrenAges];
    newAges[index] = age;
    setGuests(prev => ({ ...prev, childrenAges: newAges }));
  };

  const addCustomProduct = (productKey: string) => {
    if (!customProducts.includes(productKey)) {
      setCustomProducts(prev => [...prev, productKey]);
    }
  };

  const removeCustomProduct = (productKey: string) => {
    setCustomProducts(prev => prev.filter(p => p !== productKey));
  };

  const availableCustomProducts = Object.entries(DEMO_PRODUCTS).filter(
    ([key]) => !DEMO_PACKAGES[selectedPackage as keyof typeof DEMO_PACKAGES].products.includes(key) && 
               !customProducts.includes(key) &&
               key !== selectedRoom
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-8 border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Sparkles className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  Demo Sistema Modular - Productos Dinámicos
                </h1>
                <p className="text-gray-600 mt-2">
                  Demostración interactiva del sistema de productos modulares para reservas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveDemo('calculator')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  activeDemo === 'calculator' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <Calculator size={16} />
                Calculadora
              </button>
              <button
                onClick={() => setActiveDemo('comparison')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  activeDemo === 'comparison' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <Eye size={16} />
                Comparar
              </button>
              <button
                onClick={() => setActiveDemo('analytics')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  activeDemo === 'analytics' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <TrendingUp size={16} />
                Analytics
              </button>
            </div>
          </div>
        </div>

        {activeDemo === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel de Configuración */}
            <div className="space-y-6">
              {/* Selección de habitación */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🏨 Tipo de Habitación</h3>
                <div className="grid grid-cols-1 gap-3">
                  {['habitacion_estandar', 'habitacion_superior', 'suite_junior'].map(roomKey => {
                    const room = DEMO_PRODUCTS[roomKey as keyof typeof DEMO_PRODUCTS];
                    return (
                      <div
                        key={roomKey}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedRoom === roomKey
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedRoom(roomKey)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold text-gray-900">{room.name}</h4>
                            <p className="text-sm text-gray-600">{room.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600">${room.price.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">por noche</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Huéspedes */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Huéspedes</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adultos</label>
                    <select
                      value={guests.adults}
                      onChange={(e) => setGuests(prev => ({ ...prev, adults: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Niños</label>
                    <select
                      value={guests.children}
                      onChange={(e) => handleChildrenChange(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {[0, 1, 2, 3, 4].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {guests.children > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Edades de los Niños</label>
                    <div className="grid grid-cols-2 gap-3">
                      {guests.childrenAges.map((age, index) => (
                        <div key={index}>
                          <label className="block text-xs text-gray-500 mb-1">Niño {index + 1}</label>
                          <select
                            value={age}
                            onChange={(e) => handleChildAgeChange(index, parseInt(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            {Array.from({ length: 18 }, (_, i) => i).map(ageOption => (
                              <option key={ageOption} value={ageOption}>
                                {ageOption} año{ageOption !== 1 ? 's' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Noches</label>
                  <select
                    value={nights}
                    onChange={(e) => setNights(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>{num} noche{num !== 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selección de paquete */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📦 Paquetes Disponibles</h3>
                <div className="space-y-3">
                  {Object.entries(DEMO_PACKAGES).map(([packageKey, config]) => (
                    <div
                      key={packageKey}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedPackage === packageKey
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPackage(packageKey)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{config.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {config.products.slice(0, 3).map(productKey => {
                              const product = DEMO_PRODUCTS[productKey as keyof typeof DEMO_PRODUCTS];
                              return (
                                <span key={productKey} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  {product?.name}
                                </span>
                              );
                            })}
                            {config.products.length > 3 && (
                              <span className="text-xs text-gray-500">+{config.products.length - 3} más</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Productos adicionales */}
              {availableCustomProducts.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">➕ Servicios Adicionales</h3>
                  <div className="space-y-2">
                    {availableCustomProducts.map(([productKey, product]) => (
                      <div key={productKey} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          <p className="text-sm text-gray-600">{product.description}</p>
                          <p className="text-sm font-medium text-blue-600">
                            ${product.price.toLocaleString()}{product.perPerson ? ' por persona' : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => addCustomProduct(productKey)}
                          className="ml-4 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Panel de Resultados */}
            <div className="space-y-6">
              {/* Desglose de precios */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="text-green-600" />
                  Desglose de Precios
                </h3>

                <div className="space-y-4">
                  {/* Habitación */}
                  <div className="border-b border-gray-100 pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {DEMO_PRODUCTS[selectedRoom as keyof typeof DEMO_PRODUCTS].name}
                        </h4>
                        <p className="text-sm text-gray-600">{nights} noche{nights !== 1 ? 's' : ''}</p>
                      </div>
                      <span className="font-bold text-lg">
                        ${packageCalculation.roomTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Productos del paquete */}
                  <div className="border-b border-gray-100 pb-3">
                    <h4 className="font-medium text-gray-900 mb-3">
                      📦 {DEMO_PACKAGES[selectedPackage as keyof typeof DEMO_PACKAGES].name}
                    </h4>
                    
                    {showProductDetails ? (
                      <div className="space-y-2">
                        {packageCalculation.productBreakdown.map((product: any) => (
                          <div key={product.id} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">{product.name}</span>
                            <span className="font-medium">${product.total.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          {packageCalculation.productBreakdown.length} servicios incluidos
                        </span>
                        <span className="font-bold">
                          ${packageCalculation.packageProductsTotal.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Productos adicionales */}
                  {customProducts.length > 0 && (
                    <div className="border-b border-gray-100 pb-3">
                      <h4 className="font-medium text-gray-900 mb-3">➕ Servicios Adicionales</h4>
                      <div className="space-y-2">
                        {packageCalculation.customBreakdown.map((product: any) => (
                          <div key={product.id} className="flex justify-between items-center text-sm">
                            <div className="flex-1">
                              <span className="text-gray-600">{product.name}</span>
                              <button
                                onClick={() => removeCustomProduct(Object.keys(DEMO_PRODUCTS).find(key => DEMO_PRODUCTS[key as keyof typeof DEMO_PRODUCTS].id === product.id) || '')}
                                className="ml-2 text-red-500 hover:text-red-700"
                              >
                                ✕
                              </button>
                            </div>
                            <span className="font-medium">${product.total.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="font-medium text-gray-700">Subtotal Adicionales:</span>
                          <span className="font-bold">${packageCalculation.customProductsTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-green-800 font-bold text-lg">TOTAL ESTADÍA</span>
                      <span className="font-bold text-2xl text-green-800">
                        ${packageCalculation.grandTotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-green-600">
                      <span>Promedio por noche:</span>
                      <span>${packageCalculation.dailyTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setShowProductDetails(!showProductDetails)}
                    className="flex-1 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    {showProductDetails ? 'Ocultar' : 'Ver'} Detalles
                  </button>
                </div>
              </div>

              {/* Productos incluidos en el paquete */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  ✅ Incluido en {DEMO_PACKAGES[selectedPackage as keyof typeof DEMO_PACKAGES].name}
                </h3>
                <div className="space-y-3">
                  {DEMO_PACKAGES[selectedPackage as keyof typeof DEMO_PACKAGES].products.map(productKey => {
                    const product = DEMO_PRODUCTS[productKey as keyof typeof DEMO_PRODUCTS];
                    return (
                      <div key={productKey} className="flex items-center gap-3">
                        <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          <p className="text-sm text-gray-600">{product.description}</p>
                          <p className="text-xs text-blue-600">
                            ${product.price.toLocaleString()}{product.perPerson ? ' por persona' : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Información de precios por edad */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">💡 Política de Precios:</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Adultos (13+ años): Precio completo</p>
                  <p>• Niños (4-12 años): 50% descuento</p>
                  <p>• Bebés (0-3 años): Gratis</p>
                  <p>• Habitación: Precio fijo independiente de huéspedes</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeDemo === 'comparison' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">📊 Comparación de Paquetes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(DEMO_PACKAGES).map(([key, config]) => {
                const roomProduct = DEMO_PRODUCTS[selectedRoom as keyof typeof DEMO_PRODUCTS];
                const roomTotal = roomProduct.price * nights;
                
                let packageTotal = 0;
                config.products.forEach(productKey => {
                  const product = DEMO_PRODUCTS[productKey as keyof typeof DEMO_PRODUCTS];
                  if (!product) return;
                  
                  if (product.perPerson) {
                    let adultsPrice = guests.adults * product.price * AGE_MULTIPLIERS.adult;
                    let childrenPrice = guests.childrenAges.reduce((sum, age) => {
                      const category = getAgeCategory(age);
                      return sum + (product.price * AGE_MULTIPLIERS[category]);
                    }, 0);
                    packageTotal += (adultsPrice + childrenPrice) * nights;
                  } else {
                    packageTotal += product.price * nights;
                  }
                });
                
                const total = roomTotal + packageTotal;
                
                return (
                  <div key={key} className={`border-2 rounded-lg p-6 transition-all ${
                    key === selectedPackage ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className={`h-2 bg-${config.color}-500 rounded-t mb-4`}></div>
                    <h4 className="font-bold text-lg text-gray-900 mb-2">{config.name}</h4>
                    <p className="text-gray-600 text-sm mb-4">{config.description}</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Productos incluidos:</span>
                        <span className="font-medium">{config.products.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total {nights} noche{nights !== 1 ? 's' : ''}:</span>
                        <span className="font-bold text-lg">${total.toLocaleString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPackage(key)}
                      className={`w-full py-2 px-4 rounded-lg transition-colors ${
                        key === selectedPackage 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {key === selectedPackage ? 'Seleccionado' : 'Seleccionar'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeDemo === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">📈 Estadísticas del Sistema</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Productos:</span>
                  <span className="font-bold">{Object.keys(DEMO_PRODUCTS).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Paquetes:</span>
                  <span className="font-bold">{Object.keys(DEMO_PACKAGES).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Precio Promedio:</span>
                  <span className="font-bold">
                    ${Math.round(Object.values(DEMO_PRODUCTS).reduce((sum, p) => sum + p.price, 0) / Object.keys(DEMO_PRODUCTS).length).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">🎯 Configuración Actual</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Habitación:</span>
                  <span className="font-bold">{DEMO_PRODUCTS[selectedRoom as keyof typeof DEMO_PRODUCTS].name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Paquete:</span>
                  <span className="font-bold">{DEMO_PACKAGES[selectedPackage as keyof typeof DEMO_PACKAGES].name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Huéspedes:</span>
                  <span className="font-bold">{guests.adults + guests.children}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">💰 Análisis de Precios</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total por Noche:</span>
                  <span className="font-bold">${packageCalculation.dailyTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Estadía:</span>
                  <span className="font-bold text-green-600">${packageCalculation.grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ahorro vs Individual:</span>
                  <span className="font-bold text-blue-600">15%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 