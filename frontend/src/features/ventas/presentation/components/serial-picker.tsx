import { useEffect, useRef, useState } from 'react';
import { X, Search } from 'lucide-react';
import { canSelectSerial, type AvailableSerial, type LoadSerials } from '../../domain/series';

export function SerialPicker({ productId, name, quantity, initial, load, onSave, onClose }: {
  productId: number; name: string; quantity: number; initial: AvailableSerial[]; load: LoadSerials;
  onSave: (selected: AvailableSerial[]) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [units, setUnits] = useState<AvailableSerial[]>([]);
  const [selected, setSelected] = useState(initial);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    const timer = setTimeout(() => controller.abort(), 15000);
    setLoading(true); setError('');
    load(productId, quantity, controller.signal).then(result => {
      if (active) {
        setUnits(result);
        setSelected(old => old.reduce<AvailableSerial[]>((valid, previous) => {
          const fresh = result.find(unit => unit.id === previous.id);
          if (fresh && canSelectSerial(fresh, valid, quantity)) valid.push(fresh);
          return valid;
        }, []));
      }
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'No se pudieron consultar las series.'); })
      .finally(() => { clearTimeout(timer); if (active) setLoading(false); });
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [load, productId, quantity, version]);
  const filtered = units.filter(u => `${u.numeroSerie} ${u.numeroLote}`.toLowerCase().includes(query.toLowerCase()));
  return <dialog ref={dialog} className="pos-serial-dialog" aria-labelledby="serial-picker-title" onCancel={onClose} onClose={onClose}>
    <div className="pos-serial-heading"><h2 id="serial-picker-title">Series por unidad</h2><button type="button" onClick={onClose} aria-label="Cerrar series"><X size={20} /></button></div>
    <p>{name}</p><p className="pos-serial-help">Selecciona hasta {quantity} {quantity === 1 ? 'serie' : 'series'}.</p>
    <label className="pos-serial-search"><Search size={16} /><input aria-label="Buscar serie o lote" placeholder="Buscar serie o lote" value={query} onChange={e => setQuery(e.target.value)} /></label>
    {loading ? <p role="status">Consultando series disponibles…</p> : error ? <div role="alert"><p>{error}</p><button type="button" onClick={() => setVersion(v => v + 1)}>Reintentar</button></div> :
      <div className="pos-serial-list">{filtered.length ? filtered.map(unit => {
        const checked = selected.some(s => s.id === unit.id);
        return <label key={unit.id} className="pos-serial-option">
          <input type="checkbox" checked={checked} disabled={!checked && !canSelectSerial(unit, selected, quantity)} onChange={() => setSelected(old => checked ? old.filter(s => s.id !== unit.id) : [...old, unit])} />
          <span><strong>{unit.numeroSerie}</strong><small>Lote {unit.numeroLote} · Vence {unit.vencimiento}{unit.limiteLote === 0 ? ' · Lote posterior en FEFO' : ` · Hasta ${unit.limiteLote} ${unit.limiteLote === 1 ? 'unidad' : 'unidades'} de este lote`}</small></span>
        </label>;
      }) : <p>{query ? 'No hay series que coincidan con la búsqueda.' : 'Este producto no tiene series disponibles registradas. Puedes continuar sin series.'}</p>}</div>}
    <div className="pos-serial-footer"><span aria-live="polite">Series seleccionadas: {selected.length} de {quantity}</span>
      <button type="button" onClick={() => setSelected([])}>Limpiar selección</button>
      <button type="button" className="pos-serial-save" disabled={loading || Boolean(error)} onClick={() => onSave(selected)}>Guardar selección</button>
    </div>
  </dialog>;
}
