package com.Project.ProjectZero.controller;

import com.Project.ProjectZero.service.RazorpayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments/razorpay")
@RequiredArgsConstructor
public class RazorpayController {

    private final RazorpayService razorpayService;

    /**
     * POST /api/payments/razorpay/create-order
     * Body: { "billId": "..." } or { "sessionToken": "..." }
     */
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, String> body) {
        try {
            // Support both billId and sessionToken
            String sessionToken = body.get("sessionToken");
            String billId = body.get("billId");

            if (sessionToken != null && !sessionToken.isEmpty()) {
                return ResponseEntity.ok(razorpayService.createOrderForSession(sessionToken));
            } else if (billId != null && !billId.isEmpty()) {
                return ResponseEntity.ok(razorpayService.createOrder(billId));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "sessionToken or billId is required"));
            }
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/payments/razorpay/verify
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(razorpayService.verifyAndComplete(
                    body.get("razorpay_order_id"),
                    body.get("razorpay_payment_id"),
                    body.get("razorpay_signature"),
                    body.get("billId")
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
