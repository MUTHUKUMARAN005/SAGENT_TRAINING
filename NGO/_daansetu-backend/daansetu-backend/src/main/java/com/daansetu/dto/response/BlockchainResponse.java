// src/main/java/com/daansetu/dto/response/BlockchainResponse.java
package com.daansetu.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BlockchainResponse {
    private String txHash;
    private Long blockNumber;
    private String fromAddress;
    private String toAddress;
    private BigDecimal amount;
    private String status;
    private Integer confirmations;
    private String network;
    private LocalDateTime timestamp;
    private List<TrailStep> donationTrail;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TrailStep {
        private int step;
        private String title;
        private String subtitle;
        private String status;
        private String txHash;
        private LocalDateTime timestamp;
    }
}