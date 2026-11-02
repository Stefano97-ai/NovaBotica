export type Role = 'ADMINISTRADOR' | 'VENDEDOR' | 'ALMACENERO';
export interface User { id:string; username:string; nombre:string; rol:Role }
export class AuthError extends Error {
  constructor(public status:number, message:string) { super(message); }
}
export async function authRequest<T>(path:string, body?:unknown):Promise<T> {
  let response:Response;
  try {
    response=await fetch(`/api/auth/${path}`,{
      method:body===undefined?'GET':'POST', credentials:'same-origin',
      headers:body===undefined?{}:{'Content-Type':'application/json','X-Nova-Client':'web'},
      body:body===undefined?undefined:JSON.stringify(body), signal:AbortSignal.timeout(15000), cache:'no-store',
    });
  } catch { throw new AuthError(0,'No pudimos conectar. Comprueba tu conexión y vuelve a intentarlo.'); }
  if(!response.ok) {
    const messages:Record<number,string>={
      400:'Revisa tu usuario y contraseña.',401:'Usuario o contraseña incorrectos.',
      403:'No se pudo validar la solicitud. Recarga la página e inténtalo otra vez.',
      429:'Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.',
    };
    throw new AuthError(response.status,messages[response.status]??'El servicio no está disponible. Inténtalo de nuevo en un momento.');
  }
  return response.status===204?undefined as T:response.json();
}
