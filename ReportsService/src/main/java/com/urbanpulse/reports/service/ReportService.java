package com.urbanpulse.reports.service;

import com.urbanpulse.reports.dto.*;
import com.urbanpulse.reports.entity.Report;
import com.urbanpulse.reports.exception.ReportNotFoundException;
import com.urbanpulse.reports.messaging.RabbitMqEventPublisher;
import com.urbanpulse.reports.repository.ReportRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ReportService {

    private final ReportRepository reportRepository;
    private final RabbitMqEventPublisher eventPublisher;

    public ReportService(ReportRepository reportRepository, RabbitMqEventPublisher eventPublisher) {
        this.reportRepository = reportRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional(readOnly = true)
    public ReportListResponse listReports(String status, int limit, String cursor) {
        int fetch = limit + 1;
        List<Report> reports;

        if (cursor != null) {
            CursorData cd = decodeCursor(cursor);
            reports = (status != null)
                    ? reportRepository.findNextPageByStatus(status, cd.time(), cd.id(), fetch)
                    : reportRepository.findNextPageAll(cd.time(), cd.id(), fetch);
        } else {
            reports = (status != null)
                    ? reportRepository.findFirstPageByStatus(status, fetch)
                    : reportRepository.findFirstPageAll(fetch);
        }

        boolean hasMore = reports.size() > limit;
        List<Report> page = hasMore ? reports.subList(0, limit) : reports;

        String nextCursor = null;
        if (hasMore) {
            Report last = page.get(page.size() - 1);
            nextCursor = encodeCursor(last.getCreatedAt(), last.getId());
        }

        return new ReportListResponse(page.stream().map(this::toSummary).toList(), nextCursor);
    }

    public CreateReportResponse createReport(CreateReportRequest request, String reporterUserId) {
        Report report = new Report();
        report.setTitle(request.title());
        report.setDescription(request.description());
        report.setCategory(request.category());
        report.setReporterUserId(UUID.fromString(reporterUserId));
        report.setLat(request.location().lat());
        report.setLon(request.location().lon());
        report.setAttachments(request.attachments() != null ? request.attachments() : List.of());

        report = reportRepository.save(report);
        eventPublisher.publishReportCreated(report);

        return new CreateReportResponse(report.getId(), report.getStatus(), report.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public ReportDetailDto getReport(UUID reportId) {
        return reportRepository.findById(reportId)
                .map(this::toDetail)
                .orElseThrow(() -> new ReportNotFoundException(reportId));
    }

    public ReportStatusUpdateResponse updateStatus(UUID reportId, ReportStatusUpdateRequest request, String userId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ReportNotFoundException(reportId));

        String previousStatus = report.getStatus();
        report.setStatus(request.status());
        report.setStatusReason(request.reason());
        report.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        report = reportRepository.save(report);

        eventPublisher.publishReportStatusChanged(report, previousStatus, UUID.fromString(userId), request.reason());

        return new ReportStatusUpdateResponse(
                report.getId(), previousStatus, report.getStatus(), report.getUpdatedAt()
        );
    }

    public void applyClassification(String reportId, String classifiedCategory) {
        reportRepository.findById(UUID.fromString(reportId)).ifPresent(report -> {
            report.setClassifiedCategory(classifiedCategory);
            report.setStatus("classified");
            report.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
            reportRepository.save(report);
        });
    }

    private String encodeCursor(OffsetDateTime time, UUID id) {
        String raw = time.toInstant().toEpochMilli() + ":" + id;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    private CursorData decodeCursor(String cursor) {
        String raw = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
        String[] parts = raw.split(":", 2);
        OffsetDateTime time = OffsetDateTime.ofInstant(
                Instant.ofEpochMilli(Long.parseLong(parts[0])), ZoneOffset.UTC);
        return new CursorData(time, parts[1]);
    }

    private record CursorData(OffsetDateTime time, String id) {}

    private ReportSummaryDto toSummary(Report r) {
        return new ReportSummaryDto(r.getId(), r.getTitle(), r.getCategory(), r.getStatus(), r.getCreatedAt(),
                new GeoPointDto(r.getLat(), r.getLon()));
    }

    private ReportDetailDto toDetail(Report r) {
        return new ReportDetailDto(
                r.getId(), r.getTitle(), r.getCategory(), r.getStatus(), r.getCreatedAt(),
                r.getDescription(), new GeoPointDto(r.getLat(), r.getLon()),
                r.getReporterUserId(), r.getClassifiedCategory(), r.getStatusReason(), r.getUpdatedAt()
        );
    }
}
