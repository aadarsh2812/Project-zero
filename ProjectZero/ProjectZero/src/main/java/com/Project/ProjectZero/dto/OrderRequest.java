package com.Project.ProjectZero.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
public class OrderRequest {
    @NotNull private String customerToken;
    @NotNull private Long hotelId;
    @NotNull private String tableNo;
    @NotNull private List<OrderItemRequest> items;

    @Data
    public static class OrderItemRequest {
        private Long menuItemId;
        private Integer quantity;
    }
}
