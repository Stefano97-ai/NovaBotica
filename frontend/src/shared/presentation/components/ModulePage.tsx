export function ModulePage({ title, description }: { title: string; description: string }) {
  return <section><p className="eyebrow">Nova Salud</p><h1>{title}</h1><p>{description}</p><p className="notice">Módulo en preparación. Las operaciones estarán disponibles en una próxima etapa.</p></section>;
}
