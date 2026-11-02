import { Button } from '../../../../shared/presentation/ui/button';
import { Input } from '../../../../shared/presentation/ui/input';
import { Label } from '../../../../shared/presentation/ui/label';
import { Brand } from '../../../../shared/presentation/components/Brand';
import { ThemeToggle } from '../../../../shared/presentation/components/ThemeToggle';
import { Eye } from '../components/Eye';
import { useLoginForm } from '../hooks/useLoginForm';
import './login.css';
export default function LoginPage() {
  const {username,setUsername,password,setPassword,visible,setVisible,pending,error,setError,invalid,setInvalid,caps,setCaps,help,setHelp,userRef,passRef,errorRef,capsLock,submit} = useLoginForm();
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
          <div className="login-field"><Label htmlFor="username">Usuario</Label><Input ref={userRef} id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={80} required placeholder="Tu usuario" value={username} onChange={event=>{setUsername(event.target.value);setInvalid(null);setError('');}} readOnly={pending} aria-invalid={invalid==='username'} aria-describedby={invalid==='username'?'login-error':undefined}/></div>
          <div className="login-field"><Label htmlFor="password">Contraseña</Label><div className="password-control"><Input ref={passRef} id="password" name="password" type={visible?'text':'password'} autoComplete="current-password" maxLength={256} required placeholder="Tu contraseña" value={password} onChange={event=>{setPassword(event.target.value);setInvalid(null);setError('');}} onKeyDown={capsLock} onKeyUp={capsLock} onBlur={()=>setCaps(false)} readOnly={pending} aria-invalid={invalid==='password'} aria-describedby={invalid==='password'?'login-error':caps?'caps-warning':undefined}/><Button type="button" className="password-toggle" aria-label={visible?'Ocultar contraseña':'Mostrar contraseña'} aria-pressed={visible} onClick={()=>setVisible(!visible)}><Eye open={visible}/></Button></div><span id="caps-warning" className="caps-warning" aria-live="polite">{caps?'Bloq Mayús está activado.':''}</span></div>
          <Button className="login-submit" type="submit" disabled={pending}><span>{pending?'Ingresando…':'Ingresar'}</span>{pending?<span className="login-spinner" aria-hidden="true"/>:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>}</Button>
          <div className="login-feedback"><p id="login-error" ref={errorRef} role="alert" tabIndex={-1}>{error}</p></div>
        </form>
        <div className="login-help"><Button type="button" className="text-button" aria-expanded={help} aria-controls="access-help" onClick={()=>setHelp(!help)}>¿Necesitas ayuda para ingresar?</Button>{help&&<p id="access-help">Contacta al administrador de tu botica para solicitar una cuenta o restablecer tu contraseña.</p>}</div>
      </section>
    </main>
    <footer className="login-footer"><span>Nova Salud · Sistema de gestión</span><span>Acceso exclusivo para el equipo</span></footer>
  </div>;
}
