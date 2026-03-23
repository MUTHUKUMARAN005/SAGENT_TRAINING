package com.daansetu.util;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReceiptPdfGenerator {

    private static final BaseColor PRIMARY_COLOR = new BaseColor(59, 130, 246);
    private static final BaseColor DARK_COLOR = new BaseColor(15, 23, 42);
    private static final BaseColor GRAY_COLOR = new BaseColor(148, 163, 184);
    private static final BaseColor GREEN_COLOR = new BaseColor(34, 197, 94);
    private static final BaseColor WHITE_COLOR = BaseColor.WHITE;

    private static final Font TITLE_FONT = new Font(Font.FontFamily.HELVETICA, 24, Font.BOLD, WHITE_COLOR);
    private static final Font HEADER_FONT = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD, PRIMARY_COLOR);
    private static final Font LABEL_FONT = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, GRAY_COLOR);
    private static final Font VALUE_FONT = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, DARK_COLOR);
    private static final Font AMOUNT_FONT = new Font(Font.FontFamily.HELVETICA, 22, Font.BOLD, WHITE_COLOR);
    private static final Font SMALL_FONT = new Font(Font.FontFamily.HELVETICA, 8, Font.NORMAL, GRAY_COLOR);

    public byte[] generateReceipt(String receiptNumber, String donorName, String donorEmail,
                                  String donorPhone, String donorPan, BigDecimal amount,
                                  String campaignTitle, String ngoName, String donationType,
                                  String paymentMethod, String transactionId,
                                  LocalDateTime donationDate) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            BigDecimal safeAmount = amount != null ? amount : BigDecimal.ZERO;
            Document document = new Document(PageSize.A4, 40, 40, 30, 30);
            PdfWriter.getInstance(document, baos);
            document.open();

            // Header
            PdfPTable headerTable = new PdfPTable(1);
            headerTable.setWidthPercentage(100);

            PdfPCell headerCell = new PdfPCell();
            headerCell.setBackgroundColor(PRIMARY_COLOR);
            headerCell.setPadding(25);
            headerCell.setBorder(Rectangle.NO_BORDER);

            Paragraph headerText = new Paragraph();
            headerText.add(new Chunk("❤ DaanSetu\n", TITLE_FONT));
            headerText.add(new Chunk("Donation Receipt", new Font(Font.FontFamily.HELVETICA, 12, Font.NORMAL, new BaseColor(191, 219, 254))));
            headerText.setAlignment(Element.ALIGN_CENTER);
            headerCell.addElement(headerText);
            headerTable.addCell(headerCell);
            document.add(headerTable);

            document.add(new Paragraph(" "));

            // Receipt Info
            Paragraph receiptInfo = new Paragraph();
            receiptInfo.setAlignment(Element.ALIGN_CENTER);
            receiptInfo.add(new Chunk("Receipt No: " + receiptNumber + "\n", HEADER_FONT));
            receiptInfo.add(new Chunk("Date: " + donationDate.format(DateTimeFormatter.ofPattern("dd MMMM yyyy, hh:mm a")), LABEL_FONT));
            document.add(receiptInfo);

            document.add(new Paragraph(" "));

            // Donor Details
            document.add(new Paragraph("DONOR DETAILS", HEADER_FONT));
            document.add(createInfoTable(new String[][]{
                    {"Name", donorName != null ? donorName : "Anonymous"},
                    {"Email", donorEmail != null ? donorEmail : "N/A"},
                    {"Phone", donorPhone != null ? donorPhone : "N/A"},
                    {"PAN", donorPan != null ? donorPan : "N/A"}
            }));

            document.add(new Paragraph(" "));

            // Donation Details
            document.add(new Paragraph("DONATION DETAILS", HEADER_FONT));
            document.add(createInfoTable(new String[][]{
                    {"Campaign", campaignTitle},
                    {"NGO", ngoName},
                    {"Type", donationType},
                    {"Payment Method", paymentMethod},
                    {"Transaction ID", transactionId}
            }));

            document.add(new Paragraph(" "));

            // Amount Box
            PdfPTable amountTable = new PdfPTable(1);
            amountTable.setWidthPercentage(100);

            PdfPCell amountCell = new PdfPCell();
            amountCell.setBackgroundColor(PRIMARY_COLOR);
            amountCell.setPadding(20);
            amountCell.setBorder(Rectangle.NO_BORDER);

            Paragraph amountPara = new Paragraph();
            amountPara.add(new Chunk("TOTAL AMOUNT\n", new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, new BaseColor(191, 219, 254))));
            amountPara.add(new Chunk("₹ " + String.format("%,.2f", safeAmount), AMOUNT_FONT));
            amountPara.setAlignment(Element.ALIGN_CENTER);
            amountCell.addElement(amountPara);
            amountTable.addCell(amountCell);
            document.add(amountTable);

            document.add(new Paragraph(" "));

            // Tax Info
            Paragraph taxInfo = new Paragraph();
            taxInfo.add(new Chunk("✓ ", new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD, GREEN_COLOR)));
            taxInfo.add(new Chunk("This donation is eligible for tax deduction under Section 80G of the Income Tax Act, 1961.", SMALL_FONT));
            document.add(taxInfo);

            document.add(new Paragraph(" "));

            // Footer
            Paragraph footer = new Paragraph();
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.add(new Chunk("This is a computer-generated receipt. No signature required.\n", SMALL_FONT));
            footer.add(new Chunk("DaanSetu Foundation | CIN: U85100MH2024NPL123456\n", SMALL_FONT));
            footer.add(new Chunk("www.daansetu.org | support@daansetu.org", SMALL_FONT));
            document.add(footer);

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Failed to generate receipt PDF: {}", e.getMessage());
            throw new RuntimeException("Failed to generate receipt PDF", e);
        }
    }

    private PdfPTable createInfoTable(String[][] data) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{35, 65});

        for (String[] row : data) {
            PdfPCell labelCell = new PdfPCell(new Phrase(row[0], LABEL_FONT));
            labelCell.setBorder(Rectangle.BOTTOM);
            labelCell.setBorderColor(new BaseColor(226, 232, 240));
            labelCell.setPadding(8);

            PdfPCell valueCell = new PdfPCell(new Phrase(row[1], VALUE_FONT));
            valueCell.setBorder(Rectangle.BOTTOM);
            valueCell.setBorderColor(new BaseColor(226, 232, 240));
            valueCell.setPadding(8);
            valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);

            table.addCell(labelCell);
            table.addCell(valueCell);
        }

        return table;
    }
}