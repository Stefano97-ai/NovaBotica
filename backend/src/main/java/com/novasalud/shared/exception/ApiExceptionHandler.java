package com.novasalud.shared.exception;

import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> handleResponseStatus(ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode()).body(
            Map.of("statusCode", error.getStatusCode().value(), "message", error.getReason() == null ? "Solicitud rechazada" : error.getReason())
        );
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handleNotFound(ResourceNotFoundException error) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            Map.of("statusCode", 404, "message", error.getMessage())
        );
    }

    @ExceptionHandler({BadRequestException.class, BusinessException.class})
    public ResponseEntity<?> handleBusiness(RuntimeException error) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            Map.of("statusCode", 400, "message", error.getMessage())
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(AccessDeniedException error) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            Map.of("statusCode", 403, "message", "No tienes permisos para realizar esta operación.")
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException error) {
        String message = error.getBindingResult().getFieldErrors().stream()
            .map(DefaultMessageSourceResolvable::getDefaultMessage)
            .collect(Collectors.joining("; "));
        if (message.isBlank()) {
            message = "Los datos enviados son inválidos.";
        }
        return ResponseEntity.badRequest().body(
            Map.of("statusCode", 400, "message", message)
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleNotReadable(HttpMessageNotReadableException error) {
        return ResponseEntity.badRequest().body(
            Map.of("statusCode", 400, "message", "Cuerpo de solicitud mal formado o inválido.")
        );
    }

    @ExceptionHandler(org.springframework.dao.DataAccessException.class)
    public ResponseEntity<?> handleDatabase(Exception error) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
            Map.of("statusCode", 503, "message", "Error al procesar la operación en la base de datos.")
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneral(Exception error) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            Map.of("statusCode", 500, "message", "Ocurrió un error inesperado en el servidor.")
        );
    }
}
