import { useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authRequest } from '../api/auth';
import { Brand } from '../components/Brand';
import './login.css';
import { ThemeToggle } from '../../../shared/components/ThemeToggle';

function Eye({open}:{open:boolean}) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">{open?<><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.8 5.2A11.4 11.4 0 0 1 12 5c6 0 10 7 10 7a16 16 0 0 1-3 3.7M6.1 6.1A19 19 0 0 0 2 12s4 7 10 7a11 11 0 0 0 5-1.3"/></>:<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>}</svg>;
}
export default function LoginPage() {
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
      await authRequest('login',{username:username.trim(),password});
      setPassword('');
      const next=params.get('next');
      const allowed=['/','/productos','/inventario','/ventas','/compras','/proveedores','/comprobantes','/reportes','/usuarios'];
      navigate(next&&allowed.includes(next)?next:'/',{replace:true});
    } catch(failure) {
      setError(failure instanceof Error?failure.message:'No pudimos iniciar sesión. Inténtalo otra vez.');
      requestAnimationFrame(()=>errorRef.current?.focus());
    } finally {inFlight.current=false;setPending(false);}
  }
  return <div className="login-page">
    <header className="login-header"><Brand/><div className="login-header-actions"><span className="login-header-note">Gestión de botica</span><ThemeToggle/></div></header>
    <main className="login-main">
      <div className="login-context">
        <div><h2>Una botica.<br/>Todo en orden.</h2><p>Inventario, ventas y compras.<br/>El día a día de Nova Salud, en un solo lugar.</p></div>
        <ul className="context-list"><li>Inventario y lotes</li><li>Ventas y cobros</li><li>Compras y proveedores</li></ul>
        <span className="context-footer">Un equipo. Una atención más cercana.</span>
      </div>
      <section className="login-form-region" aria-labelledby="login-title">
        <div className="login-form-heading"><h1 id="login-title">Iniciar sesión</h1><p>Ingresa con tu cuenta de Nova Salud.</p></div>
        <form onSubmit={submit} noValidate aria-busy={pending}>
          <div className="login-field"><label htmlFor="username">Usuario</label><input ref={userRef} id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={80} required placeholder="Tu usuario" value={username} onChange={event=>{setUsername(event.target.value);setInvalid(null);setError('');}} readOnly={pending} aria-invalid={invalid==='username'} aria-describedby={invalid==='username'?'login-error':undefined}/></div>
          <div className="login-field"><label htmlFor="password">Contraseña</label><div className="password-control"><input ref={passRef} id="password" name="password" type={visible?'text':'password'} autoComplete="current-password" maxLength={256} required placeholder="Tu contraseña" value={password} onChange={event=>{setPassword(event.target.value);setInvalid(null);setError('');}} onKeyDown={capsLock} onKeyUp={capsLock} onBlur={()=>setCaps(false)} readOnly={pending} aria-invalid={invalid==='password'} aria-describedby={invalid==='password'?'login-error':caps?'caps-warning':undefined}/><button type="button" className="password-toggle" aria-label={visible?'Ocultar contraseña':'Mostrar contraseña'} aria-pressed={visible} onClick={()=>setVisible(!visible)}><Eye open={visible}/></button></div><span id="caps-warning" className="caps-warning" aria-live="polite">{caps?'Bloq Mayús está activado.':''}</span></div>
          <button className="login-submit" type="submit" disabled={pending}><span>{pending?'Ingresando…':'Ingresar'}</span>{pending?<span className="login-spinner" aria-hidden="true"/>:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>}</button>
          <div className="login-feedback"><p id="login-error" ref={errorRef} role="alert" tabIndex={-1}>{error}</p></div>
        </form>
        <div className="login-help"><button type="button" className="text-button" aria-expanded={help} aria-controls="access-help" onClick={()=>setHelp(!help)}>¿Necesitas ayuda para ingresar?</button>{help&&<p id="access-help">Contacta al administrador de tu botica para solicitar una cuenta o restablecer tu contraseña.</p>}</div>
      </section>
    </main>
    <footer className="login-footer"><span>Nova Salud · Sistema de gestión</span><span>Acceso exclusivo para el equipo</span></footer>
  </div>;
}
