package com.daansetu.controller;

import com.daansetu.dto.response.ApiResponse;
import com.daansetu.service.PaymentService;
import com.daansetu.util.QrCodeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final QrCodeGenerator qrCodeGenerator;

    @GetMapping("/donation/{donationId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentByDonation(@PathVariable Long donationId) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.getPaymentSummaryByDonationId(donationId)));
    }

    @GetMapping("/qr/upi")
    public ResponseEntity<byte[]> generateUpiQr(
            @RequestParam String amount,
            @RequestParam(defaultValue = "daansetu@upi") String upiId) {
        byte[] qr = qrCodeGenerator.generateUpiQr(upiId, "DaanSetu", amount);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(qr);
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentStats() {
        return ResponseEntity.ok(ApiResponse.success(paymentService.getPaymentStats()));
    }
}
