package com.Project.ProjectZero.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.*;
import java.util.UUID;
import java.io.IOException;

@RestController
@RequestMapping("/api/images")
public class ImageController {
    private final Path storageFolder = Paths.get("media/uploads");

    public ImageController() {
        try { Files.createDirectories(storageFolder); } catch (IOException e) {}
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), this.storageFolder.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            return ResponseEntity.ok("/api/images/" + filename);
        } catch (IOException e) {
             return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serveImage(@PathVariable String filename) {
        try {
            Path file = storageFolder.resolve(filename);
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                 return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"").body(resource);
            } else {
                 return ResponseEntity.notFound().build();
            }
        } catch(Exception e) {
             return ResponseEntity.notFound().build();
        }
    }
}
