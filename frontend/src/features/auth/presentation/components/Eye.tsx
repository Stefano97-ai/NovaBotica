export function Eye({open}:{open:boolean}) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">{open?<><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.8 5.2A11.4 11.4 0 0 1 12 5c6 0 10 7 10 7a16 16 0 0 1-3 3.7M6.1 6.1A19 19 0 0 0 2 12s4 7 10 7a11 11 0 0 0 5-1.3"/></>:<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>}</svg>;
}
