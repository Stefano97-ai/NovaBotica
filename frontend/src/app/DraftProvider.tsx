import { useState, type PropsWithChildren } from 'react';
import { createDraftUseCases } from '../shared/application/draft-use-cases';
import { createMemoryDraftRepository } from '../shared/infrastructure/memory-draft-repository';
import { DraftContext } from '../shared/presentation/draft-context';
export function DraftProvider({ children }: PropsWithChildren) {
  const [service] = useState(() => createDraftUseCases(createMemoryDraftRepository(), () => crypto.randomUUID()));
  return <DraftContext.Provider value={service}>{children}</DraftContext.Provider>;
}
