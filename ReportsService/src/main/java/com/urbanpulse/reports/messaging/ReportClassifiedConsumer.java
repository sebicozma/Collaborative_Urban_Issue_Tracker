package com.urbanpulse.reports.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.urbanpulse.reports.messaging.events.ReportClassifiedEvent;
import com.urbanpulse.reports.service.ReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class ReportClassifiedConsumer {

    private static final Logger log = LoggerFactory.getLogger(ReportClassifiedConsumer.class);

    private final ReportService reportService;
    private final ObjectMapper objectMapper;

    public ReportClassifiedConsumer(ReportService reportService, ObjectMapper objectMapper) {
        this.reportService = reportService;
        this.objectMapper = objectMapper;
    }

    @RabbitListener(queues = "reports.report-classified")
    public void onReportClassified(Message message) {
        try {
            ReportClassifiedEvent event = objectMapper.readValue(message.getBody(), ReportClassifiedEvent.class);
            log.info("Report {} classified as {} (confidence={})",
                    event.reportId(), event.classifiedCategory(), event.confidence());
            reportService.applyClassification(event.reportId(), event.classifiedCategory());
        } catch (Exception e) {
            log.error("Failed to process ReportClassified event", e);
            throw new AmqpRejectAndDontRequeueException("Deserialization failed", e);
        }
    }
}
