package com.hotel.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class SessionValidateRequest {
    @NotBlank
    private String token;
    @NotNull
    private Long hotelId;
    @NotBlank
    private String tableNo;
}
