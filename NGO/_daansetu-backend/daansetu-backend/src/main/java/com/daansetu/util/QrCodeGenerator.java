package com.daansetu.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
public class QrCodeGenerator {

    public byte[] generateQrCode(String text, int width, int height) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();

            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.MARGIN, 1);

            BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, width, height, hints);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);

            log.debug("QR code generated for: {}", text.substring(0, Math.min(50, text.length())));
            return outputStream.toByteArray();

        } catch (WriterException | IOException e) {
            log.error("Failed to generate QR code: {}", e.getMessage());
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }

    public byte[] generateReceiptQr(String receiptNumber, String verifyUrl) {
        String qrContent = verifyUrl + "/receipts/verify/" + receiptNumber;
        return generateQrCode(qrContent, 200, 200);
    }

    public byte[] generateUpiQr(String upiId, String name, String amount) {
        String upiUrl = String.format(
                "upi://pay?pa=%s&pn=%s&am=%s&cu=INR&tn=DaanSetu+Donation",
                upiId, name, amount
        );
        return generateQrCode(upiUrl, 300, 300);
    }
}