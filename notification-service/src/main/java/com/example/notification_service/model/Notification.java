package com.example.notification_service.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
@Entity
public class Notification {
    // Getters and Setters
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long interventionId;

    @Enumerated(EnumType.STRING)
    private NotificationChannel channel;

    private String message;
    private boolean sent;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    private LocalDateTime scheduledTime;
    private LocalDateTime sentTime;

    private String errorMessage;

}
