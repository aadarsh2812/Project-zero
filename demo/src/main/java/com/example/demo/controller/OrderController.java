package com.example.demo.controller;

import com.example.demo.entity.Order;
import com.example.demo.repository.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderRepository repository;
    private final com.example.demo.repository.HotelRepository hotelRepository;

    public OrderController(OrderRepository repository, com.example.demo.repository.HotelRepository hotelRepository) {
        this.repository = repository;
        this.hotelRepository = hotelRepository;
    }

    @GetMapping
    public List<Order> getAllOrders(@RequestParam(required = false) String hotelId) {
        if (hotelId != null) {
            return repository.findByHotelId(hotelId);
        }
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable String id, @RequestParam(required = false) String hotelId) {
        return repository.findById(id)
                // Optionally verify it belongs to hotelId if provided
                .filter(order -> hotelId == null || (order.getHotel() != null && order.getHotel().getId().equals(hotelId)))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Order createOrder(@RequestBody Order order, @RequestParam(required = false) String hotelId) {
        if (order.getOrderId() == null) {
            order.setOrderId("#" + System.currentTimeMillis());
        }
        if (hotelId != null) {
            hotelRepository.findById(hotelId).ifPresent(order::setHotel);
        }
        if (order.getItems() != null) {
            order.getItems().forEach(item -> item.setOrder(order));
        }
        return repository.save(order);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Order> updateStatus(@PathVariable String id, @RequestBody String status) {
        return repository.findById(id)
                .map(order -> {
                    order.setStatus(status.replace("\"", "")); // Remove quotes if sent as plain string
                    long now = System.currentTimeMillis();
                    if (status.contains("PREPARING") && order.getPrepStartedAt() == null) order.setPrepStartedAt(now);
                    if (status.contains("READY") && order.getReadyAt() == null) order.setReadyAt(now);
                    if (status.contains("SERVED") && order.getServedAt() == null) order.setServedAt(now);
                    return ResponseEntity.ok(repository.save(order));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/payment")
    public ResponseEntity<Order> updatePayment(@PathVariable String id, @RequestBody Order paymentInfo) {
        return repository.findById(id)
                .map(order -> {
                    order.setPaymentStatus(paymentInfo.getPaymentStatus());
                    if (paymentInfo.getPaymentMethod() != null) {
                        order.setPaymentMethod(paymentInfo.getPaymentMethod());
                    }
                    return ResponseEntity.ok(repository.save(order));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable String id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
