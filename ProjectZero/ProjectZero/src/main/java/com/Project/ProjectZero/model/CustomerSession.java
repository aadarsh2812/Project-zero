package com.Project.ProjectZero.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "customer_sessions")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CustomerSession {
    @Id
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false, unique = true)
    private String token;

    @Column(name = "hotel_id", nullable = false)
    private Long hotelId;

    @Column(name = "table_no", nullable = false)
    private String tableNo;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SessionStatus status = SessionStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { 
        if (id == null) id = UUID.randomUUID().toString();
        createdAt = LocalDateTime.now(); 
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum SessionStatus { ACTIVE, COMPLETED, PAID }
}
