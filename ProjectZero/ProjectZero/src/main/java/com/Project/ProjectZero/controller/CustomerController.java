package com.Project.ProjectZero.controller;

import com.Project.ProjectZero.dto.*;
import com.Project.ProjectZero.service.CustomerService;
import com.Project.ProjectZero.repository.HotelRepository;
import com.Project.ProjectZero.model.Hotel;
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
    private final HotelRepository hotelRepo;

    /**
     * POST /api/customer/register
     * Called when customer has NO token in localStorage.
     * Creates/fetches customer, caches session in Redis, returns token.
     */
    @PostMapping("/register")
    public ResponseEntity<SessionResponse> register(@Valid @RequestBody CustomerRequest req) {
        return ResponseEntity.ok(customerService.registerOrFetch(req));
    }

    @PostMapping("/google-auth")
    public ResponseEntity<SessionResponse> googleAuth(@RequestBody Map<String, Object> body) {
        String idToken = (String) body.get("idToken");
        Long hotelId = Long.valueOf(body.get("hotelId").toString());
        String tableNo = (String) body.get("tableNo");
        return ResponseEntity.ok(customerService.handleGoogleAuth(idToken, hotelId, tableNo));
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
     * GET /api/customer/hotel/{hotelCode}
     * Returns basic hotel info for the QR scan landing page.
     */
    @GetMapping("/hotel/{hotelCode}")
    public ResponseEntity<Map<String, Object>> getHotelInfo(@PathVariable String hotelCode,
                                                             @RequestParam String tableNo) {
        Hotel hotel = hotelRepo.findByHotelCode(hotelCode)
                .orElseThrow(() -> new RuntimeException("Hotel not found for code: " + hotelCode));
        return ResponseEntity.ok(Map.of(
                "hotelId", hotel.getId(),
                "hotelName", hotel.getName(),
                "tableNo", tableNo,
                "message", "Scan successful"
        ));
    }
}
