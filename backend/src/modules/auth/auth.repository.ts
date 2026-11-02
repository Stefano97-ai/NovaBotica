import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../shared/database/database.service';
import { SessionUser } from './auth.types';

@Injectable()
export class AuthRepository {
  constructor(private readonly db: DatabaseService) {}

  async findUser(username: string) {
    const result = await this.db.query<SessionUser & { password_hash: string; activo: boolean }>(
      `SELECT u.id, u.username, u.nombre, u.password_hash, u.activo, r.codigo AS rol
       FROM usuario u JOIN rol r ON r.id=u.rol_id WHERE lower(btrim(u.username))=$1`, [username]);
    return result.rows[0];
  }

  async consumeAttempt(key: string): Promise<number> {
    const result = await this.db.query<{ intentos: number }>(
      `INSERT INTO acceso_limite(clave,intentos,expira_en) VALUES ($1,1,now()+interval '15 minutes')
       ON CONFLICT (clave) DO UPDATE SET
         intentos=CASE WHEN acceso_limite.expira_en<=now() THEN 1 ELSE acceso_limite.intentos+1 END,
         expira_en=CASE WHEN acceso_limite.expira_en<=now() THEN now()+interval '15 minutes' ELSE acceso_limite.expira_en END
       RETURNING intentos`, [key]);
    return result.rows[0].intentos;
  }

  async createSession(userId: string, tokenHash: string, oldHash?: string) {
    return this.db.transaction(async client => {
      // Lock the account while creating the session; a deactivation cannot interleave.
      const user = await client.query('SELECT id FROM usuario WHERE id=$1 AND activo FOR UPDATE', [userId]);
      if (!user.rowCount) return false;
      if (oldHash) await client.query('DELETE FROM sesion WHERE token_hash=$1', [oldHash]);
      await client.query('DELETE FROM sesion WHERE expira_en<=now()');
      await client.query('DELETE FROM acceso_limite WHERE expira_en<=now()');
      await client.query(`INSERT INTO sesion(token_hash,usuario_id,expira_en) VALUES ($1,$2,now()+interval '8 hours')`, [tokenHash,userId]);
      return true;
    });
  }

  async findSession(hash: string) {
    const result = await this.db.query<SessionUser>(
      `SELECT u.id,u.username,u.nombre,r.codigo AS rol FROM sesion s
       JOIN usuario u ON u.id=s.usuario_id JOIN rol r ON r.id=u.rol_id
       WHERE s.token_hash=$1 AND s.expira_en>now() AND u.activo`, [hash]);
    return result.rows[0];
  }
  async deleteSession(hash: string) { await this.db.query('DELETE FROM sesion WHERE token_hash=$1',[hash]); }
}
