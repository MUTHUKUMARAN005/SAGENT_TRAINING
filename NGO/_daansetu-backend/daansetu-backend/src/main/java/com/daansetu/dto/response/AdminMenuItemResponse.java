package com.daansetu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminMenuItemResponse {
    private Long id;
    private String key;
    private String label;
    private String path;
    private String iconKey;
    private Integer sortOrder;
    private Boolean enabled;
}
