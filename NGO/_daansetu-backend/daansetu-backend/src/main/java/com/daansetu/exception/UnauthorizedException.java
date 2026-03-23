// src/main/java/com/daansetu/exception/UnauthorizedException.java
package com.daansetu.exception;

public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}