import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Summary } from '../../domain/summary';
import { useInicio } from '../inicio-context';
import { isUnauthorized } from '../../../../shared/application/errors';
export function useSummary() {
  const inicio = useInicio();
  const navigate = useNavigate();
  const [data,setData] = useState<Summary | null>(null);
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(true);
  const [version,setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true); setError('');
    inicio.getSummary(controller.signal).then(summary => {
      if (active) setData(summary);
    }).catch(failure => {
      if (!active) return;
      if (isUnauthorized(failure)) navigate('/login', { replace:true });
      else setError('No pudimos actualizar el resumen. Comprueba tu conexión y vuelve a intentarlo.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [inicio, navigate, version]);
  return { data, error, loading, refresh };
}
