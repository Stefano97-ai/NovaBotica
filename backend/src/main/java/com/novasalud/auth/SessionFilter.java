package com.novasalud.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.novasalud.auth.SessionUser;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.server.ResponseStatusException;

@Component
public class SessionFilter extends OncePerRequestFilter {

    private final AuthService auth;
    private final SessionCookie cookies;
    private final ObjectMapper json;
    private final Set<String> origins;

    public SessionFilter(
        AuthService auth,
        SessionCookie cookies,
        ObjectMapper json,
        @Value("${nova.allowed-origins:http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080,http://127.0.0.1:8080}") String origins
    ) {
        this.auth = auth;
        this.cookies = cookies;
        this.json = json;
        this.origins = new HashSet<>(Arrays.stream(origins.split(",")).map(String::trim).toList());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {

        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Content-Type-Options", "nosniff");

        String origin = request.getHeader("Origin");
        if (origin != null) {
            if (origins.contains(origin)) {
                response.setHeader("Access-Control-Allow-Origin", origin);
                response.setHeader("Access-Control-Allow-Credentials", "true");
                response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
                response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Nova-Client, X-Requested-With");
            }
        }

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        String path = request.getRequestURI().substring(request.getContextPath().length());
        if (!path.startsWith("/api/")) {
            chain.doFilter(request, response);
            return;
        }
        boolean publicPath = (request.getMethod().equals("GET") && (path.equals("/api/health") || path.equals("/api/health/db")))
            || (request.getMethod().equals("POST") && (path.equals("/api/auth/login") || path.equals("/api/auth/logout")));

        if (!publicPath) {
            String token = cookies.read(request);
            if (token == null) {
                String authHeader = request.getHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    token = authHeader.substring(7).trim();
                }
            }

            if (token == null) {
                error(response, 401, "Tu sesión terminó. Inicia sesión para continuar.");
                return;
            }

            try {
                SessionUser user = auth.authenticate(token);
                var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.rol()));
                var authToken = new UsernamePasswordAuthenticationToken(user, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authToken);
            } catch (ResponseStatusException exception) {
                error(response, 401, "Tu sesión terminó. Inicia sesión para continuar.");
                return;
            } catch (org.springframework.dao.DataAccessException exception) {
                error(response, 503, "El servicio no está disponible temporalmente.");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private void error(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        json.writeValue(response.getOutputStream(), Map.of("statusCode", status, "message", message));
    }
}
