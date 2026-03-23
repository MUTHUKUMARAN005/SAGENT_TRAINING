// src/main/java/com/daansetu/exception/BadRequestException.java
package com.daansetu.exception;

public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}