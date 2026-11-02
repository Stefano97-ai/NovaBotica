import { validateDraft, type DraftRepository, type DraftValues, type FieldRule } from '../domain/draft';
export function createDraftUseCases(repository: DraftRepository, nextId: () => string) {
  return {
    list: (module: string) => repository.list(module),
    save(module: string, values: DraftValues, rules: readonly FieldRule[], id?: string) {
      const errors = validateDraft(values, rules);
      if (Object.keys(errors).length) return { errors };
      repository.save(module, { id: id ?? nextId(), values: { ...values } });
      return { errors: {} };
    },
    remove: (module: string, id: string) => repository.remove(module, id),
  };
}
export type DraftUseCases = ReturnType<typeof createDraftUseCases>;
