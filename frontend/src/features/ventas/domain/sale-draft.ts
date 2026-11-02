export interface SaleLine { id: string; product: string; quantity: number; price: number }
export function lineTotal(line: SaleLine): number { return Math.round(line.price * 100) * line.quantity; }
export function saleTotal(lines: readonly SaleLine[]): number { return lines.reduce((sum, line) => sum + lineTotal(line), 0); }
export function validateSaleLine(product: string, quantity: number, price: number): string | null {
  if (!product.trim()) return 'Ingresa el nombre o código del producto.';
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99999) return 'La cantidad debe ser un entero entre 1 y 99999.';
  if (!Number.isFinite(price) || price < 0.01 || price > 999999.99) return 'Ingresa un precio entre S/ 0.01 y S/ 999999.99.';
  return null;
}
