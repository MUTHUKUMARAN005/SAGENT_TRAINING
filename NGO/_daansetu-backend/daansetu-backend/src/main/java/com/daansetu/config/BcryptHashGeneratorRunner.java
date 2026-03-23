package com.daansetu.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class BcryptHashGeneratorRunner implements CommandLineRunner {

    private final PasswordEncoder passwordEncoder;

    @Value("${app.security.print-bcrypt-samples:false}")
    private boolean printBcryptSamples;

    @Override
    public void run(String... args) {
        if (!printBcryptSamples) {
            return;
        }

        Map<String, String> defaults = new LinkedHashMap<>();
        defaults.put("admin", "admin123");
        defaults.put("donor", "donor123");
        defaults.put("ngo", "ngo123");
        defaults.put("volunteer", "volunteer123");

        log.info("BCrypt sample hash generator enabled. Use output for DB updates.");
        defaults.forEach((role, rawPassword) -> {
            String hash = passwordEncoder.encode(rawPassword);
            log.info("role={}, rawPassword={}, bcrypt={}", role, rawPassword, hash);
        });
    }
}
