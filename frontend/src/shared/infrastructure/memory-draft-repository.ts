import type { Draft, DraftRepository } from '../domain/draft';
export function createMemoryDraftRepository(): DraftRepository {
  const modules = new Map<string, Draft[]>();
  return {
    list: module => structuredClone(modules.get(module) ?? []),
    save(module, draft) {
      const rows = modules.get(module) ?? [];
      modules.set(module, [...rows.filter(row => row.id !== draft.id), structuredClone(draft)]);
    },
    remove(module, id) { modules.set(module, (modules.get(module) ?? []).filter(row => row.id !== id)); },
  };
}
