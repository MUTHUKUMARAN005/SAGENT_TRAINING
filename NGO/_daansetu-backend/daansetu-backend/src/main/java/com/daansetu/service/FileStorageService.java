package com.daansetu.service;

import com.daansetu.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    @Value("${file.max-size:10485760}")
    private long maxFileSize;

    private Path fileStorageLocation;

    @PostConstruct
    public void init() {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
            Files.createDirectories(this.fileStorageLocation.resolve("receipts"));
            Files.createDirectories(this.fileStorageLocation.resolve("screenshots"));
            Files.createDirectories(this.fileStorageLocation.resolve("profiles"));
            Files.createDirectories(this.fileStorageLocation.resolve("campaigns"));
            Files.createDirectories(this.fileStorageLocation.resolve("proofs"));
            log.info("File storage initialized at: {}", this.fileStorageLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directories", e);
        }
    }

    public String storeFile(MultipartFile file, String subDirectory) {
        if (file.isEmpty()) {
            throw new BadRequestException("Cannot upload empty file");
        }

        if (file.getSize() > maxFileSize) {
            throw new BadRequestException("File size exceeds maximum limit of 10MB");
        }

        String originalFilename = StringUtils.cleanPath(
                Objects.requireNonNull(file.getOriginalFilename()));

        if (originalFilename.contains("..")) {
            throw new BadRequestException("Invalid file path: " + originalFilename);
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
            throw new BadRequestException("Only image and PDF files are allowed");
        }

        // Generate unique filename
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String newFilename = UUID.randomUUID().toString() + extension;

        try {
            Path targetDir = this.fileStorageLocation.resolve(subDirectory);
            Files.createDirectories(targetDir);
            Path targetLocation = targetDir.resolve(newFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String storedPath = subDirectory + "/" + newFilename;
            log.info("File stored: {}", storedPath);
            return storedPath;

        } catch (IOException e) {
            throw new RuntimeException("Could not store file: " + originalFilename, e);
        }
    }

    public byte[] loadFile(String filePath) {
        try {
            Path path = this.fileStorageLocation.resolve(filePath).normalize();
            if (!Files.exists(path)) {
                throw new BadRequestException("File not found: " + filePath);
            }
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new RuntimeException("Could not read file: " + filePath, e);
        }
    }

    public boolean deleteFile(String filePath) {
        try {
            Path path = this.fileStorageLocation.resolve(filePath).normalize();
            return Files.deleteIfExists(path);
        } catch (IOException e) {
            log.error("Could not delete file: {}", filePath, e);
            return false;
        }
    }
}
