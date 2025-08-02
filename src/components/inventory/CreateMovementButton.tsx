'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Package } from 'lucide-react'
import Link from 'next/link'

export default function CreateMovementButton() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/dashboard/inventory/movements/transfer">
        <Button variant="outline" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Transferencia
        </Button>
      </Link>
      
      <Link href="/dashboard/inventory/movements/entry">
        <Button variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Entrada
        </Button>
      </Link>
      
      <Link href="/dashboard/inventory/movements/exit">
        <Button variant="outline" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Salida
        </Button>
      </Link>
    </div>
  )
} 