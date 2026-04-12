package com.Project.ProjectZero.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class PaymentRequest {
    private String sessionToken;
    private String paymentMethod; // UPI, QR, CASH
}
