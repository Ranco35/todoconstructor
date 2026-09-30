/**
 * Precio de venta y cotización para el MCP de la ferretería (recepción cotiza
 * por chat). Puro, sin base de datos: tests en __tests__/cotizacion-ferreteria.test.ts.
 *
 * Precio con IVA = el mismo que cobra el POS: `finalPrice` (precio final
 * congelado) si existe; si no, `saleprice` (neto) × (1 + IVA). La promoción
 * activa se aplica sobre ese precio con las mismas reglas que la web
 * (src/lib/promotions-utils.ts).
 */

import { calculatePromotionPrice, findBestPromotionForProduct, type ActivePromotion } from './promotions-utils'

export interface ProductoPrecio {
  id: number
  saleprice: number | null
  finalPrice: number | null
  vat: number | null
  categoryid: number | null
  supplierid: number | null
}

export interface PrecioVenta {
  /** Precio unitario con IVA antes de promoción. */
  precio_con_iva: number
  /** Precio unitario con IVA que se cobra (con promoción si hay). */
  precio_final: number
  iva_pct: number
  promocion: { nombre: string; ahorro: number } | null
  /** false si el producto no tiene precio de venta cargado: no se puede cotizar. */
  tiene_precio: boolean
}

export function precioVenta(p: ProductoPrecio, promociones: ActivePromotion[] = []): PrecioVenta {
  const iva_pct = p.vat ?? 19
  const precio_con_iva = p.finalPrice && p.finalPrice > 0
    ? Math.round(p.finalPrice)
    : Math.round((p.saleprice || 0) * (1 + iva_pct / 100))
  if (precio_con_iva <= 0) return { precio_con_iva: 0, precio_final: 0, iva_pct, promocion: null, tiene_precio: false }

  const promo = findBestPromotionForProduct(p.id, p.categoryid, p.supplierid, promociones)
  const conPromo = promo ? Math.round(calculatePromotionPrice(precio_con_iva, promo)) : precio_con_iva
  // Solo se informa como promoción si baja el precio: un recargo no se vende como oferta.
  const promocion = promo && conPromo < precio_con_iva ? { nombre: promo.name, ahorro: precio_con_iva - conPromo } : null
  return { precio_con_iva, precio_final: promocion ? conPromo : precio_con_iva, iva_pct, promocion, tiene_precio: true }
}

export interface LineaCotizacion {
  producto_id: number
  nombre: string
  cantidad: number
  precio: PrecioVenta
  stock_total: number
}

export interface Cotizacion {
  lineas: Array<{
    producto_id: number
    nombre: string
    cantidad: number
    precio_unitario: number
    precio_unitario_sin_promo: number
    promocion: string | null
    subtotal: number
    stock_total: number
    alcanza_stock: boolean
  }>
  total: number
  neto: number
  iva: number
  sin_precio: string[]
  sin_stock_suficiente: string[]
}

/** Arma la cotización con IVA incluido. El neto y el IVA se desglosan por línea según su tasa. */
export function cotizar(lineas: LineaCotizacion[]): Cotizacion {
  const conPrecio = lineas.filter((l) => l.precio.tiene_precio)
  const filas = conPrecio.map((l) => ({
    producto_id: l.producto_id,
    nombre: l.nombre,
    cantidad: l.cantidad,
    precio_unitario: l.precio.precio_final,
    precio_unitario_sin_promo: l.precio.precio_con_iva,
    promocion: l.precio.promocion?.nombre ?? null,
    subtotal: Math.round(l.precio.precio_final * l.cantidad),
    stock_total: l.stock_total,
    alcanza_stock: l.stock_total >= l.cantidad,
  }))
  const total = filas.reduce((s, f) => s + f.subtotal, 0)
  const neto = conPrecio.reduce((s, l, i) => s + Math.round(filas[i].subtotal / (1 + l.precio.iva_pct / 100)), 0)
  return {
    lineas: filas,
    total,
    neto,
    iva: total - neto,
    sin_precio: lineas.filter((l) => !l.precio.tiene_precio).map((l) => l.nombre),
    sin_stock_suficiente: filas.filter((f) => !f.alcanza_stock).map((f) => `${f.nombre}: pide ${f.cantidad}, hay ${f.stock_total}`),
  }
}
