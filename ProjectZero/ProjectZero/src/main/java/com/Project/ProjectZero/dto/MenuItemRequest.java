package com.Project.ProjectZero.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class MenuItemRequest {
    private String name;
    private String description;
    private BigDecimal price;
    private String imageUrl;
    private Long categoryId;
    private Boolean available;
}
