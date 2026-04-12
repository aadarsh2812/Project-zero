package com.Project.ProjectZero.controller;

import com.Project.ProjectZero.model.KitchenStaff;
import com.Project.ProjectZero.repository.KitchenStaffRepository;
import com.Project.ProjectZero.security.JwtUtil;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/kitchen")
@RequiredArgsConstructor
public class KitchenAuthController {

    private final KitchenStaffRepository staffRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody KitchenLoginRequest req) {
        KitchenStaff staff = staffRepo.findByUsernameAndHotelId(req.getUsername(), req.getHotelId())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!staff.getActive()) {
            throw new RuntimeException("Account is deactivated. Contact your admin.");
        }

        if (!passwordEncoder.matches(req.getPassword(), staff.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        String jwt = jwtUtil.generateKitchenToken(staff.getId(), staff.getHotelId(), staff.getName());

        return ResponseEntity.ok(Map.of(
                "token", jwt,
                "staffId", staff.getId(),
                "staffName", staff.getName(),
                "hotelId", staff.getHotelId()
        ));
    }

    @Data
    public static class KitchenLoginRequest {
        private String username;
        private String password;
        private Long hotelId;
    }
}
