import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { serialError } from '../../domain/purchase';

export function PurchaseSerials({ name, quantity, initial, otherSeries, onSave, onClose }: {
  name: string; quantity: number; initial: string[]; otherSeries: string[]; onSave: (series: string[]) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState(initial.join('\n'));
  const [error, setError] = useState('');
  const entries = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  useEffect(() => { dialog.current?.showModal(); }, []);
  function save() {
    const invalid = serialError(entries, quantity) || (entries.some(s => otherSeries.includes(s)) ? 'Una serie ya está registrada en otro producto de esta compra.' : '');
    if (invalid) { setError(invalid); return; }
    onSave(entries);
  }
  return <dialog ref={dialog} className="purchase-serial-dialog" aria-labelledby="purchase-serial-title" onCancel={onClose} onClose={onClose}>
    <div className="purchase-serial-heading"><h2 id="purchase-serial-title">Registrar series únicas</h2><button type="button" onClick={onClose} aria-label="Cerrar series"><X size={20} /></button></div>
    <p>{name}</p>
    <label htmlFor="purchase-serial-input">Una serie por línea · {quantity} {quantity === 1 ? 'unidad' : 'unidades'}</label>
    <p id="purchase-serial-help">Puedes escribir, escanear o pegar una lista. Cada serie debe ser distinta.</p>
    <textarea id="purchase-serial-input" aria-describedby="purchase-serial-help" value={text} onChange={e => { setText(e.target.value); setError(''); }} rows={10} maxLength={1700000} autoFocus spellCheck={false} placeholder={'SERIE-001\nSERIE-002'} />
    <p role="status">{entries.length} de {quantity} series registradas</p>
    {error && <p className="purchase-error" role="alert">{error}</p>}
    <div className="purchase-serial-footer"><button type="button" onClick={onClose}>Cancelar</button><button type="button" onClick={save}>Guardar series</button></div>
  </dialog>;
}
