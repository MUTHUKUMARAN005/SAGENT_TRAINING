// src/main/java/com/daansetu/enums/DonationType.java
package com.daansetu.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Locale;

public enum DonationType {
    MONEY, FOOD, CLOTHES, BOOKS, MEDICINE, OTHER;

    @JsonCreator
    public static DonationType fromValue(String rawValue) {
        if (rawValue == null) {
            return null;
        }

        String normalized = rawValue.trim().toUpperCase(Locale.ROOT);
        if (normalized.isEmpty()) {
            return null;
        }

        if ("PHYSICAL".equals(normalized)) {
            // Keep older clients working: PHYSICAL is treated as generic non-monetary type.
            return OTHER;
        }

        try {
            return DonationType.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid donationType: " + rawValue +
                            ". Supported values: MONEY, FOOD, CLOTHES, BOOKS, MEDICINE, OTHER (PHYSICAL is accepted as alias of OTHER)."
            );
        }
    }
}