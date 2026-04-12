package com.Project.ProjectZero.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "feedback")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Feedback {
    @Id
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    @Column(name = "session_id")
    private String sessionId;

    @Column(name = "hotel_id", nullable = false)
    private Long hotelId;

    @Column(nullable = false)
    private Integer rating; // 1-5

    @Column(length = 1000)
    private String comment;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "table_no")
    private String tableNo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        createdAt = LocalDateTime.now();
    }
}
