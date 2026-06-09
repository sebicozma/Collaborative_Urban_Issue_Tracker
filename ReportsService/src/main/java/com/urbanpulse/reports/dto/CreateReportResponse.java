package com.urbanpulse.reports.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CreateReportResponse(UUID reportId, String status, OffsetDateTime createdAt) {}
