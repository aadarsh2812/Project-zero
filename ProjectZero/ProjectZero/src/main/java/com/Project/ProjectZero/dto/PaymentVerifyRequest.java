package com.Project.ProjectZero.dto;

import lombok.Data;

@Data
public class PaymentVerifyRequest {
    private String paymentId;
    private String upiTransactionId;
}
