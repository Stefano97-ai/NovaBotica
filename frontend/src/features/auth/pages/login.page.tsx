import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaUser, FaLock, FaAnglesRight, FaShieldHalved, FaHeadset, FaKitMedical, FaCircleQuestion } from 'react-icons/fa6';
import { authRequest } from '../api/auth';
import './login.css';

function Eye({open}:{open:boolean}) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">{open?<><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.8 5.2A11.4 11.4 0 0 1 12 5c6 0 10 7 10 7a16 16 0 0 1-3 3.7M6.1 6.1A19 19 0 0 0 2 12s4 7 10 7a11 11 0 0 0 5-1.3"/></>:<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>}</svg>;
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
  useEffect(()=>{document.documentElement.removeAttribute('data-theme');},[]);
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
  return <div className="lg-page">
    <section className="lg-left">
      <div className="lg-brand">
        <span className="lg-logo"><FaKitMedical size={26}/></span>
        <span className="lg-brand-name">NOVA SALUD</span>
      </div>
      <h2 className="lg-headline">GESTIONA TU BOTICA DE MANERA <span>INTELIGENTE</span></h2>
      <p className="lg-lead">Bienvenido al sistema de gestión de Nova Salud. Optimiza tus ventas, controla tu inventario por lotes y registra tus compras en un solo lugar.</p>
      <div className="lg-info">
        <p><FaShieldHalved size={13}/> Por tu seguridad, no guardes tus credenciales en equipos públicos.</p>
        <p><FaHeadset size={13}/> ¿Problemas para ingresar? Contacta al administrador de tu botica.</p>
      </div>
      <button type="button" className="lg-support" aria-expanded={help} aria-controls="access-help" onClick={()=>setHelp(!help)}><FaCircleQuestion size={14}/> Solicitar soporte</button>
      {help&&<p id="access-help" className="lg-help">Pide al administrador de tu botica que te cree una cuenta o restablezca tu contraseña.</p>}
    </section>

    <main className="lg-right">
      <section className="lg-card" aria-labelledby="login-title">
        <h1 id="login-title">Bienvenido de nuevo</h1>
        <p className="lg-sub">Ingresa tus credenciales para acceder al sistema</p>
        <form onSubmit={submit} noValidate aria-busy={pending}>
          <div className="lg-field">
            <label htmlFor="username" className="sr-only">Usuario</label>
            <FaUser className="lg-field-icon" size={13}/>
            <input ref={userRef} id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={80} required placeholder="Usuario" value={username} onChange={event=>{setUsername(event.target.value);setInvalid(null);setError('');}} readOnly={pending} aria-invalid={invalid==='username'} aria-describedby={invalid==='username'?'login-error':undefined}/>
          </div>
          <div className="lg-field">
            <label htmlFor="password" className="sr-only">Contraseña</label>
            <FaLock className="lg-field-icon" size={13}/>
            <input ref={passRef} id="password" name="password" type={visible?'text':'password'} autoComplete="current-password" maxLength={256} required placeholder="Contraseña" value={password} onChange={event=>{setPassword(event.target.value);setInvalid(null);setError('');}} onKeyDown={capsLock} onKeyUp={capsLock} onBlur={()=>setCaps(false)} readOnly={pending} aria-invalid={invalid==='password'} aria-describedby={invalid==='password'?'login-error':caps?'caps-warning':undefined}/>
            <button type="button" className="lg-eye" aria-label={visible?'Ocultar contraseña':'Mostrar contraseña'} aria-pressed={visible} onClick={()=>setVisible(!visible)}><Eye open={visible}/></button>
          </div>
          <span id="caps-warning" className="lg-caps" aria-live="polite">{caps?'Bloq Mayús está activado.':''}</span>
          <button className="lg-submit" type="submit" disabled={pending}><span>{pending?'INGRESANDO…':'INGRESAR AL SISTEMA'}</span>{pending?<span className="lg-spinner" aria-hidden="true"/>:<FaAnglesRight size={12}/>}</button>
          <div className="lg-feedback"><p id="login-error" ref={errorRef} role="alert" tabIndex={-1}>{error}</p></div>
        </form>
        <p className="lg-foot">Acceso exclusivo para el equipo de Nova Salud</p>
      </section>
    </main>
  </div>;
}
