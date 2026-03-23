package com.daansetu.enums;

import com.daansetu.dto.request.DonationRequestDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DonationTypeJsonTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void shouldMapPhysicalAliasToOther() throws Exception {
        DonationRequestDTO dto = objectMapper.readValue(
                "{\"campaignId\":1,\"donationType\":\"PHYSICAL\",\"amount\":100}",
                DonationRequestDTO.class
        );

        assertEquals(DonationType.OTHER, dto.getDonationType());
    }

    @Test
    void shouldStillMapStandardValues() throws Exception {
        DonationRequestDTO dto = objectMapper.readValue(
                "{\"campaignId\":1,\"donationType\":\"MONEY\",\"amount\":100}",
                DonationRequestDTO.class
        );

        assertEquals(DonationType.MONEY, dto.getDonationType());
    }

    @Test
    void shouldRejectUnknownDonationType() {
        assertThrows(
                Exception.class,
                () -> objectMapper.readValue(
                        "{\"campaignId\":1,\"donationType\":\"INVALID\",\"amount\":100}",
                        DonationRequestDTO.class
                )
        );
    }
}
