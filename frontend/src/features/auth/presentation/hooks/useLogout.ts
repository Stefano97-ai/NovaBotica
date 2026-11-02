import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth-context';
export function useLogout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const inFlight = useRef(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  async function logout() {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try { await auth.logout(); navigate('/login', { replace:true }); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'No se pudo cerrar la sesión.'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return { busy, error, logout };
}
