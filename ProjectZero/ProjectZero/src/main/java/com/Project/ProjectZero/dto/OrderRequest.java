package com.Project.ProjectZero.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
public class OrderRequest {
    // Set by JWT filter, not by client — no @NotNull validation
    private String customerToken;
    @NotNull private Long hotelId;
    @NotNull private String tableNo;
    @NotNull private List<OrderItemRequest> items;

    @Data
    public static class OrderItemRequest {
        private Long menuItemId;
        private Integer quantity;
    }
}
