package com.urbanpulse.reports.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ReportSummaryDto(
        UUID reportId,
        String title,
        String category,
        String status,
        OffsetDateTime createdAt
) {}
