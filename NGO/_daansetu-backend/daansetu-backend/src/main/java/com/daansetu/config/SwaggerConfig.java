// src/main/java/com/daansetu/config/SwaggerConfig.java
package com.daansetu.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Value("${app.backend-url:http://localhost:8080/api}")
    private String backendUrl;

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("DaanSetu API")
                        .version("1.0.0")
                        .description("""
                                Complete REST API for DaanSetu - Transparent Donation Platform.
                                
                                Features:
                                - 🔐 JWT Authentication (Email/Password + OTP)
                                - 💰 Donation Management
                                - 🎯 Campaign Management
                                - 🧾 Receipt Generation (PDF + Email)
                                - 🔗 Blockchain Tracking
                                - 🌿 Carbon Footprint
                                - 🔔 Real-time Notifications (WebSocket)
                                - 📱 SMS/OTP Service
                                - 🗺️ NGO/Map Data
                                
                                Test Credentials:
                                - Admin: admin@daansetu.org / password123
                                - Donor: priya@donor.com / password123
                                - NGO: sneha@ngo.com / password123
                                - Volunteer: anita@volunteer.com / password123
                                """)
                        .contact(new Contact()
                                .name("DaanSetu Team")
                                .email("support@daansetu.org")
                                .url("https://daansetu.org"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server().url(backendUrl).description("Local Development"),
                        new Server().url("https://api.daansetu.org/api").description("Production")))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .bearerFormat("JWT")
                                        .scheme("bearer")
                                        .description("Enter JWT token from /auth/login response")));
    }
}
