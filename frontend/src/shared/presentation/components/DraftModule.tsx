import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { FieldRule } from '../../domain/draft';
import { useDraftModule } from '../useDraftModule';
import './modules.css';

export interface DraftField extends FieldRule { label: string; options?: readonly string[]; hint?: string }
export interface ModuleDefinition {
  key: string; title: string; description: string; singular: string;
  fields: readonly DraftField[]; columns: readonly string[]; filterKey?: string; note: string;
}
export function DraftModule({ definition: d }: { definition: ModuleDefinition }) {
  const { rows, editing, open, values, setValues, errors, search, setSearch, filter, setFilter, message, form, addButton, visible, edit, close, submit, discard } = useDraftModule(d);
  const filterField = d.fields.find(field => field.key === d.filterKey);
  return <section className="module-page">
    <header className="module-heading"><div><h1>{d.title}</h1><p>{d.description}</p></div><Button ref={addButton} className="module-primary" onClick={() => edit()}>Nuevo borrador</Button></header>
    <p className="module-scope"><strong>Espacio de borradores</strong> · Solo en esta sesión. Se eliminan al recargar o cerrar sesión. No modifican registros reales.</p>
    <p className="module-explanation">{d.note}</p>
    {open && <form ref={form} className="module-editor" onSubmit={submit} noValidate>
      <h2>{editing ? 'Editar' : 'Preparar'} {d.singular}</h2>
      <div className="module-fields">{d.fields.map(field => <Label key={field.key} htmlFor={`${d.key}-${field.key}`}>
        <span>{field.label}{field.required ? ' *' : ' (opcional)'}</span>
        {field.options ? <select id={`${d.key}-${field.key}`} value={values[field.key] ?? ''} onChange={event => setValues({ ...values, [field.key]: event.target.value })}>{field.options.map(option => <option key={option}>{option}</option>)}</select> :
          <Input id={`${d.key}-${field.key}`} type={field.kind ?? 'text'} value={values[field.key] ?? ''} required={field.required} min={field.min} step={field.integer ? 1 : field.kind === 'number' ? '0.01' : undefined} maxLength={180} aria-invalid={!!errors[field.key]} aria-describedby={`${d.key}-${field.key}-help`} onChange={event => setValues({ ...values, [field.key]: event.target.value })}/>}
        <small id={`${d.key}-${field.key}-help`} className={errors[field.key] ? 'module-error' : ''}>{errors[field.key] ?? field.hint}</small>
      </Label>)}</div>
      <div className="module-actions"><Button className="module-primary" type="submit">Conservar borrador</Button><Button type="button" onClick={close}>Cancelar</Button></div>
    </form>}
    <div role="status" className="module-feedback">{message}</div>
    <div className="module-toolbar"><Label>Buscar borradores<Input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={`Buscar en ${d.title.toLowerCase()}`}/></Label>
      {filterField?.options && <Label>{filterField.label}<select value={filter} onChange={event => setFilter(event.target.value)}><option value="">Todos</option>{filterField.options.map(option => <option key={option}>{option}</option>)}</select></Label>}
      <span>{visible.length} de {rows.length} borradores</span>
    </div>
    <div className="module-table-wrap"><table><caption className="sr-only">Borradores de {d.title}</caption><thead><tr>{d.columns.map(key => <th key={key}>{d.fields.find(field => field.key === key)?.label}</th>)}<th>Acciones</th></tr></thead>
      <tbody>{visible.map(row => <tr key={row.id}>{d.columns.map(key => <td key={key}>{row.values[key] || '—'}</td>)}<td><div className="module-row-actions"><Button onClick={() => edit(row)}>Editar</Button><Button onClick={() => discard(row)} aria-label={`Descartar ${row.values[d.columns[0]]}`}>Descartar</Button></div></td></tr>)}</tbody></table>
      {!visible.length && <div className="module-empty"><h2>{rows.length ? 'No hay coincidencias' : `Prepara tu primer borrador`}</h2><p>{rows.length ? 'Prueba otro término o cambia el filtro.' : `Los borradores de ${d.title.toLowerCase()} aparecerán aquí. No se han cargado registros del servidor.`}</p>{!!rows.length && <Button onClick={() => { setSearch(''); setFilter(''); }}>Limpiar filtros</Button>}</div>}
    </div>
  </section>;
}
