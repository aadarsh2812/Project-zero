package com.Project.ProjectZero.controller;

import com.Project.ProjectZero.dto.*;
import com.Project.ProjectZero.model.Bill;
import com.Project.ProjectZero.model.Order;
import com.Project.ProjectZero.model.Payment;
import com.Project.ProjectZero.service.PaymentService;
import com.Project.ProjectZero.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.jsonwebtoken.Claims;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;
    private final OrderService orderService;

    @PostMapping("/finish-dining")
    public ResponseEntity<Bill> finishDining(@AuthenticationPrincipal Claims claims) {
        return ResponseEntity.ok(paymentService.generateBillForSession(claims.getSubject()));
    }

    @PostMapping("/initiate")
    public ResponseEntity<Payment> initiatePayment(@RequestBody PaymentRequest req, @AuthenticationPrincipal Claims claims) {
        req.setSessionToken(claims.getSubject());
        return ResponseEntity.ok(paymentService.initiatePayment(req));
    }

    @PostMapping("/verify")
    public ResponseEntity<Payment> verifyPayment(@RequestBody PaymentVerifyRequest req) {
        return ResponseEntity.ok(paymentService.verifyPayment(req));
    }

    @PostMapping("/manual-confirm/{paymentId}")
    public ResponseEntity<Payment> manualConfirm(@PathVariable String paymentId) {
        return ResponseEntity.ok(paymentService.manualConfirmAsAdmin(paymentId));
    }

    @GetMapping("/session-history")
    public ResponseEntity<?> getHistory(@AuthenticationPrincipal Claims claims) {
        String token = claims.getSubject();
        Bill bill = null;
        try {
             bill = paymentService.generateBillForSession(token);
        } catch(Exception e) {}
        
        return ResponseEntity.ok(Map.of(
            "orders", orderService.getCustomerOrders(token),
            "bill", bill != null ? bill : "No bill yet"
        ));
    }
}
