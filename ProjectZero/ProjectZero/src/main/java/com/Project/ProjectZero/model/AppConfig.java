package com.Project.ProjectZero.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "app_configs")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AppConfig {
    @Id
    @Column(name = "hotel_id", nullable = false)
    private Long hotelId;

    @Column(name = "app_name")
    private String appName;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "primary_color")
    private String primaryColor;

    @Column(name = "secondary_color")
    private String secondaryColor;

    @Column(name = "font_family")
    private String fontFamily;
}
