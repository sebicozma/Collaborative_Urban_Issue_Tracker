package com.urbanpulse.reports.controller;

import com.urbanpulse.reports.dto.*;
import com.urbanpulse.reports.service.ReportService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/reports")
@Validated
public class ReportsController {

    private final ReportService reportService;

    public ReportsController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    public ResponseEntity<ReportListResponse> listReports(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int limit,
            @RequestParam(required = false) String cursor) {
        return ResponseEntity.ok(reportService.listReports(status, limit, cursor));
    }

    @PostMapping
    public ResponseEntity<CreateReportResponse> createReport(
            @Valid @RequestBody CreateReportRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.status(201).body(reportService.createReport(request, jwt.getSubject()));
    }

    @GetMapping("/{reportId}")
    public ResponseEntity<ReportDetailDto> getReport(@PathVariable UUID reportId) {
        return ResponseEntity.ok(reportService.getReport(reportId));
    }

    @PatchMapping("/{reportId}/status")
    public ResponseEntity<ReportStatusUpdateResponse> updateStatus(
            @PathVariable UUID reportId,
            @Valid @RequestBody ReportStatusUpdateRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(reportService.updateStatus(reportId, request, jwt.getSubject()));
    }
}
