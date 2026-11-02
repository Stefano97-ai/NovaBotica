import { Card } from '../../../../shared/presentation/ui/card';
import { Link } from 'react-router-dom';
import type { Role } from '../../../../shared/domain/user';
import { canAccess } from '../../../../shared/domain/access';
import { navigationItems } from '../../../../shared/presentation/navigation';
export function QuickAccess({role}:{role:Role}) {
 const links=navigationItems.filter(item=>item.detail && canAccess(item.path,role));
 return (<Card className="home-panel home-access"><h2>Tus módulos</h2><p className="home-note">Accesos disponibles para tu rol.</p>{links.map(link=><Link key={link.path} to={link.path}><span><strong>{link.label}</strong><small>{link.detail}</small></span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></Link>)}<p className="home-development">Prepara borradores en los módulos. Las operaciones reales todavía no están conectadas.</p></Card>);
}
