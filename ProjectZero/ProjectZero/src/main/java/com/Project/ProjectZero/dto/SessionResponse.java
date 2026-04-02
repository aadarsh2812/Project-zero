package com.Project.ProjectZero.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SessionResponse {
    private String token;
    private Long customerId;
    private String customerName;
    private Long hotelId;
    private String tableNo;
    private String hotelName;
}
