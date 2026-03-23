// src/main/java/com/daansetu/util/CarbonCalculator.java
package com.daansetu.util;

public class CarbonCalculator {
    private static final double CO2_PER_RUPEE = 0.05;
    private static final double WATER_PER_RUPEE = 3.8;
    private static final double ENERGY_PER_RUPEE = 0.19;
    private static final double TREES_PER_TON_CO2 = 60;

    public static double calculateCO2Saved(double amountInRupees) {
        return Math.round(amountInRupees * CO2_PER_RUPEE * 100.0) / 100.0;
    }

    public static int calculateTreesEquivalent(double co2Kg) {
        return (int) Math.ceil((co2Kg / 1000.0) * TREES_PER_TON_CO2);
    }

    public static double calculateWaterSaved(double amountInRupees) {
        return Math.round(amountInRupees * WATER_PER_RUPEE * 100.0) / 100.0;
    }

    public static double calculateEnergySaved(double amountInRupees) {
        return Math.round(amountInRupees * ENERGY_PER_RUPEE * 100.0) / 100.0;
    }
}