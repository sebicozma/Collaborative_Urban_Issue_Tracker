package com.urbanpulse.reports.messaging.events;

import com.urbanpulse.reports.dto.GeoPointDto;

import java.time.OffsetDateTime;

public record ReportCreatedEvent(
        String reportId,
        String reporterUserId,
        String title,
        String description,
        String category,
        GeoPointDto location,
        OffsetDateTime createdAt
) {}
