package com.urbanpulse.reports.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;

public record CreateReportRequest(
        @NotBlank @Size(min = 3, max = 180) String title,
        @NotBlank @Size(min = 10, max = 5000) String description,
        @NotNull @Pattern(regexp = "waste|road|lighting|water|safety|other") String category,
        @NotNull @Valid GeoPointDto location,
        @Size(max = 10) List<String> attachments
) {}
