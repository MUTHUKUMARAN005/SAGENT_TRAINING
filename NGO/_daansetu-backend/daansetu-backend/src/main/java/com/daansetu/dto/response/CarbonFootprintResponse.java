// src/main/java/com/daansetu/dto/response/CarbonFootprintResponse.java
package com.daansetu.dto.response;

import lombok.*;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CarbonFootprintResponse {
    private double co2SavedKg;
    private int treesEquivalent;
    private double waterSavedLiters;
    private double energySavedKwh;
    private List<Breakdown> breakdown;
    private List<Equivalent> equivalents;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Breakdown {
        private String category;
        private double percentage;
        private String detail;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Equivalent {
        private int value;
        private String label;
        private String icon;
    }
}