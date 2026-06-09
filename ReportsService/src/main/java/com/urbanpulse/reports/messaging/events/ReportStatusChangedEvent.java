package com.urbanpulse.reports.messaging.events;

import java.time.OffsetDateTime;

public record ReportStatusChangedEvent(
        String reportId,
        String previousStatus,
        String currentStatus,
        String changedBy,
        String reason,
        OffsetDateTime changedAt
) {}
