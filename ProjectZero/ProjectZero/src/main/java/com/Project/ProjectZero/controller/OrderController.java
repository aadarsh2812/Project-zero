package com.Project.ProjectZero.controller;

import com.Project.ProjectZero.dto.OrderRequest;
import com.Project.ProjectZero.dto.OrderStatusUpdateRequest;
import com.Project.ProjectZero.model.Order;
import com.Project.ProjectZero.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.jsonwebtoken.Claims;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<Order> placeOrder(@Valid @RequestBody OrderRequest req, @AuthenticationPrincipal Claims claims) {
        req.setCustomerToken(claims.getSubject()); // Use subject (sessionId)
        return ResponseEntity.ok(orderService.placeOrder(req));
    }

    @GetMapping("/customer")
    public ResponseEntity<List<Order>> getCustomerOrders(@AuthenticationPrincipal Claims claims) {
        return ResponseEntity.ok(orderService.getCustomerOrders(claims.getSubject()));
    }

    @GetMapping("/hotel/{hotelId}/active")
    public ResponseEntity<List<Order>> getActiveOrders(@PathVariable Long hotelId) {
        return ResponseEntity.ok(orderService.getActiveOrders(hotelId));
    }

    @GetMapping("/hotel/{hotelId}")
    public ResponseEntity<List<Order>> getAllOrders(@PathVariable Long hotelId) {
        return ResponseEntity.ok(orderService.getAllOrders(hotelId));
    }

    @GetMapping("/hotel/{hotelId}/completed")
    public ResponseEntity<List<Order>> getCompletedOrders(@PathVariable Long hotelId) {
        return ResponseEntity.ok(orderService.getCompletedOrders(hotelId));
    }

    @PatchMapping("/status")
    public ResponseEntity<Order> updateStatus(@RequestBody OrderStatusUpdateRequest req) {
        return ResponseEntity.ok(orderService.updateStatus(req.getOrderRef(), req.getStatus(), req.getPaidVia()));
    }

    @GetMapping("/ref/{orderRef}")
    public ResponseEntity<?> getByRef(@PathVariable String orderRef) {
        return orderService.findByRef(orderRef)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{orderId}")
    public ResponseEntity<?> deleteOrder(@PathVariable Long orderId) {
        orderService.deleteOrder(orderId);
        return ResponseEntity.ok(Map.of("message", "Order deleted"));
    }

    @DeleteMapping("/hotel/{hotelId}/completed")
    public ResponseEntity<?> deleteCompletedOrders(@PathVariable Long hotelId) {
        int count = orderService.deleteCompletedOrders(hotelId);
        return ResponseEntity.ok(Map.of("message", count + " completed orders deleted"));
    }
}
