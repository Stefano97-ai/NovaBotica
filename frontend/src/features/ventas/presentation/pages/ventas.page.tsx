import { Button } from '../../../../shared/presentation/ui/button';
import { Input } from '../../../../shared/presentation/ui/input';
import { Label } from '../../../../shared/presentation/ui/label';
import { useRef, useState, type FormEvent } from 'react';
import { useSaleDraft } from '../useSaleDraft';
import { lineTotal } from '../../domain/sale-draft';
import { money } from '../../../../shared/presentation/formatters';
import '../../../../shared/presentation/components/modules.css';
export default function VentasPage() {
  const sale = useSaleDraft();
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const input = useRef<HTMLInputElement>(null);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (sale.add(product, quantity, price)) { setProduct(''); setQuantity('1'); setPrice(''); input.current?.focus(); }
  }
  return <section className="module-page">
    <header className="module-heading"><div><h1>Ventas</h1><p>Prepara los productos y calcula el importe antes de confirmar una venta.</p></div></header>
    <p className="module-scope"><strong>Cotización de trabajo</strong> · Solo en esta sesión. Se elimina al recargar o cerrar sesión. No registra ventas ni reserva existencias.</p>
    <form className="module-editor" onSubmit={submit}>
      <h2>Agregar una línea</h2><div className="module-fields">
        <Label>Producto o código<Input ref={input} required maxLength={180} value={product} onChange={e => setProduct(e.target.value)}/></Label>
        <Label>Cantidad<Input type="number" required min="1" max="99999" step="1" value={quantity} onChange={e => setQuantity(e.target.value)}/></Label>
        <Label>Precio unitario (S/)<Input type="number" required min="0.01" max="999999.99" step="0.01" value={price} onChange={e => setPrice(e.target.value)}/></Label>
      </div><p className="module-error" role="alert">{sale.error}</p><Button className="module-primary">Agregar a la cotización</Button>
    </form>
    <div className="module-toolbar"><span>{sale.lines.length} líneas en la cotización</span></div>
    <div className="module-table-wrap"><table><caption className="sr-only">Productos cotizados</caption><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Importe</th><th>Acción</th></tr></thead><tbody>{sale.lines.map(line => <tr key={line.id}><td>{line.product}</td><td>{line.quantity}</td><td>{money.format(line.price)}</td><td>{money.format(lineTotal(line) / 100)}</td><td><Button onClick={() => sale.remove(line.id)}>Quitar</Button></td></tr>)}</tbody></table>{!sale.lines.length && <div className="module-empty"><h2>La cotización está vacía</h2><p>Agrega un producto con su cantidad y precio para calcular el importe.</p></div>}</div>
    <div className="module-report"><article><h2>Total cotizado</h2><strong aria-live="polite">{money.format(sale.total / 100)}</strong><p>Suma de los precios ingresados. No incluye cálculos tributarios ni descuentos.</p></article><article><h2>Confirmación pendiente</h2><p>La validación de stock, receta y asignación FEFO requiere conectar la operación de venta. No es posible cobrar ni emitir un comprobante desde esta cotización.</p></article></div>
  </section>;
}
