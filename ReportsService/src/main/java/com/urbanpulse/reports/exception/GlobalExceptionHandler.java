package com.urbanpulse.reports.exception;

import com.urbanpulse.reports.dto.ProblemDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ReportNotFoundException.class)
    public ResponseEntity<ProblemDetails> handleNotFound(ReportNotFoundException ex, HttpServletRequest req) {
        return ResponseEntity.status(404).body(new ProblemDetails(
                "https://api.urbanpulse.example.com/errors/not-found",
                "Report not found", 404, ex.getMessage(), req.getRequestURI()
        ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetails> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return ResponseEntity.status(400).body(new ProblemDetails(
                "https://api.urbanpulse.example.com/errors/invalid-request",
                "Invalid request", 400, detail, req.getRequestURI()
        ));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ProblemDetails> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest req) {
        String detail = ex.getConstraintViolations().stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .collect(Collectors.joining(", "));
        return ResponseEntity.status(400).body(new ProblemDetails(
                "https://api.urbanpulse.example.com/errors/invalid-request",
                "Invalid request", 400, detail, req.getRequestURI()
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetails> handleGeneric(Exception ex, HttpServletRequest req) {
        return ResponseEntity.status(500).body(new ProblemDetails(
                "https://api.urbanpulse.example.com/errors/internal-error",
                "Internal server error", 500, null, req.getRequestURI()
        ));
    }
}
