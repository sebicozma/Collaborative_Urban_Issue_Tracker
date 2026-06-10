package com.urbanpulse.notifications.service;

import com.urbanpulse.notifications.messaging.events.ReportStatusChangedPayload;
import com.urbanpulse.notifications.messaging.events.UserRegisteredPayload;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final EmailService emailService;
    private final String adminAddress;

    public NotificationService(EmailService emailService,
                               @Value("${notifications.mail.admin-address:}") String adminAddress) {
        this.emailService = emailService;
        this.adminAddress = adminAddress;
    }

    public void handleUserRegistered(UserRegisteredPayload payload) {
        log.info("[NOTIFICATION] Welcome email -> {} (userId={})", payload.email(), payload.userId());
        emailService.send(
                payload.email(),
                "Welcome to Urban Issue Tracker",
                """
                Hello,

                Your Urban Issue Tracker account has been created successfully.
                You can now report local infrastructure issues and track their resolution.

                Role: %s

                Thank you for helping improve your city!
                """.formatted(payload.role()));
    }

    public void handleReportStatusChanged(ReportStatusChangedPayload payload) {
        log.info("[NOTIFICATION] Report {} status {} -> {} (changedBy={})",
                payload.reportId(), payload.previousStatus(), payload.currentStatus(), payload.changedBy());
        // The event does not carry the submitter's email, so status updates go to the configured admin address.
        emailService.send(
                adminAddress,
                "Report %s status changed: %s -> %s"
                        .formatted(payload.reportId(), payload.previousStatus(), payload.currentStatus()),
                """
                Report %s has a new status.

                Previous status: %s
                Current status:  %s
                Changed by:      %s
                Reason:          %s
                Changed at:      %s
                """.formatted(payload.reportId(), payload.previousStatus(), payload.currentStatus(),
                        payload.changedBy(), payload.reason(), payload.changedAt()));
    }
}
