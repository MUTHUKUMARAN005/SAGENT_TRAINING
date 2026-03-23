// src/main/java/com/daansetu/DaanSetuApplication.java
package com.daansetu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class DaanSetuApplication {

    public static void main(String[] args) {
        SpringApplication.run(DaanSetuApplication.class, args);
        System.out.println("""
            
            ╔══════════════════════════════════════════════════════╗
            ║                                                      ║
            ║   ❤️  DaanSetu Backend Started Successfully!         ║
            ║                                                      ║
            ║   🌐 API:       http://localhost:8080/api            ║
            ║   📖 Swagger:   http://localhost:8080/api/swagger-ui ║
            ║   🔌 WebSocket: ws://localhost:8080/api/ws           ║
            ║   💚 Health:    http://localhost:8080/api/actuator    ║
            ║   ☕ Java:      %s                                   ║
            ║                                                      ║
            ╚══════════════════════════════════════════════════════╝
            """.formatted(System.getProperty("java.version")));
    }
}