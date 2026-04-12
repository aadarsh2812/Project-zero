package com.Project.ProjectZero.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_ref", unique = true, nullable = false)
    private String orderRef;   // e.g. ORD-001

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "table_no", nullable = false)
    private String tableNo;

    @Column(name = "session_id")
    private String sessionId;

    @Column(name = "hotel_id", nullable = false)
    private Long hotelId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OrderStatus status = OrderStatus.RECEIVED;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "paid_via")
    private String paidVia;   // null = unpaid, "CASH", "CARD", "ONLINE"

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "orderId", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<OrderItem> items;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum OrderStatus { RECEIVED, PREPARING, READY, PAID }
}
