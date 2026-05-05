package com.example.demo.controller;

import com.example.demo.entity.Hotel;
import com.example.demo.repository.HotelRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/hotels")
public class HotelController {

    private final HotelRepository repository;
    private final com.example.demo.repository.UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public HotelController(HotelRepository repository,
                           com.example.demo.repository.UserRepository userRepository,
                           org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<Hotel> getHotels() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Hotel> getHotelById(@PathVariable String id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @org.springframework.transaction.annotation.Transactional
    @PutMapping("/{id}/credentials")
    public ResponseEntity<?> updateCredentials(
            @PathVariable String id,
            @RequestParam String type,
            @RequestBody Map<String, String> creds) {

        String username = creds.get("user");
        String password = creds.get("pass");

        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body("Username cannot be empty");
        }

        return repository.findById(id).map(hotel -> {
            com.example.demo.entity.User user = type.equals("admin") ? hotel.getAdminUser() : hotel.getKitchenUser();

            if (user == null) {
                user = new com.example.demo.entity.User();
                user.setRole(type.equals("admin") ? com.example.demo.entity.Role.ADMIN : com.example.demo.entity.Role.KITCHEN);
            }

            // Check username uniqueness if it has changed
            final String newUsername = username.trim();
            final com.example.demo.entity.User finalUser = user;
            boolean usernameTaken = userRepository.findByUsername(newUsername)
                    .filter(existing -> !existing.getId().equals(finalUser.getId()))
                    .isPresent();

            if (usernameTaken) {
                return ResponseEntity.status(409).<Hotel>body(null);
            }

            user.setUsername(newUsername);
            if (password != null && !password.isEmpty()) {
                user.setPassword(passwordEncoder.encode(password));
            } else if (user.getPassword() == null) {
                // If it's a new user and no password was provided, set a default
                user.setPassword(passwordEncoder.encode("default123"));
            }

            userRepository.save(user);

            if (type.equals("admin")) {
                hotel.setAdminUser(user);
            } else {
                hotel.setKitchenUser(user);
            }

            return ResponseEntity.ok(repository.save(hotel));
        }).orElse(ResponseEntity.notFound().build());
    }

    @org.springframework.transaction.annotation.Transactional
    @PostMapping
    public ResponseEntity<?> addHotel(@RequestBody Hotel hotel) {
        if (hotel.getName() == null || hotel.getName().isBlank()) {
            return ResponseEntity.badRequest().body("Hotel name is required");
        }

        if (hotel.getId() == null || hotel.getId().isEmpty()) {
            hotel.setId(java.util.UUID.randomUUID().toString().substring(0, 8));
        }

        if (hotel.getStatus() == null) hotel.setStatus("ACTIVE");
        if (hotel.getPlan() == null) hotel.setPlan("Starter");
        if (hotel.getCurrency() == null) hotel.setCurrency("₹");
        if (hotel.getPaymentFlow() == null) hotel.setPaymentFlow("BEFORE_EATING");

        // Create default Admin User
        String adminUsername = "admin_" + hotel.getId();
        com.example.demo.entity.User admin = new com.example.demo.entity.User();
        admin.setUsername(adminUsername);
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRole(com.example.demo.entity.Role.ADMIN);
        userRepository.save(admin);
        hotel.setAdminUser(admin);

        // Create default Kitchen User
        String kitchenUsername = "kitchen_" + hotel.getId();
        com.example.demo.entity.User kitchen = new com.example.demo.entity.User();
        kitchen.setUsername(kitchenUsername);
        kitchen.setPassword(passwordEncoder.encode("kitchen123"));
        kitchen.setRole(com.example.demo.entity.Role.KITCHEN);
        userRepository.save(kitchen);
        hotel.setKitchenUser(kitchen);

        Hotel saved = repository.save(hotel);
        System.out.println("Hotel created: " + saved.getName() + " (ID: " + saved.getId() + ")");
        System.out.println("  Admin login: " + adminUsername + " / admin123");
        System.out.println("  Kitchen login: " + kitchenUsername + " / kitchen123");
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Hotel> updateHotel(@PathVariable String id, @RequestBody Hotel hotelDetails) {
        return repository.findById(id)
                .map(hotel -> {
                    hotel.setName(hotelDetails.getName());
                    hotel.setLogo(hotelDetails.getLogo());
                    hotel.setPaymentFlow(hotelDetails.getPaymentFlow());
                    hotel.setCurrency(hotelDetails.getCurrency());
                    // Update Razorpay keys if provided
                    if (hotelDetails.getRazorpayKeyId() != null) {
                        hotel.setRazorpayKeyId(hotelDetails.getRazorpayKeyId());
                    }
                    if (hotelDetails.getRazorpayKeySecret() != null) {
                        hotel.setRazorpayKeySecret(hotelDetails.getRazorpayKeySecret());
                    }
                    return ResponseEntity.ok(repository.save(hotel));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Hotel> updateStatus(@PathVariable String id, @RequestBody String status) {
        return repository.findById(id)
                .map(hotel -> {
                    hotel.setStatus(status.replace("\"", ""));
                    return ResponseEntity.ok(repository.save(hotel));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @org.springframework.transaction.annotation.Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHotel(@PathVariable String id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
