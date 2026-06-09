package com.urbanpulse.notifications.messaging.events;

import java.time.OffsetDateTime;

public record UserRegisteredPayload(
        String userId,
        String email,
        String role,
        OffsetDateTime registeredAt
) {}
