package com.novasalud.shared.database;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import javax.sql.DataSource;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

/** Preserves the original Node runner's filenames, raw-byte SHA-256 and advisory lock. */
@Component("databaseMigration")
public class DatabaseMigration implements InitializingBean {
    private final DataSource source;
    public DatabaseMigration(DataSource source) {this.source=source;}
    @Override public void afterPropertiesSet() throws Exception {
        try(var connection=source.getConnection();var statement=connection.createStatement()) {
            statement.execute("SELECT pg_advisory_lock(5272026)");
            try {
                statement.execute("CREATE TABLE IF NOT EXISTS schema_migrations(version text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())");
                var resources=new PathMatchingResourcePatternResolver().getResources("classpath*:database/migrations/*.sql");
                Arrays.sort(resources,Comparator.comparing(r->Objects.requireNonNull(r.getFilename())));
                if(resources.length==0) throw new IllegalStateException("No se encontraron migraciones SQL");
                for(var resource:resources) {
                    byte[] bytes;try(var input=resource.getInputStream()){bytes=input.readAllBytes();}
                    String checksum=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
                    String name=resource.getFilename();
                    try(var query=connection.prepareStatement("SELECT checksum FROM schema_migrations WHERE version=?")) {
                        query.setString(1,name);
                        try(var rows=query.executeQuery()) {if(rows.next()) {
                            if(!checksum.equals(rows.getString(1))) throw new IllegalStateException("Migración aplicada modificada: "+name);
                            continue;
                        }}
                    }
                    connection.setAutoCommit(false);
                    try {
                        statement.execute(new String(bytes,StandardCharsets.UTF_8));
                        try(var insert=connection.prepareStatement("INSERT INTO schema_migrations(version,checksum) VALUES (?,?)")) {insert.setString(1,name);insert.setString(2,checksum);insert.executeUpdate();}
                        connection.commit();
                    } catch(Exception error) {connection.rollback();throw error;}
                    finally {connection.setAutoCommit(true);}
                }
            } finally {statement.execute("SELECT pg_advisory_unlock(5272026)");}
        }
    }
}
