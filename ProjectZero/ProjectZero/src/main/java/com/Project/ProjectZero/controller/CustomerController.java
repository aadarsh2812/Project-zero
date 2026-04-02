package com.Project.ProjectZero.controller;

import com.Project.ProjectZero.dto.*;
import com.Project.ProjectZero.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    /**
     * POST /api/customer/register
     * Called when customer has NO token in localStorage.
     * Creates/fetches customer, caches session in Redis, returns token.
     */
    @PostMapping("/register")
    public ResponseEntity<SessionResponse> register(@Valid @RequestBody CustomerRequest req) {
        return ResponseEntity.ok(customerService.registerOrFetch(req));
    }

    /**
     * POST /api/customer/validate
     * Called when customer HAS token in localStorage.
     * Validates via Redis cache (bypasses Postgres), maps to table session.
     */
    @PostMapping("/validate")
    public ResponseEntity<SessionResponse> validate(@Valid @RequestBody SessionValidateRequest req) {
        try {
            return ResponseEntity.ok(customerService.validateAndMap(req));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(null);
        }
    }

    /**
     * GET /api/customer/hotel/{hotelId}
     * Returns basic hotel info for the QR scan landing page.
     */
    @GetMapping("/hotel/{hotelId}")
    public ResponseEntity<Map<String, Object>> getHotelInfo(@PathVariable Long hotelId,
                                                             @RequestParam String tableNo) {
        return ResponseEntity.ok(Map.of(
                "hotelId", hotelId,
                "tableNo", tableNo,
                "message", "Scan successful"
        ));
    }
}
