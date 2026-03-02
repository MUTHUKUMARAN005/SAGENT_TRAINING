package com.healthcare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class HealthcareApplication {

    public static void main(String[] args) {
        // Generate hash for password123
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode("password123");
        System.out.println("===========================================");
        System.out.println("USE THIS HASH: " + hash);
        System.out.println("===========================================");

        SpringApplication.run(HealthcareApplication.class, args);
    }
}