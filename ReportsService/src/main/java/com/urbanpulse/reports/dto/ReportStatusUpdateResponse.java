package com.urbanpulse.reports.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ReportStatusUpdateResponse(
        UUID reportId,
        String previousStatus,
        String currentStatus,
        OffsetDateTime updatedAt
) {}
