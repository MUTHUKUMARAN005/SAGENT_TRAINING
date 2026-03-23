package com.daansetu.enums;

public enum ProofType {
    PICKUP,
    DELIVERY;

    public static ProofType fromValue(String value) {
        if (value == null) {
            throw new IllegalArgumentException("Proof type is required");
        }
        return ProofType.valueOf(value.trim().toUpperCase());
    }
}
