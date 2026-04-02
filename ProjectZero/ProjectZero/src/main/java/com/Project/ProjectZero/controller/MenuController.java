package com.Project.ProjectZero.controller;

import com.Project.ProjectZero.service.MenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    /**
     * GET /api/menu/{hotelId}
     * Returns full menu structured by category. Cached by Service Worker on client.
     */
    @GetMapping("/{hotelId}")
    public ResponseEntity<List<Map<String, Object>>> getMenu(@PathVariable Long hotelId) {
        return ResponseEntity.ok(menuService.getFullMenu(hotelId));
    }

    /**
     * GET /api/menu/{hotelId}/categories
     */
    @GetMapping("/{hotelId}/categories")
    public ResponseEntity<?> getCategories(@PathVariable Long hotelId) {
        return ResponseEntity.ok(menuService.getCategories(hotelId));
    }
}
