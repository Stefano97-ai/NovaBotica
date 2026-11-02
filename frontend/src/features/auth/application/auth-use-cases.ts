import type { AuthRepository, Credentials } from '../domain/auth-repository';
import type { User } from '../../../shared/domain/user';
export interface AuthUseCases {
  currentUser(signal?: AbortSignal): Promise<User>;
  login(credentials: Credentials): Promise<User>;
  logout(): Promise<void>;
}
export function createAuthUseCases(repository: AuthRepository): AuthUseCases {
  return {
    currentUser: signal => repository.currentUser(signal),
    login: credentials => repository.login({ ...credentials, username: credentials.username.trim() }),
    logout: () => repository.logout(),
  };
}
