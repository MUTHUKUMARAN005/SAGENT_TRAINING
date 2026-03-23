// src/main/java/com/daansetu/service/CarbonFootprintService.java
package com.daansetu.service;

import com.daansetu.dto.response.CarbonFootprintResponse;
import com.daansetu.repository.DonationRepository;
import com.daansetu.util.CarbonCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CarbonFootprintService {

    private final DonationRepository donationRepository;

    public CarbonFootprintResponse calculateFootprint(Long userId) {
        BigDecimal totalDonated = donationRepository.getTotalDonationsByUser(userId);
        double amount = totalDonated != null ? totalDonated.doubleValue() : 0;

        double co2 = CarbonCalculator.calculateCO2Saved(amount);
        int trees = CarbonCalculator.calculateTreesEquivalent(co2);
        double water = CarbonCalculator.calculateWaterSaved(amount);
        double energy = CarbonCalculator.calculateEnergySaved(amount);

        return CarbonFootprintResponse.builder()
                .co2SavedKg(co2)
                .treesEquivalent(trees)
                .waterSavedLiters(water)
                .energySavedKwh(energy)
                .breakdown(List.of(
                        CarbonFootprintResponse.Breakdown.builder()
                                .category("Food Waste Prevented").percentage(35).detail("450 kg prevented").build(),
                        CarbonFootprintResponse.Breakdown.builder()
                                .category("Clothing Reused").percentage(25).detail("320 kg reused").build(),
                        CarbonFootprintResponse.Breakdown.builder()
                                .category("Digital Education").percentage(22).detail("15,000 pages saved").build(),
                        CarbonFootprintResponse.Breakdown.builder()
                                .category("Transport Efficiency").percentage(18).detail("85 trips optimized").build()
                ))
                .equivalents(List.of(
                        CarbonFootprintResponse.Equivalent.builder()
                                .value((int)(co2 / 4.6)).label("car trips saved").icon("🚗").build(),
                        CarbonFootprintResponse.Equivalent.builder()
                                .value(trees).label("trees planted").icon("🌳").build(),
                        CarbonFootprintResponse.Equivalent.builder()
                                .value((int)(co2 * 40)).label("bottles recycled").icon("♻️").build()
                ))
                .build();
    }
}