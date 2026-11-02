package com.novasalud.auth;
import java.nio.file.*;
import org.springframework.boot.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.DependsOn;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
@Component
@DependsOn("databaseMigration")
public class AdminBootstrap implements ApplicationRunner {
    private final JdbcTemplate jdbc;private final TransactionTemplate transactions;private final PasswordService passwords;
    private final boolean enabled;private final Path file;private final String command;
    public AdminBootstrap(JdbcTemplate jdbc,TransactionTemplate transactions,PasswordService passwords,
       @Value("${nova.create-admin}") boolean enabled,@Value("${nova.credentials-file}") String file,@Value("${nova.command:}") String command){
        this.jdbc=jdbc;this.transactions=transactions;this.passwords=passwords;this.enabled=enabled;this.file=Path.of(file);this.command=command;
    }
    @Override public void run(ApplicationArguments args){
        if(!enabled&&!command.equals("admin"))return;
        transactions.executeWithoutResult(status->{
            jdbc.execute("SELECT pg_advisory_xact_lock(5272027)");
            if(jdbc.queryForObject("SELECT count(*) FROM usuario WHERE lower(btrim(username))='admin'",Long.class)>0)return;
            String password=passwords.randomHex(18);
            int inserted=jdbc.update("INSERT INTO usuario(rol_id,username,nombre,password_hash) SELECT id,'admin','Administrador Nova Salud',? FROM rol WHERE codigo='ADMINISTRADOR'",passwords.hash(password));
            if(inserted!=1)throw new IllegalStateException("Falta rol ADMINISTRADOR");
            try{Files.createDirectories(file.toAbsolutePath().getParent());Files.writeString(file,"Acceso local Nova Salud\nUsuario: admin\nContraseña: "+password+"\n",StandardOpenOption.CREATE_NEW);}
            catch(java.io.IOException e){throw new IllegalStateException("No se pudo escribir el archivo local de credenciales; no se creó el administrador.",e);}
        });
    }
}
