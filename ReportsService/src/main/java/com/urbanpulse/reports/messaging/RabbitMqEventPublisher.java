package com.urbanpulse.reports.messaging;

import com.urbanpulse.reports.dto.GeoPointDto;
import com.urbanpulse.reports.entity.Report;
import com.urbanpulse.reports.messaging.events.ReportCreatedEvent;
import com.urbanpulse.reports.messaging.events.ReportStatusChangedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.UUID;

@Component
public class RabbitMqEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(RabbitMqEventPublisher.class);
    private static final String EXCHANGE = "urban.events";

    private final RabbitTemplate rabbitTemplate;

    public RabbitMqEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishReportCreated(Report report) {
        ReportCreatedEvent event = new ReportCreatedEvent(
                report.getId().toString(),
                report.getReporterUserId().toString(),
                report.getTitle(),
                report.getDescription(),
                report.getCategory(),
                new GeoPointDto(report.getLat(), report.getLon()),
                report.getCreatedAt()
        );
        sendEvent("report.created", event);
    }

    public void publishReportStatusChanged(Report report, String previousStatus, UUID changedBy, String reason) {
        ReportStatusChangedEvent event = new ReportStatusChangedEvent(
                report.getId().toString(),
                previousStatus,
                report.getStatus(),
                changedBy.toString(),
                reason,
                report.getUpdatedAt()
        );
        sendEvent("report.status_changed", event);
    }

    private void sendEvent(String routingKey, Object payload) {
        rabbitTemplate.convertAndSend(EXCHANGE, routingKey, payload, message -> {
            var props = message.getMessageProperties();
            props.setHeader("eventId", UUID.randomUUID().toString());
            props.setHeader("eventType", payload.getClass().getSimpleName());
            props.setHeader("eventVersion", "v1");
            props.setHeader("occurredAt", OffsetDateTime.now().toString());
            props.setHeader("producer", "reports-service");
            props.setHeader("correlationId", UUID.randomUUID().toString());
            props.setContentType("application/json");
            props.setDeliveryMode(MessageDeliveryMode.PERSISTENT);
            return message;
        });
        log.info("Published {} with routing key {}", payload.getClass().getSimpleName(), routingKey);
    }
}
