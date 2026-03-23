package com.daansetu.controller;

import com.daansetu.dto.response.ApiResponse;
import com.daansetu.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "general") String category) {
        String filePath = fileStorageService.storeFile(file, category);
        return ResponseEntity.ok(ApiResponse.success("File uploaded",
                Map.of("filePath", filePath, "url", "/api/files/" + filePath)));
    }

    @GetMapping("/{category}/{filename}")
    public ResponseEntity<byte[]> getFile(
            @PathVariable String category,
            @PathVariable String filename) {
        byte[] fileData = fileStorageService.loadFile(category + "/" + filename);

        String contentType = filename.endsWith(".pdf") ? "application/pdf" : "image/png";
        if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) contentType = "image/jpeg";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(fileData);
    }

    @DeleteMapping("/{category}/{filename}")
    public ResponseEntity<ApiResponse<String>> deleteFile(
            @PathVariable String category,
            @PathVariable String filename) {
        boolean deleted = fileStorageService.deleteFile(category + "/" + filename);
        return ResponseEntity.ok(ApiResponse.success(deleted ? "File deleted" : "File not found"));
    }
}