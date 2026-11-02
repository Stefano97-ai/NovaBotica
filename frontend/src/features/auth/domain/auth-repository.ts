import type { User } from '../../../shared/domain/user';
export interface Credentials { username: string; password: string }
export interface AuthRepository {
  currentUser(signal?: AbortSignal): Promise<User>;
  login(credentials: Credentials): Promise<User>;
  logout(): Promise<void>;
}
