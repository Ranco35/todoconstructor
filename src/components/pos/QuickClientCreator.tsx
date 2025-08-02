'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserPlus, Save, X, AlertCircle } from 'lucide-react'
import { createClient } from '@/actions/clients'

interface QuickClientCreatorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientCreated: (clientId: number, clientName: string) => void
  initialRut?: string
  initialName?: string
}

interface QuickClientData {
  tipoCliente: 'PERSONA' | 'EMPRESA'
  nombrePrincipal: string
  apellido: string
  rut: string
  email: string
  telefono: string
  ciudad: string
  region: string
}

export default function QuickClientCreator({ 
  open, 
  onOpenChange, 
  onClientCreated,
  initialRut = '',
  initialName = ''
}: QuickClientCreatorProps) {
  const [formData, setFormData] = useState<QuickClientData>({
    tipoCliente: 'PERSONA',
    nombrePrincipal: initialName,
    apellido: '',
    rut: initialRut,
    email: '',
    telefono: '',
    ciudad: '',
    region: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setFormData({
      tipoCliente: 'PERSONA',
      nombrePrincipal: '',
      apellido: '',
      rut: '',
      email: '',
      telefono: '',
      ciudad: '',
      region: ''
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validación básica
    if (!formData.nombrePrincipal.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    if (formData.tipoCliente === 'PERSONA' && !formData.apellido.trim()) {
      setError('El apellido es obligatorio para personas')
      return
    }

    if (!formData.rut.trim()) {
      setError('El RUT es obligatorio')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createClient({
        tipoCliente: formData.tipoCliente,
        nombrePrincipal: formData.nombrePrincipal,
        apellido: formData.apellido,
        rut: formData.rut,
        email: formData.email,
        telefono: formData.telefono,
        ciudad: formData.ciudad,
        region: formData.region,
        codigoPostal: '',
        fechaNacimiento: null,
        genero: 'OTRO',
        profesion: '',
        comentarios: 'Cliente creado desde POS'
      })

      if (result.success && result.data) {
        const clientName = formData.tipoCliente === 'EMPRESA' 
          ? formData.nombrePrincipal
          : `${formData.nombrePrincipal} ${formData.apellido}`.trim()
        
        onClientCreated(result.data.id, clientName)
        resetForm()
        onOpenChange(false)
      } else {
        setError(result.error || 'Error al crear el cliente')
      }
    } catch (error) {
      console.error('Error creating client:', error)
      setError('Error interno al crear el cliente')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Crear Cliente Rápido
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Tipo de Cliente */}
          <div>
            <Label htmlFor="tipoCliente">Tipo de Cliente *</Label>
            <Select value={formData.tipoCliente} onValueChange={(value: 'PERSONA' | 'EMPRESA') => 
              setFormData(prev => ({ ...prev, tipoCliente: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERSONA">Persona Natural</SelectItem>
                <SelectItem value="EMPRESA">Empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <Label htmlFor="nombrePrincipal">
                {formData.tipoCliente === 'EMPRESA' ? 'Razón Social *' : 'Nombre *'}
              </Label>
              <Input
                id="nombrePrincipal"
                value={formData.nombrePrincipal}
                onChange={(e) => setFormData(prev => ({ ...prev, nombrePrincipal: e.target.value }))}
                placeholder={formData.tipoCliente === 'EMPRESA' ? 'Nombre de la empresa' : 'Nombre'}
                required
              />
            </div>

            {/* Apellido (solo para personas) */}
            {formData.tipoCliente === 'PERSONA' && (
              <div>
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellido: e.target.value }))}
                  placeholder="Apellido"
                  required
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* RUT */}
            <div>
              <Label htmlFor="rut">RUT *</Label>
              <Input
                id="rut"
                value={formData.rut}
                onChange={(e) => setFormData(prev => ({ ...prev, rut: e.target.value }))}
                placeholder="12.345.678-9"
                required
              />
            </div>

            {/* Teléfono */}
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="+56 9 1234 5678"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="cliente@ejemplo.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ciudad */}
            <div>
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input
                id="ciudad"
                value={formData.ciudad}
                onChange={(e) => setFormData(prev => ({ ...prev, ciudad: e.target.value }))}
                placeholder="Ciudad"
              />
            </div>

            {/* Región */}
            <div>
              <Label htmlFor="region">Región</Label>
              <Select value={formData.region} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, region: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar región" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arica y Parinacota">Arica y Parinacota</SelectItem>
                  <SelectItem value="Tarapacá">Tarapacá</SelectItem>
                  <SelectItem value="Antofagasta">Antofagasta</SelectItem>
                  <SelectItem value="Atacama">Atacama</SelectItem>
                  <SelectItem value="Coquimbo">Coquimbo</SelectItem>
                  <SelectItem value="Valparaíso">Valparaíso</SelectItem>
                  <SelectItem value="Metropolitana">Metropolitana</SelectItem>
                  <SelectItem value="O'Higgins">O'Higgins</SelectItem>
                  <SelectItem value="Maule">Maule</SelectItem>
                  <SelectItem value="Ñuble">Ñuble</SelectItem>
                  <SelectItem value="Biobío">Biobío</SelectItem>
                  <SelectItem value="La Araucanía">La Araucanía</SelectItem>
                  <SelectItem value="Los Ríos">Los Ríos</SelectItem>
                  <SelectItem value="Los Lagos">Los Lagos</SelectItem>
                  <SelectItem value="Aysén">Aysén</SelectItem>
                  <SelectItem value="Magallanes">Magallanes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-1" />
              {isSubmitting ? 'Creando...' : 'Crear Cliente'}
            </Button>
          </div>
        </form>

        <div className="text-xs text-gray-500 mt-4">
          * Campos obligatorios
        </div>
      </DialogContent>
    </Dialog>
  )
} 