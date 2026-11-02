import { useState } from 'react';
import { useDraftService } from '../../../shared/presentation/draft-context';
import { saleTotal, validateSaleLine, type SaleLine } from '../domain/sale-draft';
export function useSaleDraft() {
  const service = useDraftService();
  const read = (): SaleLine[] => service.list('sale-lines').map(row => ({ id: row.id, product: row.values.product, quantity: Number(row.values.quantity), price: Number(row.values.price) }));
  const [lines, setLines] = useState(read);
  const [error, setError] = useState('');
  function add(product: string, quantity: string, price: string) {
    const message = validateSaleLine(product, Number(quantity), Number(price));
    if (message) { setError(message); return false; }
    service.save('sale-lines', { product: product.trim(), quantity, price }, []);
    setLines(read()); setError(''); return true;
  }
  function remove(id: string) { service.remove('sale-lines', id); setLines(current => current.filter(line => line.id !== id)); }
  return { lines, error, add, remove, total: saleTotal(lines) };
}
