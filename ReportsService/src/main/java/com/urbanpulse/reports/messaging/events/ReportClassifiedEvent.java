package com.urbanpulse.reports.messaging.events;

import java.time.OffsetDateTime;

public record ReportClassifiedEvent(
        String reportId,
        String modelVersion,
        String classifiedCategory,
        double confidence,
        OffsetDateTime classifiedAt
) {}
