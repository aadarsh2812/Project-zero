package com.Project.ProjectZero.controller;

import com.Project.ProjectZero.model.Hotel;
import com.Project.ProjectZero.model.Order;
import com.Project.ProjectZero.repository.*;
import com.Project.ProjectZero.model.KitchenStaff;
import com.Project.ProjectZero.service.PaymentService;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.Project.ProjectZero.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final HotelRepository hotelRepo;
    private final OrderRepository orderRepo;
    private final CustomerSessionRepository sessionRepo;
    private final BillRepository billRepo;
    private final PaymentRepository paymentRepo;
    private final FeedbackRepository feedbackRepo;
    private final PaymentService paymentService;
    private final MenuItemRepository menuItemRepo;
    private final MenuCategoryRepository categoryRepo;
    private final KitchenStaffRepository kitchenStaffRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // ===== LOGIN =====
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        Hotel hotel = hotelRepo.findByAdminUsername(username)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        if (!hotel.getAdminPassword().equals(password)) {
            throw new RuntimeException("Invalid credentials");
        }
        
        String token = jwtUtil.generateAdminToken(hotel.getId(), hotel.getAdminUsername(), hotel.getName());
        
        return ResponseEntity.ok(Map.of(
                "token", token,
                "hotelId", hotel.getId(),
                "hotelCode", hotel.getHotelCode(),
                "hotelName", hotel.getName(),
                "username", hotel.getAdminUsername()
        ));
    }

    // ===== MENU CATEGORIES =====
    @GetMapping("/{hotelId}/categories")
    public ResponseEntity<?> getCategories(@PathVariable Long hotelId) {
        return ResponseEntity.ok(categoryRepo.findByHotelIdOrderByDisplayOrderAsc(hotelId));
    }

    @PostMapping("/{hotelId}/categories")
    public ResponseEntity<?> addCategory(@PathVariable Long hotelId, @RequestBody Map<String, Object> body) {
        var cat = new com.Project.ProjectZero.model.MenuCategory();
        cat.setHotelId(hotelId);
        cat.setName((String) body.get("name"));
        cat.setDisplayOrder(body.containsKey("displayOrder") ? (Integer) body.get("displayOrder") : 0);
        return ResponseEntity.ok(categoryRepo.save(cat));
    }

    @DeleteMapping("/{hotelId}/categories/{catId}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long hotelId, @PathVariable Long catId) {
        categoryRepo.deleteById(catId);
        return ResponseEntity.ok(Map.of("message", "Category deleted"));
    }

    // ===== KITCHEN STAFF =====
    @GetMapping("/{hotelId}/staff")
    public ResponseEntity<?> getStaff(@PathVariable Long hotelId) {
        return ResponseEntity.ok(kitchenStaffRepo.findByHotelId(hotelId));
    }

    @PostMapping("/{hotelId}/staff")
    public ResponseEntity<?> addStaff(@PathVariable Long hotelId, @RequestBody Map<String, String> body) {
        KitchenStaff staff = new KitchenStaff();
        staff.setHotelId(hotelId);
        staff.setName(body.get("name"));
        staff.setUsername(body.get("username"));
        staff.setPasswordHash(passwordEncoder.encode(body.get("password")));
        return ResponseEntity.ok(kitchenStaffRepo.save(staff));
    }

    @DeleteMapping("/{hotelId}/staff/{staffId}")
    public ResponseEntity<?> deleteStaff(@PathVariable Long hotelId, @PathVariable Long staffId) {
        kitchenStaffRepo.deleteById(staffId);
        return ResponseEntity.ok(Map.of("message", "Staff account deleted"));
    }

    // ===== MENU ITEMS =====
    @GetMapping("/{hotelId}/items")
    public ResponseEntity<?> getItems(@PathVariable Long hotelId) {
        return ResponseEntity.ok(menuItemRepo.findByHotelId(hotelId));
    }

    @PostMapping("/{hotelId}/items")
    public ResponseEntity<?> addItem(@PathVariable Long hotelId, @RequestBody com.Project.ProjectZero.dto.MenuItemRequest req) {
        var item = new com.Project.ProjectZero.model.MenuItem();
        item.setHotelId(hotelId);
        item.setName(req.getName());
        item.setDescription(req.getDescription());
        item.setPrice(req.getPrice());
        item.setCategoryId(req.getCategoryId());
        item.setImageUrl(req.getImageUrl());
        item.setAvailable(req.getAvailable() != null ? req.getAvailable() : true);
        return ResponseEntity.ok(menuItemRepo.save(item));
    }

    @PutMapping("/{hotelId}/items/{itemId}")
    public ResponseEntity<?> updateItem(@PathVariable Long hotelId, @PathVariable Long itemId,
                                         @RequestBody com.Project.ProjectZero.dto.MenuItemRequest req) {
        var item = menuItemRepo.findById(itemId).orElseThrow(() -> new RuntimeException("Item not found"));
        item.setName(req.getName());
        item.setDescription(req.getDescription());
        item.setPrice(req.getPrice());
        item.setCategoryId(req.getCategoryId());
        item.setImageUrl(req.getImageUrl());
        item.setAvailable(req.getAvailable() != null ? req.getAvailable() : true);
        return ResponseEntity.ok(menuItemRepo.save(item));
    }

    @DeleteMapping("/{hotelId}/items/{itemId}")
    public ResponseEntity<?> deleteItem(@PathVariable Long hotelId, @PathVariable Long itemId) {
        menuItemRepo.deleteById(itemId);
        return ResponseEntity.ok(Map.of("message", "Item deleted"));
    }

    // ===== RAZORPAY CONFIG (Phase 2) =====
    @GetMapping("/{hotelId}/razorpay-config")
    public ResponseEntity<?> getRazorpayConfig(@PathVariable Long hotelId) {
        Hotel hotel = hotelRepo.findById(hotelId).orElseThrow(() -> new RuntimeException("Hotel not found"));
        String maskedKey = hotel.getRazorpayKeyId() != null ?
                hotel.getRazorpayKeyId().substring(0, Math.min(12, hotel.getRazorpayKeyId().length())) + "..." : "";
        return ResponseEntity.ok(Map.of(
                "keyId", maskedKey,
                "hasSecret", hotel.getRazorpayKeySecret() != null && !hotel.getRazorpayKeySecret().isEmpty()
        ));
    }

    @PutMapping("/{hotelId}/razorpay-config")
    public ResponseEntity<?> setRazorpayConfig(@PathVariable Long hotelId, @RequestBody Map<String, String> body) {
        Hotel hotel = hotelRepo.findById(hotelId).orElseThrow(() -> new RuntimeException("Hotel not found"));
        hotel.setRazorpayKeyId(body.get("keyId"));
        hotel.setRazorpayKeySecret(body.get("keySecret"));
        hotelRepo.save(hotel);
        return ResponseEntity.ok(Map.of("message", "Razorpay configuration saved"));
    }

    // ===== CASH CONFIRM BY ORDER REF =====
    @PostMapping("/cash-confirm")
    public ResponseEntity<?> confirmCashByOrderRef(@RequestBody Map<String, String> body) {
        String orderRef = body.get("orderRef");
        if (orderRef == null || orderRef.isEmpty()) {
            throw new RuntimeException("orderRef is required");
        }
        return ResponseEntity.ok(paymentService.confirmCashByOrderRef(orderRef));
    }

    // ===== ANALYTICS (Phase 3) =====
    @GetMapping("/{hotelId}/analytics")
    public ResponseEntity<?> getAnalytics(@PathVariable Long hotelId) {
        List<Order> allOrders = orderRepo.findByHotelIdOrderByCreatedAtDesc(hotelId);

        // Total revenue
        BigDecimal totalRevenue = allOrders.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.PAID)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Today's orders
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long todayOrders = allOrders.stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().isAfter(startOfDay))
                .count();

        BigDecimal todayRevenue = allOrders.stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().isAfter(startOfDay))
                .filter(o -> o.getStatus() == Order.OrderStatus.PAID)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Average order value
        long paidCount = allOrders.stream().filter(o -> o.getStatus() == Order.OrderStatus.PAID).count();
        BigDecimal avgOrderValue = paidCount > 0 ?
                totalRevenue.divide(BigDecimal.valueOf(paidCount), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        // Active sessions
        long activeSessions = sessionRepo.countByHotelIdAndStatus(hotelId,
                com.Project.ProjectZero.model.CustomerSession.SessionStatus.ACTIVE);

        // Orders by status
        Map<String, Long> ordersByStatus = allOrders.stream()
                .collect(Collectors.groupingBy(o -> o.getStatus().name(), Collectors.counting()));

        // Top items (from order items)
        Map<String, Long> topItems = allOrders.stream()
                .filter(o -> o.getItems() != null)
                .flatMap(o -> o.getItems().stream())
                .collect(Collectors.groupingBy(
                        com.Project.ProjectZero.model.OrderItem::getItemName,
                        Collectors.summingLong(com.Project.ProjectZero.model.OrderItem::getQuantity)
                ))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new));

        // Revenue by day (last 7 days)
        Map<String, BigDecimal> revenueByDay = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = LocalDate.now().minusDays(i);
            BigDecimal dayRevenue = allOrders.stream()
                    .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().toLocalDate().equals(day))
                    .filter(o -> o.getStatus() == Order.OrderStatus.PAID)
                    .map(Order::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            revenueByDay.put(day.toString(), dayRevenue);
        }

        // Feedback summary
        Double avgRating = feedbackRepo.getAverageRatingByHotelId(hotelId);
        long feedbackCount = feedbackRepo.countByHotelId(hotelId);

        Map<String, Object> analytics = new LinkedHashMap<>();
        analytics.put("totalRevenue", totalRevenue);
        analytics.put("todayOrders", todayOrders);
        analytics.put("todayRevenue", todayRevenue);
        analytics.put("avgOrderValue", avgOrderValue);
        analytics.put("activeSessions", activeSessions);
        analytics.put("totalOrders", allOrders.size());
        analytics.put("ordersByStatus", ordersByStatus);
        analytics.put("topItems", topItems);
        analytics.put("revenueByDay", revenueByDay);
        analytics.put("avgRating", avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0);
        analytics.put("feedbackCount", feedbackCount);

        return ResponseEntity.ok(analytics);
    }
}
