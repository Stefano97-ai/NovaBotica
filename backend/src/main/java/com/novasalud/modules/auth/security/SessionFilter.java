package com.novasalud.modules.auth.security;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.novasalud.modules.auth.service.AuthService;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
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
    private final AuthService auth;private final SessionCookie cookies;private final ObjectMapper json;private final Set<String> origins;
    public SessionFilter(AuthService auth,SessionCookie cookies,ObjectMapper json,@Value("${nova.allowed-origins}") String origins){this.auth=auth;this.cookies=cookies;this.json=json;this.origins=new HashSet<>(Arrays.stream(origins.split(",")).map(String::trim).toList());}
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws ServletException,IOException {
        response.setHeader("Cache-Control","no-store");response.setHeader("X-Content-Type-Options","nosniff");
        if(!Set.of("GET","HEAD","OPTIONS").contains(request.getMethod())) {
            String origin=request.getHeader("Origin");
            if(!"web".equals(request.getHeader("X-Nova-Client")) || (origin!=null&&!origins.contains(origin))) {error(response,403,"Origen de solicitud no permitido.");return;}
        }
        String path=request.getRequestURI().substring(request.getContextPath().length());
        boolean publicPath=(request.getMethod().equals("GET")&&(path.equals("/api/health")||path.equals("/api/health/db")))
            || (request.getMethod().equals("POST")&&(path.equals("/api/auth/login")||path.equals("/api/auth/logout")));
        if(!publicPath){
            try{
                var user=auth.authenticate(cookies.read(request));
                SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user,null,List.of(new SimpleGrantedAuthority("ROLE_"+user.rol()))));
            }catch(ResponseStatusException exception){error(response,401,"Tu sesión terminó. Inicia sesión para continuar.");return;}
            catch(org.springframework.dao.DataAccessException exception){error(response,503,"El servicio no está disponible.");return;}
        }
        chain.doFilter(request,response);
    }
    private void error(HttpServletResponse response,int status,String message)throws IOException{response.setStatus(status);response.setContentType("application/json");json.writeValue(response.getOutputStream(),Map.of("statusCode",status,"message",message));}
}
