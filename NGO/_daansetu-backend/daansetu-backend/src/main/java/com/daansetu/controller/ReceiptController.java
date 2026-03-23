package com.daansetu.controller;

import com.daansetu.dto.response.ApiResponse;
import com.daansetu.dto.response.ReceiptResponse;
import com.daansetu.entity.User;
import com.daansetu.repository.UserRepository;
import com.daansetu.service.ReceiptService;
import com.daansetu.util.QrCodeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/receipts")
@RequiredArgsConstructor
public class ReceiptController {

    private final ReceiptService receiptService;
    private final UserRepository userRepository;
    private final QrCodeGenerator qrCodeGenerator;

    @GetMapping("/verify/{receiptNumber}")
    public ResponseEntity<ApiResponse<ReceiptResponse>> verifyReceipt(@PathVariable String receiptNumber) {
        return ResponseEntity.ok(ApiResponse.success(receiptService.verifyReceipt(receiptNumber)));
    }

    @GetMapping("/{receiptNumber}")
    public ResponseEntity<ApiResponse<ReceiptResponse>> getReceipt(
            @PathVariable String receiptNumber,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(receiptService.getReceiptByNumberForActor(
                receiptNumber,
                user.getUserId(),
                user.getRole(),
                user.getEmail()
        )));
    }

    @GetMapping("/{receiptNumber}/pdf")
    public ResponseEntity<byte[]> downloadReceiptPdf(@PathVariable String receiptNumber, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        byte[] pdf = receiptService.generateReceiptPdfForActor(
                receiptNumber,
                user.getUserId(),
                user.getRole(),
                user.getEmail()
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename("DaanSetu_Receipt_" + receiptNumber + ".pdf")
                .build());

        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }

    @GetMapping("/{receiptNumber}/qr")
    public ResponseEntity<byte[]> getReceiptQr(@PathVariable String receiptNumber, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        receiptService.getReceiptByNumberForActor(
                receiptNumber,
                user.getUserId(),
                user.getRole(),
                user.getEmail()
        );
        byte[] qr = qrCodeGenerator.generateReceiptQr(receiptNumber, "https://daansetu.org/api");
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(qr);
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<ReceiptResponse>>> getMyReceipts(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(receiptService.getReceiptsByUser(user.getUserId())));
    }
}
