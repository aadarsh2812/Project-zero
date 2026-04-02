package com.hotel.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class CustomerRequest {
    @NotNull
    private Long hotelId;
    @NotBlank
    private String tableNo;
    @NotBlank
    private String name;
    @NotBlank
    private String phone;
}
