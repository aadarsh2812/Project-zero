package com.example.demo.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "hotels")
public class Hotel {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String plan; // Starter, Pro, Enterprise

    @Column(nullable = false)
    private String status; // ACTIVE, PAUSED, INACTIVE

    private boolean paymentDue;

    private String logo;
    private String paymentFlow; // BEFORE_EATING, AFTER_EATING
    private String currency;

    // Razorpay integration — key ID is safe to expose to frontend; secret stays server-side
    private String razorpayKeyId;

    @Column(name = "razorpay_key_secret")
    private String razorpayKeySecret;

    private Long createdAt;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "admin_user_id")
    private User adminUser;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "kitchen_user_id")
    private User kitchenUser;

    public Hotel() {
        this.createdAt = System.currentTimeMillis();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isPaymentDue() { return paymentDue; }
    public void setPaymentDue(boolean paymentDue) { this.paymentDue = paymentDue; }

    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }

    public User getAdminUser() { return adminUser; }
    public void setAdminUser(User adminUser) { this.adminUser = adminUser; }

    public User getKitchenUser() { return kitchenUser; }
    public void setKitchenUser(User kitchenUser) { this.kitchenUser = kitchenUser; }

    public String getRazorpayKeyId() { return razorpayKeyId; }
    public void setRazorpayKeyId(String razorpayKeyId) { this.razorpayKeyId = razorpayKeyId; }

    // Never expose the secret key to the frontend
    @com.fasterxml.jackson.annotation.JsonIgnore
    public String getRazorpayKeySecret() { return razorpayKeySecret; }
    public void setRazorpayKeySecret(String razorpayKeySecret) { this.razorpayKeySecret = razorpayKeySecret; }

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("adminCreds")
    public java.util.Map<String, String> getAdminCreds() {
        if (adminUser == null) return null;
        java.util.Map<String, String> creds = new java.util.HashMap<>();
        creds.put("user", adminUser.getUsername());
        creds.put("pass", ""); // Password is hashed, cannot return plain text
        return creds;
    }

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("kitchenCreds")
    public java.util.Map<String, String> getKitchenCreds() {
        if (kitchenUser == null) return null;
        java.util.Map<String, String> creds = new java.util.HashMap<>();
        creds.put("user", kitchenUser.getUsername());
        creds.put("pass", "");
        return creds;
    }

    public String getLogo() { return logo; }
    public void setLogo(String logo) { this.logo = logo; }

    public String getPaymentFlow() { return paymentFlow; }
    public void setPaymentFlow(String paymentFlow) { this.paymentFlow = paymentFlow; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
}
