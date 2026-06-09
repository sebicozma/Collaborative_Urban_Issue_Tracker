package com.urbanpulse.reports.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ReportStatusUpdateRequest(
        @NotNull @Pattern(regexp = "submitted|in_review|classified|approved|rejected") String status,
        @Size(max = 500) String reason
) {}
