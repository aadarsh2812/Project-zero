package com.hotel.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class QrScanRequest {
    @NotNull
    private Long hotelId;
    @NotNull
    private String tableNo;
}
