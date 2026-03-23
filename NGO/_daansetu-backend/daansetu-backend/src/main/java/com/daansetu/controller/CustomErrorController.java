package com.daansetu.controller;

import com.daansetu.dto.response.ApiResponse;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Replaces Tomcat's default HTML error pages with JSON ApiResponse.
 * Handles all errors that occur before Spring MVC (e.g. malformed request body,
 * wrong Content-Type, missing body) so the client always gets clean JSON.
 */
@RestController
@RequestMapping("/error")
public class CustomErrorController implements ErrorController {

    @RequestMapping
    public ResponseEntity<ApiResponse<?>> handleError(HttpServletRequest request) {
        Object statusAttr    = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        Object messageAttr   = request.getAttribute(RequestDispatcher.ERROR_MESSAGE);
        Object exceptionAttr = request.getAttribute(RequestDispatcher.ERROR_EXCEPTION);

        int statusCode = 500;
        if (statusAttr != null) {
            try { statusCode = Integer.parseInt(statusAttr.toString()); } catch (NumberFormatException ignored) {}
        }

        String message = null;

        if (messageAttr != null && !messageAttr.toString().isBlank()) {
            message = messageAttr.toString();
        } else if (exceptionAttr instanceof Exception ex && ex.getMessage() != null) {
            message = ex.getMessage();
        }

        if (message == null || message.isBlank()) {
            message = switch (statusCode) {
                case 400 -> "Bad request. Check Content-Type is application/json and body is valid JSON.";
                case 401 -> "Unauthorized. A valid JWT token is required.";
                case 403 -> "Access denied.";
                case 404 -> "Resource not found.";
                case 405 -> "HTTP method not allowed.";
                case 415 -> "Unsupported media type. Use Content-Type: application/json.";
                default  -> "An unexpected error occurred.";
            };
        }

        HttpStatus httpStatus;
        try {
            httpStatus = HttpStatus.valueOf(statusCode);
        } catch (IllegalArgumentException e) {
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        return ResponseEntity.status(httpStatus).body(ApiResponse.error(message));
    }
}

