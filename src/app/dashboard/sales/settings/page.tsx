'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  FileText, 
  DollarSign, 
  Percent, 
  ArrowLeft,
  Save,
  RefreshCw,
  Building,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import Link from 'next/link';

interface SalesSettings {
  defaultCurrency: string;
  defaultTaxRate: number;
  invoicePrefix: string;
  budgetPrefix: string;
  paymentTerms: string;
  termsAndConditions: string;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
  autoNumbering: {
    enabled: boolean;
    format: string;
    startNumber: number;
  };
}

const SalesSettingsPage = () => {
  const [settings, setSettings] = useState<SalesSettings>({
    defaultCurrency: 'CLP',
    defaultTaxRate: 19,
    invoicePrefix: 'FAC',
    budgetPrefix: 'PRE',
    paymentTerms: '30 días',
    termsAndConditions: 'Términos y condiciones por defecto...',
    companyInfo: {
      name: 'Hotel Admintermas',
      address: 'Dirección del hotel',
      phone: '+56 9 1234 5678',
      email: 'info@admintermas.cl',
      website: 'www.admintermas.cl'
    },
    autoNumbering: {
      enabled: true,
      format: '{PREFIX}-{YEAR}-{NUMBER}',
      startNumber: 1
    }
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      // TODO: Implementar guardado en base de datos
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular guardado
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error guardando configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
      setSettings({
        defaultCurrency: 'CLP',
        defaultTaxRate: 19,
        invoicePrefix: 'FAC',
        budgetPrefix: 'PRE',
        paymentTerms: '30 días',
        termsAndConditions: 'Términos y condiciones por defecto...',
        companyInfo: {
          name: 'Hotel Admintermas',
          address: 'Dirección del hotel',
          phone: '+56 9 1234 5678',
          email: 'info@admintermas.cl',
          website: 'www.admintermas.cl'
        },
        autoNumbering: {
          enabled: true,
          format: '{PREFIX}-{YEAR}-{NUMBER}',
          startNumber: 1
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/sales">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">⚙️ Configuración de Ventas</h1>
              <p className="text-gray-600">Configuración general del módulo de ventas</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={handleReset} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Restaurar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>

        {saved && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">✅ Configuración guardada exitosamente</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Configuración General */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configuración General</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="currency">Moneda por Defecto</Label>
                  <select
                    id="currency"
                    value={settings.defaultCurrency}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultCurrency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CLP">Peso Chileno (CLP)</option>
                    <option value="USD">Dólar Estadounidense (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="taxRate">Tasa de Impuesto (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={settings.defaultTaxRate}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultTaxRate: Number(e.target.value) }))}
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="invoicePrefix">Prefijo Facturas</Label>
                  <Input
                    id="invoicePrefix"
                    value={settings.invoicePrefix}
                    onChange={(e) => setSettings(prev => ({ ...prev, invoicePrefix: e.target.value }))}
                    placeholder="FAC"
                  />
                </div>
                
                <div>
                  <Label htmlFor="budgetPrefix">Prefijo Presupuestos</Label>
                  <Input
                    id="budgetPrefix"
                    value={settings.budgetPrefix}
                    onChange={(e) => setSettings(prev => ({ ...prev, budgetPrefix: e.target.value }))}
                    placeholder="PRE"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="paymentTerms">Términos de Pago</Label>
                <Input
                  id="paymentTerms"
                  value={settings.paymentTerms}
                  onChange={(e) => setSettings(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  placeholder="30 días"
                />
              </div>
            </CardContent>
          </Card>

          {/* Información de la Empresa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Información de la Empresa</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="companyName">Nombre de la Empresa</Label>
                <Input
                  id="companyName"
                  value={settings.companyInfo.name}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    companyInfo: { ...prev.companyInfo, name: e.target.value }
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="companyAddress">Dirección</Label>
                <Textarea
                  id="companyAddress"
                  value={settings.companyInfo.address}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    companyInfo: { ...prev.companyInfo, address: e.target.value }
                  }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="companyPhone">Teléfono</Label>
                  <Input
                    id="companyPhone"
                    value={settings.companyInfo.phone}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      companyInfo: { ...prev.companyInfo, phone: e.target.value }
                    }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="companyEmail">Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={settings.companyInfo.email}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      companyInfo: { ...prev.companyInfo, email: e.target.value }
                    }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="companyWebsite">Sitio Web</Label>
                  <Input
                    id="companyWebsite"
                    value={settings.companyInfo.website}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      companyInfo: { ...prev.companyInfo, website: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Numeración Automática */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Numeración Automática</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoNumbering"
                  checked={settings.autoNumbering.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    autoNumbering: { ...prev.autoNumbering, enabled: checked }
                  }))}
                />
                <Label htmlFor="autoNumbering">Habilitar numeración automática</Label>
              </div>

              {settings.autoNumbering.enabled && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="numberFormat">Formato de Numeración</Label>
                    <Input
                      id="numberFormat"
                      value={settings.autoNumbering.format}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        autoNumbering: { ...prev.autoNumbering, format: e.target.value }
                      }))}
                      placeholder="{PREFIX}-{YEAR}-{NUMBER}"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Variables disponibles: {'{PREFIX}'}, {'{YEAR}'}, {'{MONTH}'}, {'{NUMBER}'}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="startNumber">Número de Inicio</Label>
                    <Input
                      id="startNumber"
                      type="number"
                      value={settings.autoNumbering.startNumber}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        autoNumbering: { ...prev.autoNumbering, startNumber: Number(e.target.value) }
                      }))}
                      min="1"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Términos y Condiciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Términos y Condiciones</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="terms">Términos y Condiciones por Defecto</Label>
                <Textarea
                  id="terms"
                  value={settings.termsAndConditions}
                  onChange={(e) => setSettings(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                  rows={8}
                  placeholder="Ingresa los términos y condiciones por defecto..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Vista Previa */}
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa de Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="text-center mb-4">
                  <h3 className="font-bold text-lg">{settings.companyInfo.name}</h3>
                  <p className="text-sm text-gray-600">{settings.companyInfo.address}</p>
                  <p className="text-sm text-gray-600">
                    {settings.companyInfo.phone} | {settings.companyInfo.email}
                  </p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <p><strong>Número:</strong> {settings.invoicePrefix}-2024-001</p>
                  <p><strong>Moneda:</strong> {settings.defaultCurrency}</p>
                  <p><strong>Impuesto:</strong> {settings.defaultTaxRate}%</p>
                  <p><strong>Términos:</strong> {settings.paymentTerms}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalesSettingsPage; 