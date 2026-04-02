package com.Project.ProjectZero.controller;

import com.Project.ProjectZero.dto.OrderRequest;
import com.Project.ProjectZero.dto.OrderStatusUpdateRequest;
import com.Project.ProjectZero.model.Order;
import com.Project.ProjectZero.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * POST /api/orders
     * Customer submits order. Saves to PostgreSQL + publishes to Redis Pub/Sub.
     */
    @PostMapping
    public ResponseEntity<Order> placeOrder(@Valid @RequestBody OrderRequest req) {
        return ResponseEntity.ok(orderService.placeOrder(req));
    }

    /**
     * GET /api/orders/customer?token=...
     * Returns all orders for a customer (order tracking).
     */
    @GetMapping("/customer")
    public ResponseEntity<List<Order>> getCustomerOrders(@RequestParam String token) {
        return ResponseEntity.ok(orderService.getCustomerOrders(token));
    }

    /**
     * GET /api/orders/hotel/{hotelId}/active
     * Returns active orders for KDS.
     */
    @GetMapping("/hotel/{hotelId}/active")
    public ResponseEntity<List<Order>> getActiveOrders(@PathVariable Long hotelId) {
        return ResponseEntity.ok(orderService.getActiveOrders(hotelId));
    }

    /**
     * GET /api/orders/hotel/{hotelId}
     * Returns all orders for admin.
     */
    @GetMapping("/hotel/{hotelId}")
    public ResponseEntity<List<Order>> getAllOrders(@PathVariable Long hotelId) {
        return ResponseEntity.ok(orderService.getAllOrders(hotelId));
    }

    /**
     * PATCH /api/orders/status
     * Kitchen updates order status — triggers WebSocket push to customer.
     */
    @PatchMapping("/status")
    public ResponseEntity<Order> updateStatus(@RequestBody OrderStatusUpdateRequest req) {
        return ResponseEntity.ok(orderService.updateStatus(req.getOrderRef(), req.getStatus(), req.getPaidVia()));
    }

    /**
     * GET /api/orders/ref/{orderRef}
     * Lookup by short ID (admin offline payment).
     */
    @GetMapping("/ref/{orderRef}")
    public ResponseEntity<?> getByRef(@PathVariable String orderRef) {
        return orderService.findByRef(orderRef)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
