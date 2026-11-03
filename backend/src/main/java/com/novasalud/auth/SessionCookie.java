package com.novasalud.auth;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
@Component
public class SessionCookie {
    public static final String NAME="nova_session";
    private final boolean secure;
    public SessionCookie(@Value("${nova.cookie-secure}") boolean secure){this.secure=secure;}
    public String read(HttpServletRequest request){
        if(request.getCookies()!=null)for(var cookie:request.getCookies())if(NAME.equals(cookie.getName())&&cookie.getValue().matches("[a-f0-9]{64}"))return cookie.getValue();return null;
    }
    public void write(HttpServletResponse response,String token){response.addHeader("Set-Cookie",ResponseCookie.from(NAME,token).httpOnly(true).secure(secure).sameSite("Strict").path("/").maxAge(token.isEmpty()?0:28800).build().toString());}
}
