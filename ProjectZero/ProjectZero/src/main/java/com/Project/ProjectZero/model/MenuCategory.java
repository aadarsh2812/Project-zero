package com.Project.ProjectZero.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "menu_categories")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MenuCategory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "hotel_id", nullable = false)
    private Long hotelId;

    @Column(name = "display_order")
    private Integer displayOrder;
}
