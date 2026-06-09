package com.urbanpulse.notifications.service;

import com.urbanpulse.notifications.messaging.events.ReportStatusChangedPayload;
import com.urbanpulse.notifications.messaging.events.UserRegisteredPayload;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    public void handleUserRegistered(UserRegisteredPayload payload) {
        log.info("[NOTIFICATION] Welcome email -> {} (userId={})", payload.email(), payload.userId());
        // TODO: integrate with email/push provider
    }

    public void handleReportStatusChanged(ReportStatusChangedPayload payload) {
        log.info("[NOTIFICATION] Report {} status {} -> {} (changedBy={})",
                payload.reportId(), payload.previousStatus(), payload.currentStatus(), payload.changedBy());
        // TODO: push notification to report submitter
    }
}
