import { useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth-context';
import { safeDestination } from '../../../../shared/domain/access';
export function useLoginForm() {
  const auth = useAuth();
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [visible,setVisible]=useState(false);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState('');
  const [invalid,setInvalid]=useState<'username'|'password'|null>(null);
  const [caps,setCaps]=useState(false);
  const [help,setHelp]=useState(false);
  const userRef=useRef<HTMLInputElement>(null);
  const passRef=useRef<HTMLInputElement>(null);
  const errorRef=useRef<HTMLParagraphElement>(null);
  const inFlight=useRef(false);
  const navigate=useNavigate();
  const [params]=useSearchParams();
  function capsLock(event:KeyboardEvent<HTMLInputElement>) {setCaps(event.getModifierState('CapsLock'));}
  async function submit(event:FormEvent) {
    event.preventDefault();
    if(inFlight.current) return;
    setInvalid(null); setError('');
    if(!username.trim()){setInvalid('username');setError('Escribe tu usuario para continuar.');userRef.current?.focus();return;}
    if(!password){setInvalid('password');setError('Escribe tu contraseña para continuar.');passRef.current?.focus();return;}
    inFlight.current=true;setPending(true);
    try {
      const user = await auth.login({username,password});
      setPassword('');
      const next=params.get('next');
      navigate(safeDestination(next,user.rol),{replace:true});
    } catch(failure) {
      setError(failure instanceof Error?failure.message:'No pudimos iniciar sesión. Inténtalo otra vez.');
      requestAnimationFrame(()=>errorRef.current?.focus());
    } finally {inFlight.current=false;setPending(false);}
  }

  return {username,setUsername,password,setPassword,visible,setVisible,pending,error,setError,invalid,setInvalid,caps,setCaps,help,setHelp,userRef,passRef,errorRef,capsLock,submit};
}
