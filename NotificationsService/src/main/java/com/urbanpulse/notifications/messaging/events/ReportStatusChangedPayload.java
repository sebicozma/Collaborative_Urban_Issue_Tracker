package com.urbanpulse.notifications.messaging.events;

import java.time.OffsetDateTime;

public record ReportStatusChangedPayload(
        String reportId,
        String previousStatus,
        String currentStatus,
        String changedBy,
        String reason,
        OffsetDateTime changedAt
) {}
