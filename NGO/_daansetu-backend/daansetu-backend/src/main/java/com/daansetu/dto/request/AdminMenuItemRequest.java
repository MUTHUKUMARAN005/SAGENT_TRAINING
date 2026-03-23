package com.daansetu.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminMenuItemRequest {

    @NotBlank
    private String key;

    @NotBlank
    private String label;

    @NotBlank
    private String path;

    private String iconKey;

    @Min(1)
    private Integer sortOrder;

    private Boolean enabled;
}

