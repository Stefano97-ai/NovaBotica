package com.novasalud.auth;
import java.sql.*;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.context.annotation.DependsOn;
import org.springframework.transaction.annotation.Transactional;
@Repository
@DependsOn("databaseMigration")
public class AuthRepository {
    private final JdbcTemplate jdbc;
    public AuthRepository(JdbcTemplate jdbc){this.jdbc=jdbc;}
    private SessionUser user(ResultSet row) throws SQLException {return new SessionUser(row.getString("id"),row.getString("username"),row.getString("nombre"),row.getString("rol"));}
    public Optional<Account> findUser(String username) {
        return jdbc.query("SELECT u.id,u.username,u.nombre,u.password_hash,u.activo,r.codigo AS rol FROM usuario u JOIN rol r ON r.id=u.rol_id WHERE lower(btrim(u.username))=?",(r,n)->new Account(user(r),r.getString("password_hash"),r.getBoolean("activo")),username).stream().findFirst();
    }
    public int consumeAttempt(String key) {
        return jdbc.queryForObject("""
            INSERT INTO acceso_limite(clave,intentos,expira_en) VALUES (?,1,now()+interval '15 minutes')
            ON CONFLICT(clave) DO UPDATE SET
            intentos=CASE WHEN acceso_limite.expira_en<=now() THEN 1 ELSE acceso_limite.intentos+1 END,
            expira_en=CASE WHEN acceso_limite.expira_en<=now() THEN now()+interval '15 minutes' ELSE acceso_limite.expira_en END
            RETURNING intentos
            """,Integer.class,key);
    }
    @Transactional public boolean createSession(String id,String hash,String oldHash) {
        if(jdbc.queryForList("SELECT id FROM usuario WHERE id=? AND activo FOR UPDATE",Long.class,Long.parseLong(id)).isEmpty())return false;
        if(oldHash!=null)deleteSession(oldHash);
        jdbc.update("DELETE FROM sesion WHERE expira_en<=now()");jdbc.update("DELETE FROM acceso_limite WHERE expira_en<=now()");
        jdbc.update("INSERT INTO sesion(token_hash,usuario_id,expira_en) VALUES (?,?,now()+interval '8 hours')",hash,Long.parseLong(id));return true;
    }
    public Optional<SessionUser> findSession(String hash) {
        return jdbc.query("SELECT u.id,u.username,u.nombre,r.codigo AS rol FROM sesion s JOIN usuario u ON u.id=s.usuario_id JOIN rol r ON r.id=u.rol_id WHERE s.token_hash=? AND s.expira_en>now() AND u.activo",(r,n)->user(r),hash).stream().findFirst();
    }
    public void deleteSession(String hash){jdbc.update("DELETE FROM sesion WHERE token_hash=?",hash);}
}
