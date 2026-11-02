import { useEffect } from 'react';
import { useRevalidator } from 'react-router-dom';
export function useSessionRevalidation() {
  const { revalidate } = useRevalidator();
  useEffect(() => {
    const check = () => { if (document.visibilityState === 'visible') void revalidate(); };
    window.addEventListener('focus', check);
    const timer = window.setInterval(check, 60000);
    return () => { window.removeEventListener('focus', check); window.clearInterval(timer); };
  }, [revalidate]);
}
