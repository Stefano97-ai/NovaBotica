package com.novasalud.modules.health.repository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
@Repository
public class HealthRepository {
    private final JdbcTemplate jdbc;public HealthRepository(JdbcTemplate jdbc){this.jdbc=jdbc;}
    public String latestMigration(){jdbc.queryForObject("SELECT 1",Integer.class);return jdbc.queryForObject("SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1",String.class);}
}
