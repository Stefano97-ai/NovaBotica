import { redirect, type LoaderFunctionArgs } from 'react-router-dom';
import type { AuthUseCases } from '../../features/auth/application/auth-use-cases';
import { isUnauthorized } from '../../shared/application/errors';
import { canAccess, type AppPath } from '../../shared/domain/access';
export function createSessionLoaders(auth: AuthUseCases) {
  async function session({request}: LoaderFunctionArgs) {
    try { return await auth.currentUser(request.signal); }
    catch (error) {
      if (isUnauthorized(error)) return redirect('/login?next='+encodeURIComponent(new URL(request.url).pathname));
      throw error;
    }
  }
  return {
    session,
    login: async ({request}: LoaderFunctionArgs) => {
      try { await auth.currentUser(request.signal); return redirect('/'); }
      catch { return null; } // The login form remains usable during an API outage.
    },
    authorize: (path: AppPath) => async (args: LoaderFunctionArgs) => {
      const user = await session(args);
      if (user instanceof Response) return user;
      return canAccess(path,user.rol) ? null : redirect('/');
    },
  };
}
