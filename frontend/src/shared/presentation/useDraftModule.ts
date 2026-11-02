import { useRef, useState, type FormEvent } from 'react';
import type { Draft, DraftValues } from '../domain/draft';
import { useDraftService } from './draft-context';
import type { ModuleDefinition } from './components/DraftModule';
export function useDraftModule(d: ModuleDefinition) {
  const service = useDraftService();
  const [rows, setRows] = useState(() => service.list(d.key));
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<DraftValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [message, setMessage] = useState('');
  const form = useRef<HTMLFormElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const visible = rows.filter(row => (!filter || row.values[d.filterKey!] === filter) && Object.values(row.values).some(value => value.toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es'))));
  function edit(row?: Draft) {
    setEditing(row?.id ?? null);
    setValues(row?.values ?? Object.fromEntries(d.fields.map(field => [field.key, field.options?.[0] ?? ''])));
    setErrors({}); setOpen(true); setMessage('');
    requestAnimationFrame(() => { form.current?.scrollIntoView({ block: 'nearest' }); form.current?.querySelector<HTMLInputElement>('input,select')?.focus(); });
  }
  function close() { setOpen(false); addButton.current?.focus(); }
  function submit(event: FormEvent) {
    event.preventDefault();
    const result = service.save(d.key, values, d.fields, editing ?? undefined);
    setErrors(result.errors);
    if (Object.keys(result.errors).length) { requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return; }
    setRows(service.list(d.key)); setMessage('Borrador actualizado en esta sesión. No se envió al servidor.'); close();
  }
  return { rows, editing, open, values, setValues, errors, search, setSearch, filter, setFilter, message, form, addButton, visible, edit, close, submit, discard: (row: Draft) => { service.remove(d.key, row.id); setRows(service.list(d.key)); if (editing === row.id) close(); setMessage('Borrador descartado.'); } };
}
