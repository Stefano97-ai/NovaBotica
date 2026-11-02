import { Button } from '../../shared/presentation/ui/button';
import { useRouteError } from 'react-router-dom';
import { Brand } from '../../shared/presentation/components/Brand';
export function RouteError() {
  const error = useRouteError();
  return <div className="session-state"><Brand/><h1>No pudimos abrir tu sesión</h1><p>{error instanceof Error?error.message:'Vuelve a intentarlo en un momento.'}</p><Button onClick={()=>window.location.reload()}>Volver a intentar</Button><a href="/login">Ir al inicio de sesión</a></div>;
}
