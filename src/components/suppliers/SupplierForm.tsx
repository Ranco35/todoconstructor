'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Supplier } from '@/types/database';
import { CompanyType, PaymentTerm, SupplierRank, COUNTRIES, CURRENCIES, SUPPLIER_CATEGORIES, PAYMENT_TERM_LABELS, RANK_BADGES } from '@/constants/supplier';
import { SupplierFormData, SupplierTag } from '@/types/supplier';
import { createSupplier, updateSupplier } from '@/actions/suppliers';
import { getSupplierTags, getSupplierTagsBySupplier } from '@/actions/suppliers/tags';
import { getSupplierContacts } from '@/actions/suppliers/contacts/list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import ContactTable from './contacts/ContactTable';

interface SupplierFormProps {
  mode: 'create' | 'edit';
  supplier?: Supplier;
  users?: Array<{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  }>;
}

export default function SupplierForm({ mode, supplier, users = [] }: SupplierFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [tags, setTags] = useState<SupplierTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<SupplierFormData>({
    name: supplier?.name || '',
    displayName: supplier?.displayName || '',
    companyType: supplier?.companyType || CompanyType.SOCIEDAD_ANONIMA,
    internalRef: supplier?.internalRef || '',
    website: supplier?.website || '',
    active: supplier?.active ?? true,
    vat: supplier?.vat || '',
    taxId: supplier?.taxId || '',
    street: supplier?.street || '',
    street2: supplier?.street2 || '',
    city: supplier?.city || '',
    state: supplier?.state || '',
    zipCode: supplier?.zipCode || '',
    countryCode: supplier?.countryCode || 'CL',
    phone: supplier?.phone || '',
    mobile: supplier?.mobile || '',
    fax: supplier?.fax || '',
    email: supplier?.email || '',
    currency: supplier?.currency || 'CLP',
    paymentTerm: supplier?.paymentTerm || PaymentTerm.CREDITO_30,
    customPaymentDays: supplier?.customPaymentDays || undefined,
    creditLimit: supplier?.creditLimit || undefined,
    supplierRank: supplier?.supplierRank || SupplierRank.BASICO,
    rankPoints: supplier?.rankPoints || 0,
    category: supplier?.category || '',
    accountManager: supplier?.accountManager || '',
    purchasingAgent: supplier?.purchasingAgent || '',
    logo: supplier?.logo || '',
    image: supplier?.image || '',
    notes: supplier?.notes || '',
    publicNotes: supplier?.publicNotes || '',
    language: supplier?.language || 'es',
    timezone: supplier?.timezone || 'America/Santiago',
    etiquetas: []
  });

  // Cargar etiquetas disponibles
  useEffect(() => {
    const loadTags = async () => {
      try {
        const result = await getSupplierTags();
        if (result.success) {
          setTags(result.data);
        }
      } catch (error) {
        console.error('Error loading tags:', error);
      }
    };

    loadTags();
  }, []);

  // Cargar etiquetas del proveedor si está en modo edición
  useEffect(() => {
    const loadSupplierTags = async () => {
      if (mode === 'edit' && supplier) {
        try {
          const result = await getSupplierTagsBySupplier(supplier.id);
          if (result.success) {
            const tagIds = result.data.map(assignment => assignment.etiquetaId);
            setSelectedTags(tagIds);
            setFormData(prev => ({
              ...prev,
              etiquetas: tagIds
            }));
          }
        } catch (error) {
          console.error('Error loading supplier tags:', error);
        }
      }
    };

    loadSupplierTags();
  }, [mode, supplier]);

  // Cargar contactos del proveedor si está en modo edición
  useEffect(() => {
    const loadSupplierContacts = async () => {
      if (mode === 'edit' && supplier) {
        try {
          const result = await getSupplierContacts({
            supplierId: supplier.id,
            page: 1,
            limit: 100, // Cargar todos los contactos para el formulario
            filters: {},
            sortBy: 'name',
            sortOrder: 'asc'
          });
          setContacts(result.contacts || []);
        } catch (error) {
          console.error('Error loading supplier contacts:', error);
          setContacts([]); // Fallback a array vacío si hay error
        }
      }
    };

    loadSupplierContacts();
  }, [mode, supplier]);

  const handleInputChange = (field: keyof SupplierFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleTag = (tagId: number) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    
    setSelectedTags(newSelectedTags);
    setFormData(prev => ({
      ...prev,
      etiquetas: newSelectedTags
    }));
  };

  const getAvailableTags = () => {
    return tags;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Convertir SupplierFormData a FormData
      const formDataObj = new FormData();
      
      // Mapeo de campos numéricos que necesitan conversión especial
      const numericFields = [
        'creditLimit', 'rankPoints', 'customPaymentDays',
        'accountManager', 'purchasingAgent'
      ];
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        
        // Manejar campos especiales
        if (key === 'etiquetas') {
          formDataObj.append(key, JSON.stringify(value));
          return;
        }
        
        // Manejar campos numéricos
        if (numericFields.includes(key) && value !== '') {
          formDataObj.append(key, value.toString());
          return;
        }
        
        // Para el resto de campos, convertir a string solo si tiene valor
        if (value !== '') {
          formDataObj.append(key, value.toString());
        }
      });

      if (mode === 'create') {
        const result = await createSupplier(formDataObj);
        if (result.success) {
          toast.success('Proveedor creado exitosamente');
          router.push('/dashboard/suppliers');
        } else {
          throw new Error(result.error || 'Error al crear el proveedor');
        }
      } else if (supplier) {
        const result = await updateSupplier(supplier.id, formDataObj);
        if (result.success) {
          toast.success('Proveedor actualizado exitosamente');
          router.push(`/dashboard/suppliers/${supplier.id}`);
          router.refresh(); // Forzar recarga de la página
        } else {
          throw new Error(result.error || 'Error al actualizar el proveedor');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error al guardar el proveedor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className={`grid w-full ${formData.companyType === CompanyType.SOCIEDAD_ANONIMA ? 'grid-cols-7' : 'grid-cols-6'}`}>
          <TabsTrigger value="basic">📋 Básica</TabsTrigger>
          <TabsTrigger value="address">📍 Dirección</TabsTrigger>
          <TabsTrigger value="contact">📞 Contacto</TabsTrigger>
          {formData.companyType === CompanyType.SOCIEDAD_ANONIMA && (
            <TabsTrigger value="contacts">👥 Contactos</TabsTrigger>
          )}
          <TabsTrigger value="commercial">💰 Comercial</TabsTrigger>
          <TabsTrigger value="tags">🏷️ Etiquetas</TabsTrigger>
          <TabsTrigger value="advanced">⚙️ Avanzado</TabsTrigger>
        </TabsList>

        {/* Información Básica */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Legal *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                    placeholder="Nombre de la empresa o persona"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nombre Comercial</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('displayName', e.target.value)}
                    placeholder="Nombre comercial (opcional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyType">Tipo de Empresa</Label>
                  <Select
                    value={formData.companyType}
                    onValueChange={(value: string) => handleInputChange('companyType', value as CompanyType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CompanyType.SOCIEDAD_ANONIMA}>🏢 Empresa</SelectItem>
                      <SelectItem value={CompanyType.EMPRESA_INDIVIDUAL}>👤 Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vat">RUT/VAT</Label>
                  <Input
                    id="vat"
                    value={formData.vat}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('vat', e.target.value)}
                    placeholder="12.345.678-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="internalRef">Ref. Interna</Label>
                  <Input
                    id="internalRef"
                    value={formData.internalRef}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('internalRef', e.target.value)}
                    placeholder="PROV-001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Sitio Web</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('website', e.target.value)}
                  placeholder="https://www.ejemplo.com"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked: boolean) => handleInputChange('active', checked)}
                />
                <Label htmlFor="active">Proveedor Activo</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dirección */}
        <TabsContent value="address" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dirección</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Calle</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('street', e.target.value)}
                  placeholder="Calle Principal 123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="street2">Calle 2</Label>
                <Input
                  id="street2"
                  value={formData.street2}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('street2', e.target.value)}
                  placeholder="Oficina 456"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('city', e.target.value)}
                    placeholder="Santiago"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado/Región</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('state', e.target.value)}
                    placeholder="Región Metropolitana"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Código Postal</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('zipCode', e.target.value)}
                    placeholder="8320000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="countryCode">País</Label>
                <Select
                  value={formData.countryCode}
                  onValueChange={(value: string) => handleInputChange('countryCode', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(country => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacto */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phone', e.target.value)}
                    placeholder="+56 2 2345 6789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Móvil</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('mobile', e.target.value)}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                    placeholder="contacto@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fax">Fax</Label>
                  <Input
                    id="fax"
                    value={formData.fax}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('fax', e.target.value)}
                    placeholder="+56 2 2345 6790"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contactos de Empresa */}
        {formData.companyType === CompanyType.SOCIEDAD_ANONIMA && (
          <TabsContent value="contacts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  👥 Contactos de la Empresa
                  <Badge variant="outline">Solo para empresas</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mode === 'edit' && supplier ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 mb-4">
                      Gestiona los contactos de la empresa. Puedes agregar múltiples contactos para diferentes departamentos.
                    </div>
                    <ContactTable 
                      supplierId={supplier.id} 
                      contacts={contacts} 
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-lg mb-2">👥</div>
                    <p className="text-sm">
                      Los contactos de la empresa se pueden gestionar después de crear el proveedor
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Comercial */}
        <TabsContent value="commercial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Comercial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value: string) => handleInputChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentTerm">Condiciones de Pago</Label>
                  <Select
                    value={formData.paymentTerm}
                    onValueChange={(value: string) => handleInputChange('paymentTerm', value as PaymentTerm)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_TERM_LABELS).map(([term, config]) => (
                        <SelectItem key={term} value={term}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="creditLimit">Límite de Crédito</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    value={formData.creditLimit || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('creditLimit', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customPaymentDays">Días Personalizados</Label>
                  <Input
                    id="customPaymentDays"
                    type="number"
                    value={formData.customPaymentDays || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('customPaymentDays', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="flex items-center gap-2">
                    🏷️ Categoría
                  </Label>
                  <Select
                    value={formData.category || "none"}
                    onValueChange={(value: string) => handleInputChange('category', value === "none" ? "" : value)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 bg-white">
                      <SelectItem value="none">
                        <div className="flex items-center gap-2 text-gray-500">
                          <span>📂</span>
                          <span>Sin categoría</span>
                        </div>
                      </SelectItem>
                      {SUPPLIER_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {category === 'Part-Time' && '👥'}
                              {category === 'Hotelería' && '🏨'}
                              {category === 'Limpieza' && '🧹'}
                              {category === 'Mantenimiento' && '🔧'}
                              {category === 'Restaurante' && '🍽️'}
                              {category === 'Seguridad' && '🔒'}
                              {category === 'Transporte' && '🚗'}
                              {category === 'Lácteos' && '🥛'}
                              {category === 'Servicios Básicos' && '⚡'}
                              {category === 'Bebidas' && '🥤'}
                              {category === 'Carnes' && '🥩'}
                              {category === 'Verduras' && '🥬'}
                              {category === 'Panadería' && '🥖'}
                              {category === 'Pescados' && '🐟'}
                              {category === 'Tecnología' && '💻'}
                              {category === 'Alimentación' && '🍎'}
                              {category === 'Otros' && '📦'}
                            </span>
                            <span className="font-medium">{category}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierRank" className="flex items-center gap-2">
                    ⭐ Calidad de Servicio
                  </Label>
                  <Select
                    value={formData.supplierRank}
                    onValueChange={(value: string) => handleInputChange('supplierRank', value as SupplierRank)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Seleccionar calidad" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 bg-white">
                      {Object.entries(RANK_BADGES).filter(([rank]) => rank !== 'PART_TIME').map(([rank, config]) => (
                        <SelectItem key={rank} value={rank}>
                          <div className="flex items-center gap-2">
                            <Badge className={`${config.color} text-xs`}>
                              {config.label}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {rank === 'BASICO' && 'Calidad mínima (1-10 puntos)'}
                              {rank === 'REGULAR' && 'Calidad aceptable (11-50 puntos)'}
                              {rank === 'BUENO' && 'Calidad confiable (51-100 puntos)'}
                              {rank === 'EXCELENTE' && 'Máxima calidad (100+ puntos)'}
                              {rank === 'PREMIUM' && 'Proveedor premium'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rankPoints" className="flex items-center gap-2">
                  🎯 Puntos de Tipo
                </Label>
                <div className="relative">
                  <Input
                    id="rankPoints"
                    type="number"
                    min="0"
                    max="1000"
                    value={formData.rankPoints}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('rankPoints', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="h-11 pl-10"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">📊</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Puntos para determinar el nivel del proveedor (0-1000)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Etiquetas */}
        <TabsContent value="tags" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Etiquetas del Proveedor</CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecciona las etiquetas que mejor describan al proveedor
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {getAvailableTags().map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedTags.includes(tag.id)
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                    }`}
                    style={{
                      backgroundColor: selectedTags.includes(tag.id) ? tag.color + '20' : undefined,
                      borderColor: selectedTags.includes(tag.id) ? tag.color : undefined,
                      color: selectedTags.includes(tag.id) ? tag.color : undefined
                    }}
                  >
                    {tag.nombre}
                  </button>
                ))}
              </div>
              
              {selectedTags.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Etiquetas seleccionadas:</strong> {selectedTags.length}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Avanzado */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Avanzada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountManager">Gerente de Cuenta</Label>
                  <Select
                    value={formData.accountManager}
                    onValueChange={(value: string) => handleInputChange('accountManager', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchasingAgent">Agente de Compras</Label>
                  <Select
                    value={formData.purchasingAgent}
                    onValueChange={(value: string) => handleInputChange('purchasingAgent', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input
                    id="logo"
                    value={formData.logo}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('logo', e.target.value)}
                    placeholder="https://ejemplo.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Imagen URL</Label>
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('image', e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas Privadas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('notes', e.target.value)}
                  placeholder="Notas internas sobre el proveedor..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publicNotes">Notas Públicas</Label>
                <Textarea
                  id="publicNotes"
                  value={formData.publicNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('publicNotes', e.target.value)}
                  placeholder="Notas visibles para el proveedor..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value: string) => handleInputChange('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">🇪🇸 Español</SelectItem>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                      <SelectItem value="pt">🇧🇷 Português</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value: string) => handleInputChange('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Santiago">🇨🇱 Chile (GMT-3)</SelectItem>
                      <SelectItem value="America/New_York">🇺🇸 Eastern (GMT-5)</SelectItem>
                      <SelectItem value="America/Los_Angeles">🇺🇸 Pacific (GMT-8)</SelectItem>
                      <SelectItem value="Europe/Madrid">🇪🇸 Madrid (GMT+1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : mode === 'create' ? 'Crear Proveedor' : 'Actualizar Proveedor'}
        </Button>
      </div>
    </form>
  );
} 