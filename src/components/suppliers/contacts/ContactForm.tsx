'use client';

import { useState } from 'react';
import { ContactType } from '@/types/database';
import { createSupplierContact, updateSupplierContact } from '@/actions/suppliers/contacts';
import { CONTACT_TYPES } from '@/constants/supplier';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import CustomSwitch from '@/components/ui/custom-switch';
import { Phone, Mail, User, Star, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ContactFormProps {
  supplierId: number;
  contact?: {
    id: number;
    name: string;
    position?: string | null;
    type: ContactType;
    email?: string | null;
    phone?: string | null;
    mobile?: string | null;
    notes?: string | null;
    isPrimary: boolean;
    active: boolean;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ContactForm({ supplierId, contact, onSuccess, onCancel }: ContactFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    position: contact?.position || '',
    type: contact?.type || 'PRINCIPAL',
    email: contact?.email || '',
    phone: contact?.phone || '',
    mobile: contact?.mobile || '',
    notes: contact?.notes || '',
    isPrimary: contact?.isPrimary || false,
    active: contact?.active ?? true
  });

  const isEditing = !!contact;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        form.append(key, value.toString());
      });

      if (isEditing) {
        await updateSupplierContact(contact.id, form);
        toast.success('Contacto actualizado correctamente');
      } else {
        await createSupplierContact(supplierId, form);
        toast.success('Contacto creado correctamente');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar el contacto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <User className="h-6 w-6 text-purple-600" />
          </div>
          {isEditing ? 'Editar Contacto' : 'Nuevo Contacto'}
        </h2>
        <p className="text-gray-600 mt-2">
          {isEditing ? 'Modifica la información del contacto' : 'Agrega un nuevo contacto al proveedor'}
        </p>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
              <User className="h-5 w-5 text-purple-600" />
              Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Nombre completo *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                  placeholder="Ej: Juan Pérez González"
                  required
                  disabled={isLoading}
                  className={`transition-all duration-200 ${
                    formData.name.trim() ? 'border-green-300 bg-green-50/30' : 'border-gray-300'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {!formData.name.trim() && (
                  <p className="text-xs text-gray-500">Este campo es obligatorio</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="text-sm font-medium text-gray-700">
                  Cargo o Posición
                </Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('position', e.target.value)}
                  placeholder="Ej: Gerente de Ventas"
                  disabled={isLoading}
                  className={`transition-all duration-200 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
              <Star className="h-5 w-5 text-purple-600" />
              Tipo de Contacto
            </h3>
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                Selecciona el tipo de contacto
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: string) => handleInputChange('type', value)}
                disabled={isLoading}
              >
                <SelectTrigger className={`transition-all duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {CONTACT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {type.icon}
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Información de contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
              <Phone className="h-5 w-5 text-purple-600" />
              Información de Contacto
            </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-purple-600" />
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                  placeholder="juan.perez@empresa.com"
                  disabled={isLoading}
                  className={`transition-all duration-200 ${
                    formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) 
                      ? 'border-red-300 bg-red-50/30' 
                      : formData.email.trim() 
                        ? 'border-green-300 bg-green-50/30' 
                        : 'border-gray-300'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                  <p className="text-xs text-red-500">Ingresa un email válido</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-purple-600" />
                  Teléfono fijo
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phone', e.target.value)}
                  placeholder="+56 2 2345 6789"
                  disabled={isLoading}
                  className={`transition-all duration-200 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone className="h-4 w-4 text-purple-600" />
                Teléfono móvil
              </Label>
              <Input
                id="mobile"
                value={formData.mobile}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('mobile', e.target.value)}
                placeholder="+56 9 8765 4321"
                disabled={isLoading}
                className={`transition-all duration-200 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>

          {/* Notas adicionales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
              <Mail className="h-5 w-5 text-purple-600" />
              Información Adicional
            </h3>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                Notas y comentarios
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('notes', e.target.value)}
                placeholder="Información adicional sobre el contacto, horarios de atención, preferencias de comunicación, etc..."
                rows={3}
                disabled={isLoading}
                className={`transition-all duration-200 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>

          {/* Configuración del Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
              <Star className="h-5 w-5 text-purple-600" />
              Configuración del Contacto
            </h3>
            
            <div className="space-y-6">
              <div className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${
                formData.isPrimary 
                  ? 'bg-amber-50 border-amber-300 shadow-md' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    formData.isPrimary ? 'bg-amber-100' : 'bg-gray-100'
                  }`}>
                    <Star className={`h-5 w-5 transition-all duration-300 ${
                      formData.isPrimary ? 'text-amber-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-900">
                      Contacto principal
                    </Label>
                    <p className={`text-sm transition-all duration-300 ${
                      formData.isPrimary ? 'text-amber-700' : 'text-gray-500'
                    }`}>
                      {formData.isPrimary 
                        ? 'Este es el contacto de referencia para el proveedor' 
                        : 'Marcar como contacto de referencia para el proveedor'
                      }
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <CustomSwitch
                    checked={formData.isPrimary}
                    onCheckedChange={(checked: boolean) => handleInputChange('isPrimary', checked)}
                    disabled={isLoading}
                    activeColor="amber"
                    size="md"
                  />
                  {formData.isPrimary && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white animate-pulse"></div>
                  )}
                </div>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${
                formData.active 
                  ? 'bg-green-50 border-green-300 shadow-md' 
                  : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    formData.active ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {formData.active ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-900">
                      Contacto activo
                    </Label>
                    <p className={`text-sm transition-all duration-300 ${
                      formData.active ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {formData.active 
                        ? 'El contacto está disponible y activo' 
                        : 'El contacto está desactivado'
                      }
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <CustomSwitch
                    checked={formData.active}
                    onCheckedChange={(checked: boolean) => handleInputChange('active', checked)}
                    disabled={isLoading}
                    activeColor="green"
                    size="md"
                  />
                  {formData.active && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                  )}
                  {!formData.active && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full border-2 border-white"></div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="px-6 py-2.5 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  Procesando...
                </div>
              ) : (
                'Cancelar'
              )}
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.name.trim()}
              className={`px-6 py-2.5 font-semibold transition-all duration-200 ${
                isLoading || !formData.name.trim()
                  ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-50' 
                  : 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg transform hover:scale-[1.02]'
              } text-white border-0`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {isEditing ? 'Actualizar' : 'Crear'} Contacto
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 