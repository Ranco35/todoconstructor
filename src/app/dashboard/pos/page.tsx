'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Home, UtensilsCrossed, CheckCircle2, ArrowRight, Users, ChefHat, DollarSign, Receipt } from 'lucide-react'
import POSPriceUpdater from '@/components/pos/POSPriceUpdater'

export default function POSSelector() {
  const [sessions, setSessions] = useState<{[key: string]: any}>({})
  const [isLoading, setIsLoading] = useState(false)

  // POS options configuration
  const posOptions = [
    {
      id: 'recepcion',
      name: 'POS Recepción',
      description: 'Punto de venta para servicios hoteleros',
      icon: Home,
      color: 'purple',
      features: ['Servicios hoteleros', 'Amenidades y extras', 'Lavandería express', 'Tours y actividades'],
      path: '/dashboard/pos/recepcion'
    },
    {
      id: 'restaurante',
      name: 'POS Restaurante',
      description: 'Punto de venta para restaurante y bar',
      icon: UtensilsCrossed,
      color: 'orange',
      features: ['Menús y platos', 'Bebidas y tragos', 'Mesas y comandas', 'Cocina integrada'],
      path: '/dashboard/pos/restaurante'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Sistema de Punto de Venta (POS)
          </h1>
          <h2 className="text-xl text-gray-600 mb-4">
            Selecciona el punto de ventas que deseas utilizar
          </h2>
        </div>
        
        {/* System Information Alert */}
        <div className="mb-8">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Sistema POS integrado con <strong>Caja Chica</strong> - Todas las ventas se registran automáticamente 
              y se pueden gestionar gastos, compras e ingresos desde cualquier punto de venta.
            </AlertDescription>
          </Alert>
        </div>

        {/* Sales History Button */}
        <div className="mb-8 text-center">
          <Link href="/dashboard/pos/sales">
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
            >
              <Receipt className="h-5 w-5 mr-2" />
              Ver Historial de Ventas
            </Button>
          </Link>
        </div>

        {/* Price Update Tool */}
        <div className="mb-8 max-w-2xl mx-auto">
          <POSPriceUpdater />
        </div>

        {/* POS Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {posOptions.map((option) => {
            const Icon = option.icon
            const colors = {
              purple: {
                bg: 'bg-purple-50 hover:bg-purple-100',
                border: 'border-purple-200',
                text: 'text-purple-600',
                badge: 'bg-purple-100 text-purple-700'
              },
              orange: {
                bg: 'bg-orange-50 hover:bg-orange-100',
                border: 'border-orange-200',
                text: 'text-orange-600',
                badge: 'bg-orange-100 text-orange-700'
              }
            }[option.color]

            return (
              <Card key={option.id} className={`${colors?.bg} ${colors?.border} transition-all duration-300 hover:shadow-lg`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-8 w-8 ${colors?.text}`} />
                      <div>
                        <CardTitle className="text-xl">{option.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                      </div>
                    </div>
                    {sessions[option.id] && (
                      <Badge className={colors?.badge}>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Sesión activa
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Características principales:</h4>
                      <ul className="space-y-1">
                        {option.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <CheckCircle2 className={`h-4 w-4 mr-2 ${colors?.text}`} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <Link href={option.path}>
                        <Button 
                          className={`w-full ${colors?.text} bg-white hover:bg-gray-50 border-2 ${colors?.border}`}
                          variant="outline"
                        >
                          Acceder a {option.name}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
} 