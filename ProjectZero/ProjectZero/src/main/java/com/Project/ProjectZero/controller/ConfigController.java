package com.Project.ProjectZero.controller;

import com.Project.ProjectZero.model.AppConfig;
import com.Project.ProjectZero.repository.AppConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ConfigController {
    
    private final AppConfigRepository appConfigRepo;

    @GetMapping("/api/config/{hotelId}")
    public ResponseEntity<AppConfig> getConfig(@PathVariable Long hotelId) {
        return appConfigRepo.findById(hotelId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.ok(AppConfig.builder()
                        .hotelId(hotelId)
                        .appName("Hotel Menu")
                        .primaryColor("#fa541c")
                        .secondaryColor("#ff7a45")
                        .fontFamily("Inter, sans-serif")
                        .build())); // default fallback
    }

    @PutMapping("/api/admin/config/{hotelId}")
    public ResponseEntity<AppConfig> updateConfig(@PathVariable Long hotelId, @RequestBody AppConfig req) {
        req.setHotelId(hotelId);
        return ResponseEntity.ok(appConfigRepo.save(req));
    }
}
