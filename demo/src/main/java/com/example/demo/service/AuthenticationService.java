package com.example.demo.service;

import com.example.demo.dto.AuthRequest;
import com.example.demo.dto.AuthResponse;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthenticationService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final com.example.demo.repository.HotelRepository hotelRepository;

    public AuthenticationService(UserRepository repository, PasswordEncoder passwordEncoder, JwtService jwtService, AuthenticationManager authenticationManager, com.example.demo.repository.HotelRepository hotelRepository) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.hotelRepository = hotelRepository;
    }

    public AuthResponse authenticate(AuthRequest request) {
        System.out.println("Login attempt for user: " + request.getUsername());
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );
        var user = repository.findByUsername(request.getUsername())
                .orElseThrow();
        var jwtToken = jwtService.generateToken(user);
        
        String hotelId = null;
        if (user.getRole() == com.example.demo.entity.Role.ADMIN) {
            hotelId = hotelRepository.findByAdminUser(user).map(com.example.demo.entity.Hotel::getId).orElse(null);
        } else if (user.getRole() == com.example.demo.entity.Role.KITCHEN) {
            hotelId = hotelRepository.findByKitchenUser(user).map(com.example.demo.entity.Hotel::getId).orElse(null);
        }
        
        return new AuthResponse(jwtToken, user.getRole().name(), hotelId);
    }

    // Helper method to register a user, e.g., an initial admin
    public AuthResponse register(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        repository.save(user);
        var jwtToken = jwtService.generateToken(user);
        return new AuthResponse(jwtToken, user.getRole().name(), null);
    }
}
