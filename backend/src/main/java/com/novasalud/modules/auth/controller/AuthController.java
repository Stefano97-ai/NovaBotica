package com.novasalud.modules.auth.controller;
import com.novasalud.modules.auth.dto.*;
import com.novasalud.modules.auth.model.SessionUser;
import com.novasalud.modules.auth.service.AuthService;
import com.novasalud.modules.auth.security.SessionCookie;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService service;private final SessionCookie cookies;
    public AuthController(AuthService service,SessionCookie cookies){this.service=service;this.cookies=cookies;}
    @PostMapping("/login") public UserResponse login(@Valid @RequestBody LoginRequest input,HttpServletRequest request,HttpServletResponse response){
        var result=service.login(input.username(),input.password(),request.getRemoteAddr(),cookies.read(request));cookies.write(response,result.token());return new UserResponse(result.user());
    }
    @GetMapping("/me") public UserResponse me(@AuthenticationPrincipal SessionUser user){return new UserResponse(user);}
    @PostMapping("/logout") @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request,HttpServletResponse response){service.logout(cookies.read(request));cookies.write(response,"");}
}
