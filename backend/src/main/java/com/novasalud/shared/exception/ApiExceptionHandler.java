package com.novasalud.shared.exception;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;
@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<?> status(ResponseStatusException error) {return ResponseEntity.status(error.getStatusCode()).body(Map.of("statusCode",error.getStatusCode().value(),"message",error.getReason()==null?"Solicitud rechazada":error.getReason()));}
    @ExceptionHandler({MethodArgumentNotValidException.class,HttpMessageNotReadableException.class})
    ResponseEntity<?> invalid(Exception error) {return ResponseEntity.badRequest().body(Map.of("statusCode",400,"message","Revisa tu usuario y contraseña."));}
    @ExceptionHandler(org.springframework.dao.DataAccessException.class)
    ResponseEntity<?> database(Exception error) {return ResponseEntity.status(503).body(Map.of("statusCode",503,"message","El servicio no está disponible. Inténtalo de nuevo."));}
}
