package com.hotel.dto;

import lombok.Data;

@Data
public class OrderStatusUpdateRequest {
    private String orderRef;
    private String status;  // RECEIVED, PREPARING, READY, PAID
}
