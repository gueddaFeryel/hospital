package com.example.notification_service.repository;

import com.example.notification_service.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findBySentFalseAndScheduledTimeBefore(LocalDateTime now);
    List<Notification> findByInterventionId(Long interventionId);
}
