'use client';

import { useState, useEffect } from 'react';
import { createPurchaseInvoice, createPurchaseInvoiceLines } from '@/actions/purchases/purchase-invoices';
import { getSuppliersForForms } from '@/actions/purchases/common';

export default function DebugInvoicesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const suppliersList = await getSuppliersForForms();
      setSuppliers(suppliersList);
      console.log('✅ Proveedores cargados:', suppliersList);
    } catch (error) {
      console.error('❌ Error cargando proveedores:', error);
    }
  };

  const testCreateInvoice = async () => {
    setLoading(true);
    try {
      console.log('🧪 Probando creación de factura...');
      
      if (suppliers.length === 0) {
        throw new Error('No hay proveedores disponibles');
      }
      
      const testData = {
        invoice_number: `TEST-${Date.now()}`,
        supplier_id: suppliers[0].id, // Usar el primer proveedor disponible
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal: 10000,
        tax_amount: 1900,
        total_amount: 11900,
        status: 'draft',
        notes: `Factura de prueba creada desde debug para ${suppliers[0].name}`
      };
      
      const invoiceResult = await createPurchaseInvoice(testData);
      console.log('📄 Resultado creación factura:', invoiceResult);
      
      if (invoiceResult.success) {
        // Probar también la creación de líneas
        const testLines = [
          {
            tempId: 'test-1',
            productId: 1,
            productName: 'Producto de prueba',
            description: 'Descripción de prueba',
            quantity: 2,
            unitPriceNet: 5000,
            discountPercent: 0,
            subtotalNet: 10000,
            ivaPercent: 19,
            ivaAmount: 1900,
            totalLine: 11900,
            receivedQuantity: 0
          }
        ];
        
        const linesResult = await createPurchaseInvoiceLines(invoiceResult.data.id, testLines);
        console.log('📋 Resultado creación líneas:', linesResult);
        
        setResult({
          invoice: invoiceResult,
          lines: linesResult
        });
      } else {
        setResult({ error: invoiceResult.error });
      }
      
    } catch (error) {
      console.error('❌ Error en prueba:', error);
      setResult({ error: error instanceof Error ? error.message : 'Error desconocido' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug - Facturas de Compra</h1>
      
      <div className="space-y-4">
        <button
          onClick={testCreateInvoice}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Probando...' : 'Probar Creación de Factura'}
        </button>
        
        {result && (
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-bold mb-2">Resultado:</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Proveedores Disponibles:</h2>
          <div className="bg-white p-3 rounded border text-sm">
            {suppliers.length > 0 ? (
              <ul className="space-y-1">
                {suppliers.map((supplier, index) => (
                  <li key={supplier.id} className={index === 0 ? 'font-bold text-blue-600' : ''}>
                    {supplier.id}: {supplier.name} {index === 0 && '(se usará para la prueba)'}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Cargando proveedores...</p>
            )}
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Instrucciones:</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Haz clic en "Probar Creación de Factura"</li>
            <li>Revisa la consola del navegador para logs detallados</li>
            <li>Si hay errores, aparecerán en el resultado</li>
            <li>Ve a /dashboard/purchases/invoices para verificar si aparece la factura</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 