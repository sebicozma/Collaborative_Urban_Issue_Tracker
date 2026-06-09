package com.urbanpulse.reports.dto;

import java.util.List;

public record ReportListResponse(List<ReportSummaryDto> items, String nextCursor) {}
