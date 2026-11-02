export const money = new Intl.NumberFormat('es-PE', {style:'currency', currency:'PEN'});
export const limaDate = new Intl.DateTimeFormat('es-PE', {dateStyle:'full', timeZone:'America/Lima'});
export const limaTime = new Intl.DateTimeFormat('es-PE', {hour:'2-digit', minute:'2-digit', timeZone:'America/Lima'});
export const lotDate = (value: string) => new Intl.DateTimeFormat('es-PE', {day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`));
