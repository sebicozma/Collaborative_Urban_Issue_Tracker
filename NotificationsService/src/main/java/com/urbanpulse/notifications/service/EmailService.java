package com.urbanpulse.notifications.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String from;

    public EmailService(JavaMailSender mailSender,
                        @Value("${notifications.mail.from:${spring.mail.username:}}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    @Retryable(
            retryFor = MailException.class,
            noRetryFor = MailAuthenticationException.class,
            maxAttemptsExpression = "${notifications.mail.retry.max-attempts:3}",
            backoff = @Backoff(
                    delayExpression = "${notifications.mail.retry.initial-interval-ms:2000}",
                    multiplierExpression = "${notifications.mail.retry.multiplier:2.0}"))
    public void send(String to, String subject, String body) {
        if (from.isBlank()) {
            log.warn("Mail sender not configured (notifications.mail.from / spring.mail.username empty), "
                    + "skipping email '{}' to {}", subject, to);
            return;
        }
        if (to == null || to.isBlank()) {
            log.warn("No recipient for email '{}', skipping", subject);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
        log.info("Email '{}' sent to {}", subject, to);
    }
}
