package com.Project.ProjectZero.dto;

import lombok.Data;

@Data
public class OrderStatusUpdateRequest {
    private String orderRef;
    private String status;   // RECEIVED | PREPARING | READY | PAID
    private String paidVia;  // CASH | CARD (for PAID)
}
