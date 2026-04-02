package com.Project.ProjectZero.controller;

import com.Project.ProjectZero.dto.AdminLoginRequest;
import com.Project.ProjectZero.dto.MenuItemRequest;
import com.Project.ProjectZero.model.Hotel;
import com.Project.ProjectZero.model.MenuCategory;
import com.Project.ProjectZero.model.MenuItem;
import com.Project.ProjectZero.repository.HotelRepository;
import com.Project.ProjectZero.service.MenuService;
import com.Project.ProjectZero.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final HotelRepository hotelRepo;
    private final MenuService menuService;
    private final OrderService orderService;

    // ── Auth ──────────────────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AdminLoginRequest req) {
        return hotelRepo.findByAdminUsernameAndAdminPassword(req.getUsername(), req.getPassword())
                .<ResponseEntity<?>>map(hotel -> ResponseEntity.ok(Map.of(
                        "hotelId", hotel.getId(),
                        "hotelName", hotel.getName(),
                        "username", hotel.getAdminUsername()
                )))
                .orElse(ResponseEntity.status(401).body(Map.of("error", "Invalid credentials")));
    }

    // ── Menu Categories ───────────────────────────────────────────────────
    @GetMapping("/{hotelId}/categories")
    public ResponseEntity<List<MenuCategory>> getCategories(@PathVariable Long hotelId) {
        return ResponseEntity.ok(menuService.getCategories(hotelId));
    }

    @PostMapping("/{hotelId}/categories")
    public ResponseEntity<MenuCategory> addCategory(@PathVariable Long hotelId,
                                                     @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(menuService.createCategory(hotelId, body.get("name")));
    }

    @DeleteMapping("/{hotelId}/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long hotelId, @PathVariable Long id) {
        menuService.deleteCategory(id, hotelId);
        return ResponseEntity.noContent().build();
    }

    // ── Menu Items ────────────────────────────────────────────────────────
    @GetMapping("/{hotelId}/items")
    public ResponseEntity<List<MenuItem>> getItems(@PathVariable Long hotelId) {
        return ResponseEntity.ok(menuService.getAllMenuItems(hotelId));
    }

    @PostMapping("/{hotelId}/items")
    public ResponseEntity<MenuItem> addItem(@PathVariable Long hotelId,
                                             @RequestBody MenuItemRequest req) {
        return ResponseEntity.ok(menuService.createItem(hotelId, req));
    }

    @PutMapping("/{hotelId}/items/{id}")
    public ResponseEntity<MenuItem> updateItem(@PathVariable Long hotelId,
                                                @PathVariable Long id,
                                                @RequestBody MenuItemRequest req) {
        return ResponseEntity.ok(menuService.updateItem(id, hotelId, req));
    }

    @DeleteMapping("/{hotelId}/items/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long hotelId, @PathVariable Long id) {
        menuService.deleteItem(id, hotelId);
        return ResponseEntity.noContent().build();
    }

    // ── Orders ────────────────────────────────────────────────────────────
    @GetMapping("/{hotelId}/orders")
    public ResponseEntity<?> getAllOrders(@PathVariable Long hotelId) {
        return ResponseEntity.ok(orderService.getAllOrders(hotelId));
    }

    // ── Offline Payment (Emergency) ───────────────────────────────────────
    @PostMapping("/offline-payment")
    public ResponseEntity<?> offlinePayment(@RequestBody Map<String, String> body) {
        String orderRef = body.get("orderRef");
        String method   = body.get("method");   // CASH or CARD
        try {
            var order = orderService.updateStatus(orderRef, "PAID", method);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "orderRef", orderRef,
                    "paidVia", method,
                    "message", "Order " + orderRef + " marked as paid via " + method
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}
