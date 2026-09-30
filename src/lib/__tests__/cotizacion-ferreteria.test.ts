/**
 * Tests del precio de venta y la cotización del MCP de la ferretería.
 * Run: npx tsx src/lib/__tests__/cotizacion-ferreteria.test.ts
 */
import assert from 'node:assert/strict'
import { cotizar, precioVenta, type ProductoPrecio } from '../cotizacion-ferreteria'
import type { ActivePromotion } from '../promotions-utils'

let passed = 0
let failed = 0
function test(name: string, fn: () => void): void {
  try { fn(); console.log(`✓ ${name}`); passed++ }
  catch (e) { console.error(`✗ ${name}`); console.error(e instanceof Error ? e.message : String(e)); failed++ }
}

const prod = (over: Partial<ProductoPrecio> = {}): ProductoPrecio =>
  ({ id: 1, saleprice: 10000, finalPrice: null, vat: 19, categoryid: 5, supplierid: 9, ...over })
const promo = (over: Partial<ActivePromotion>): ActivePromotion => ({
  id: 1, name: 'Promo', promotionType: 'discount_percentage', value: 10, appliesTo: 'all_products',
  targetIds: [], startDate: '2026-01-01', endDate: '2026-12-31', priority: 1, ...over,
})

test('sin precio final, neto × 1,19 como el POS', () => {
  assert.equal(precioVenta(prod()).precio_final, 11900)
})

test('el precio final congelado manda sobre el neto', () => {
  assert.equal(precioVenta(prod({ finalPrice: 11990 })).precio_final, 11990)
})

test('promoción de la categoría baja el precio y se informa', () => {
  const p = precioVenta(prod(), [promo({ appliesTo: 'categories', targetIds: [5] })])
  assert.equal(p.precio_con_iva, 11900)
  assert.equal(p.precio_final, 10710)
  assert.deepEqual(p.promocion, { nombre: 'Promo', ahorro: 1190 })
})

test('promoción de otra categoría no aplica', () => {
  assert.equal(precioVenta(prod(), [promo({ appliesTo: 'categories', targetIds: [99] })]).promocion, null)
})

test('un recargo no se presenta como oferta', () => {
  const p = precioVenta(prod(), [promo({ promotionType: 'markup_percentage' })])
  assert.equal(p.precio_final, 11900)
  assert.equal(p.promocion, null)
})

test('producto sin precio no se cotiza y se avisa', () => {
  const p = precioVenta(prod({ saleprice: 0 }))
  assert.equal(p.tiene_precio, false)
  const c = cotizar([{ producto_id: 1, nombre: 'Clavo', cantidad: 3, precio: p, stock_total: 100 }])
  assert.equal(c.total, 0)
  assert.deepEqual(c.sin_precio, ['Clavo'])
})

test('cotización suma con IVA y desglosa neto e IVA', () => {
  const c = cotizar([
    { producto_id: 1, nombre: 'Cemento', cantidad: 10, precio: precioVenta(prod({ saleprice: 5000 })), stock_total: 40 },
    { producto_id: 2, nombre: 'Fierro 8mm', cantidad: 5, precio: precioVenta(prod({ id: 2, finalPrice: 4990 })), stock_total: 3 },
  ])
  assert.equal(c.total, 59500 + 24950)
  assert.equal(c.neto, 50000 + Math.round(24950 / 1.19))
  assert.equal(c.iva, c.total - c.neto)
  assert.deepEqual(c.sin_stock_suficiente, ['Fierro 8mm: pide 5, hay 3'])
})

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
