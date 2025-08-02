'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function TestProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('harina')

  const searchProducts = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('Product')
        .select('id, name, sku, saleprice, description')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .limit(20)

      if (error) {
        console.error('Error:', error)
        return
      }

      setProducts(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    searchProducts()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test de Productos</h1>
      
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar productos..."
          className="border p-2 rounded"
        />
        <button
          onClick={searchProducts}
          className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Buscar
        </button>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div>
          <h2 className="text-lg font-semibold mb-2">
            Productos encontrados ({products.length}):
          </h2>
          <div className="space-y-2">
            {products.map((product) => (
              <div key={product.id} className="border p-3 rounded">
                <p><strong>ID:</strong> {product.id}</p>
                <p><strong>Nombre:</strong> {product.name}</p>
                <p><strong>SKU:</strong> {product.sku}</p>
                <p><strong>Precio:</strong> ${product.saleprice}</p>
                <p><strong>Descripción:</strong> {product.description || 'Sin descripción'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 