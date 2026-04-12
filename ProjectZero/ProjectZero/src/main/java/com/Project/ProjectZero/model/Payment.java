package com.Project.ProjectZero.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Payment {
    @Id
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    @Column(name = "bill_id", nullable = false)
    private String billId;

    @Column(name = "session_id", nullable = false)
    private String sessionId;

    @Column(name = "hotel_id", nullable = false)
    private Long hotelId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @Column(name = "upi_transaction_id")
    private String upiTransactionId;

    @Column(name = "attempt_count", nullable = false)
    @Builder.Default
    private Integer attemptCount = 1;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

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

    public enum PaymentStatus { PENDING, SUCCESS, FAILED, FALLBACK_QR, CASH_PENDING }
    public enum PaymentMethod { UPI, QR, CASH }
}
