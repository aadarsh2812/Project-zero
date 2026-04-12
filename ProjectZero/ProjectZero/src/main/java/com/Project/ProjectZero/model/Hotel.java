package com.Project.ProjectZero.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "hotels")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Hotel {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Public-facing random hotel code — used in QR codes and URLs
    @Column(name = "hotel_code", unique = true, nullable = false, updatable = false)
    @Builder.Default
    private String hotelCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();

    @Column(nullable = false)
    private String name;

    private String address;

    @Column(name = "admin_username", unique = true, nullable = false)
    private String adminUsername;

    @Column(name = "admin_password", nullable = false)
    private String adminPassword;

    @Column(name = "admin_email")
    private String adminEmail;

    @Column(name = "admin_phone")
    private String adminPhone;

    // Per-hotel Razorpay configuration
    @Column(name = "razorpay_key_id")
    private String razorpayKeyId;

    @Column(name = "razorpay_key_secret")
    private String razorpayKeySecret;
}
