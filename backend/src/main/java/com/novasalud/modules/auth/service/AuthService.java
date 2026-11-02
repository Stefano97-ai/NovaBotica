package com.novasalud.modules.auth.service;
import com.novasalud.modules.auth.model.*;
import com.novasalud.modules.auth.repository.AuthRepository;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
@Service
public class AuthService {
    public record LoginResult(String token,SessionUser user) {}
    private final AuthRepository repository;private final PasswordService passwords;private final String dummy;
    public AuthService(AuthRepository repository,PasswordService passwords){this.repository=repository;this.passwords=passwords;dummy=passwords.hash(passwords.randomHex(32));}
    public LoginResult login(String username,String password,String ip,String oldToken) {
        String normalized=username.trim().toLowerCase(Locale.ROOT);
        if(repository.consumeAttempt(PasswordService.sha256("ip:"+ip))>30)throw limited();
        if(repository.consumeAttempt(PasswordService.sha256("account:"+normalized))>10)throw limited();
        Account account=repository.findUser(normalized).orElse(null);
        String hash=account==null?dummy:account.passwordHash();boolean valid=passwords.verify(password,hash);
        if(account==null || !account.active() || !valid)throw unauthorized();
        String token=passwords.randomHex(32);
        if(!repository.createSession(account.user().id(),PasswordService.sha256(token),oldToken==null?null:PasswordService.sha256(oldToken)))throw unauthorized();
        return new LoginResult(token,account.user());
    }
    public SessionUser authenticate(String token) {
        if(token==null)throw unauthorized();return repository.findSession(PasswordService.sha256(token)).orElseThrow(AuthService::unauthorized);
    }
    public void logout(String token){if(token!=null)repository.deleteSession(PasswordService.sha256(token));}
    private static ResponseStatusException unauthorized(){return new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Usuario o contraseña incorrectos.");}
    private static ResponseStatusException limited(){return new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,"Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.");}
}
