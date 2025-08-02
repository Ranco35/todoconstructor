'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { UserPlus, AlertTriangle } from 'lucide-react'
import ClientSelector from '@/components/clients/ClientSelector'
import QuickClientCreator from './QuickClientCreator'

interface ClientSelectorWithCreateProps {
  value: number | undefined
  onValueChange: (clientId: number | undefined, clientName?: string) => void
  className?: string
  required?: boolean
  showRequiredIndicator?: boolean
  label?: string
}

export default function ClientSelectorWithCreate({
  value,
  onValueChange,
  className,
  required = false,
  showRequiredIndicator = false,
  label = "Cliente"
}: ClientSelectorWithCreateProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleClientCreated = (clientId: number, clientName: string) => {
    onValueChange(clientId, clientName)
    setShowCreateModal(false)
  }

  const handleClientChange = (clientId: number | undefined) => {
    onValueChange(clientId)
  }

  return (
    <div className="space-y-2">
      {/* Label con indicador obligatorio */}
      <Label className="text-xs font-medium text-gray-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
        {required && <span className="text-xs text-red-500">(obligatorio)</span>}
      </Label>

      {/* Indicador de requerido */}
      {showRequiredIndicator && !value && (
        <Alert variant="destructive" className="mb-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Cliente obligatorio:</strong> Debe seleccionar un cliente antes de procesar la venta.
          </AlertDescription>
        </Alert>
      )}

      {/* Selector de cliente */}
      <div className="space-y-2">
        <ClientSelector
          value={value}
          onValueChange={handleClientChange}
          placeholder={required ? "Buscar cliente (obligatorio)..." : "Buscar o seleccionar cliente..."}
          className={`${className} ${required && !value ? 'border-red-300 focus:border-red-500' : ''}`}
        />

        {/* Mensaje de ayuda cuando no hay cliente seleccionado */}
        {required && !value && (
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-200">
            💡 Si no encuentra el cliente, puede crear uno nuevo usando el botón de abajo
          </div>
        )}

        {/* Botón para crear cliente directo */}
        <div className="flex justify-start">
          <Button 
            type="button"
            variant="outline" 
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Crear Cliente Nuevo
          </Button>
        </div>
      </div>

      {/* Modal de creación rápida */}
      <QuickClientCreator
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onClientCreated={handleClientCreated}
      />
    </div>
  )
} 