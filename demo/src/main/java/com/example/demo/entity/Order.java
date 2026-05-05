package com.example.demo.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    private String orderId;

    @Column(nullable = false)
    private String tableNo;

    @Column(nullable = false)
    private String status; // ORDERED, PREPARING, READY, SERVED

    private Double totalAmount;

    private Long timestamp;

    private Long prepStartedAt;
    private Long readyAt;
    private Long servedAt;

    private String paymentStatus; // PENDING, PAID
    private String paymentMethod; // ONLINE, CASH

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hotel_id")
    private Hotel hotel;

    public Order() {
        this.timestamp = System.currentTimeMillis();
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getTableNo() { return tableNo; }
    public void setTableNo(String tableNo) { this.tableNo = tableNo; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

    public Long getTimestamp() { return timestamp; }
    public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }

    public Long getPrepStartedAt() { return prepStartedAt; }
    public void setPrepStartedAt(Long prepStartedAt) { this.prepStartedAt = prepStartedAt; }

    public Long getReadyAt() { return readyAt; }
    public void setReadyAt(Long readyAt) { this.readyAt = readyAt; }

    public Long getServedAt() { return servedAt; }
    public void setServedAt(Long servedAt) { this.servedAt = servedAt; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }

    public Hotel getHotel() { return hotel; }
    public void setHotel(Hotel hotel) { this.hotel = hotel; }
}
