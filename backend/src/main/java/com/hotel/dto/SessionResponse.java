package com.hotel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponse {
    private String token;
    private Long customerId;
    private String customerName;
    private Long hotelId;
    private String tableNo;
    private String hotelName;
}
