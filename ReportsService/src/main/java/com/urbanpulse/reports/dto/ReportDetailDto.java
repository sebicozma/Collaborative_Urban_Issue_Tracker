package com.urbanpulse.reports.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ReportDetailDto(
        UUID reportId,
        String title,
        String category,
        String status,
        OffsetDateTime createdAt,
        String description,
        GeoPointDto location,
        UUID reporterUserId,
        String classifiedCategory,
        String statusReason,
        OffsetDateTime updatedAt
) {}
