package com.hotel.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hotels")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Hotel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String address;

    @Column(name = "admin_username", unique = true, nullable = false)
    private String adminUsername;

    @Column(name = "admin_password", nullable = false)
    private String adminPassword;
}
