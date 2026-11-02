package com.novasalud.config;

import com.zaxxer.hikari.HikariDataSource;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import javax.sql.DataSource;
import org.springframework.context.annotation.*;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class DatabaseConfig {
    @Bean public DataSource dataSource(@Value("${DATABASE_URL}") String url) {
        URI uri=URI.create(url);
        if(!SetHolder.SCHEMES.contains(uri.getScheme()) || uri.getHost()==null || uri.getRawUserInfo()==null) throw new IllegalArgumentException("DATABASE_URL debe ser una URL PostgreSQL con usuario y contraseña.");
        String[] credentials=uri.getRawUserInfo().split(":",2);
        var source=new HikariDataSource();
        source.setJdbcUrl("jdbc:postgresql://"+uri.getHost()+":"+(uri.getPort()<0?5432:uri.getPort())+uri.getRawPath()+(uri.getRawQuery()==null?"":"?"+uri.getRawQuery()));
        source.setUsername(URLDecoder.decode(credentials[0],StandardCharsets.UTF_8));
        source.setPassword(credentials.length>1?URLDecoder.decode(credentials[1],StandardCharsets.UTF_8):"");
        source.setMaximumPoolSize(10); source.setConnectionTimeout(5000);
        source.setConnectionInitSql("SET TIME ZONE 'America/Lima'");
        source.addDataSourceProperty("options","-c statement_timeout=15000");
        return source;
    }
    private static class SetHolder {static final java.util.Set<String> SCHEMES=java.util.Set.of("postgresql","postgres");}
}
