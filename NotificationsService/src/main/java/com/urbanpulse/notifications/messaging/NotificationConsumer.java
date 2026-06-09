package com.urbanpulse.notifications.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.client.Channel;
import com.urbanpulse.notifications.messaging.events.ReportStatusChangedPayload;
import com.urbanpulse.notifications.messaging.events.UserRegisteredPayload;
import com.urbanpulse.notifications.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationConsumer {

    private static final Logger log = LoggerFactory.getLogger(NotificationConsumer.class);

    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    public NotificationConsumer(ObjectMapper objectMapper, NotificationService notificationService) {
        this.objectMapper = objectMapper;
        this.notificationService = notificationService;
    }

    @RabbitListener(queues = "notification.events")
    public void onMessage(Message message, Channel channel) {
        String routingKey = message.getMessageProperties().getReceivedRoutingKey();
        try {
            switch (routingKey) {
                case "user.registered" -> {
                    UserRegisteredPayload payload =
                            objectMapper.readValue(message.getBody(), UserRegisteredPayload.class);
                    notificationService.handleUserRegistered(payload);
                }
                case "report.status_changed" -> {
                    ReportStatusChangedPayload payload =
                            objectMapper.readValue(message.getBody(), ReportStatusChangedPayload.class);
                    notificationService.handleReportStatusChanged(payload);
                }
                default -> log.warn("Unknown routing key '{}', discarding message", routingKey);
            }
            channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
        } catch (Exception e) {
            log.error("Failed to process notification message with routing key '{}'", routingKey, e);
            try {
                channel.basicNack(message.getMessageProperties().getDeliveryTag(), false, false);
            } catch (Exception nackEx) {
                throw new AmqpRejectAndDontRequeueException("Processing failed", e);
            }
        }
    }
}
