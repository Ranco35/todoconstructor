'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Search } from 'lucide-react'
import { getProducts } from '@/actions/products/list'

interface ProductFilterSearchProps {
  placeholder?: string
  initialValue?: number
  onSelect: (product: { id: number; name: string; sku?: string } | null) => void
}

export default function ProductFilterSearch({ placeholder = 'Buscar producto...', initialValue, onSelect }: ProductFilterSearchProps) {
  const [term, setTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Array<{ id: number; name: string; sku?: string }>>([])
  const [selected, setSelected] = useState<{ id: number; name: string; sku?: string } | null>(null)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<any>(null)

  // Cargar producto inicial si viene en URL
  useEffect(() => {
    async function loadInitial() {
      if (initialValue) {
        const { products } = await getProducts({ page: 1, pageSize: 1, search: '', warehouseId: undefined })
        const found = products?.find(p => p.id === initialValue)
        if (found) {
          setSelected({ id: found.id, name: found.name, sku: (found as any).sku })
        }
      }
    }
    loadInitial()
  }, [initialValue])

  const handleChange = (value: string) => {
    setTerm(value)
    setOpen(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (value.trim().length < 2) {
        setResults([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const { products } = await getProducts({ page: 1, pageSize: 20, search: value })
        setResults((products || []).map(p => ({ id: p.id, name: p.name, sku: (p as any).sku })))
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  const handleSelect = (p: { id: number; name: string; sku?: string }) => {
    setSelected(p)
    setResults([])
    setTerm('')
    setOpen(false)
    onSelect(p)
  }

  const clearSelection = () => {
    setSelected(null)
    onSelect(null)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={term}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            className="pl-9"
          />
        </div>
        {selected && (
          <Badge variant="secondary" className="whitespace-nowrap">
            {selected.name}
            <button className="ml-2" onClick={clearSelection}>✕</button>
          </Badge>
        )}
      </div>

      {open && (results.length > 0 || loading) && (
        <Card className="absolute z-20 mt-2 w-full max-h-64 overflow-auto p-2">
          {loading ? (
            <div className="p-3 text-sm text-gray-600">Buscando...</div>
          ) : (
            results.map(r => (
              <button
                key={r.id}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-50"
                onClick={() => handleSelect(r)}
              >
                <div className="font-medium text-gray-900">{r.name}</div>
                <div className="text-xs text-gray-500">SKU: {r.sku}</div>
              </button>
            ))
          )}
          {!loading && results.length === 0 && (
            <div className="p-3 text-sm text-gray-600">No se encontraron productos</div>
          )}
        </Card>
      )}
    </div>
  )
}


