package com.novasalud.config;

import com.novasalud.auth.SessionFilter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain chain(HttpSecurity http, SessionFilter filter) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .formLogin(login -> login.disable())
            .httpBasic(basic -> basic.disable())
            .logout(logout -> logout.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .dispatcherTypeMatchers(jakarta.servlet.DispatcherType.ERROR, jakarta.servlet.DispatcherType.FORWARD).permitAll()
                .requestMatchers(
                    "/", "/index.html", "/favicon.ico", "/assets/**",
                    "/manifest.json", "/*.png", "/*.svg", "/*.ico",
                    "/login", "/ventas/**", "/comprobantes/**", "/productos/**",
                    "/inventario/**", "/compras/**", "/proveedores/**", "/reportes/**", "/usuarios/**"
                ).permitAll()
                .requestMatchers("/api/health", "/api/health/db", "/api/auth/login", "/api/auth/logout").permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .addFilterBefore(filter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(e -> e
                .authenticationEntryPoint((req, res, error) -> {
                    res.setStatus(401);
                    res.setContentType("application/json");
                    res.getWriter().write("{\"statusCode\":401,\"message\":\"Inicia sesión para continuar.\"}");
                })
                .accessDeniedHandler((req, res, error) -> {
                    res.setStatus(403);
                    res.setContentType("application/json");
                    res.getWriter().write("{\"statusCode\":403,\"message\":\"No tienes permisos suficientes para esta operación.\"}");
                })
            )
            .build();
    }

    @Bean
    public FilterRegistrationBean<SessionFilter> disableDuplicateRegistration(SessionFilter filter) {
        var registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }
}
