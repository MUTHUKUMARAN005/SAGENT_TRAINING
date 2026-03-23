package com.daansetu.service;

import com.daansetu.dto.request.DonationRequestDTO;
import com.daansetu.dto.response.DonationResponse;
import com.daansetu.enums.DonationType;
import com.daansetu.enums.PaymentMethod;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class DonationServiceTest {

    @Autowired
    private DonationService donationService;

    @Test
    void makeDonation_ShouldCreateDonationSuccessfully() {
        DonationRequestDTO request = new DonationRequestDTO();
        request.setCampaignId(1L);
        request.setDonationType(DonationType.MONEY);
        request.setAmount(new BigDecimal("1000"));
        request.setPaymentMethod(PaymentMethod.UPI);
        request.setTransactionId("TEST_TXN_" + System.currentTimeMillis());
        request.setMessage("Test donation");
        request.setAnonymous(false);

        DonationResponse response = donationService.makeDonation(2L, request);

        assertNotNull(response);
        assertNotNull(response.getDonationId());
        assertNotNull(response.getReceiptNumber());
        assertEquals("COMPLETED", response.getDonationStatus().name());
        assertEquals(0, new BigDecimal("1000").compareTo(response.getAmount()));
    }
}