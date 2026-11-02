export type DraftValues = Record<string, string>;
export interface Draft { id: string; values: DraftValues }
export interface DraftRepository {
  list(module: string): Draft[];
  save(module: string, draft: Draft): void;
  remove(module: string, id: string): void;
}
export interface FieldRule {
  key: string;
  required?: boolean;
  kind?: 'text' | 'number' | 'date' | 'email';
  min?: number;
  integer?: boolean;
  pattern?: string;
}
export function validateDraft(values: DraftValues, rules: readonly FieldRule[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const rule of rules) {
    const value = (values[rule.key] ?? '').trim();
    if (!value) { if (rule.required) errors[rule.key] = 'Completa este campo.'; continue; }
    if (rule.kind === 'number' && (!Number.isFinite(Number(value)) || Number(value) < (rule.min ?? 0) || (rule.integer && !Number.isInteger(Number(value))))) errors[rule.key] = `Ingresa ${rule.integer ? 'un entero' : 'un número'} de al menos ${rule.min ?? 0}.`;
    if (rule.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[rule.key] = 'Ingresa un correo válido.';
    if (rule.pattern && !new RegExp(rule.pattern).test(value)) errors[rule.key] = 'Revisa el formato del dato.';
  }
  return errors;
}
