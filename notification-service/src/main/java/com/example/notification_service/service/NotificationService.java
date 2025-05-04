package com.example.notification_service.service;

import com.example.notification_service.model.*;
import com.example.notification_service.repository.NotificationRepository;
import com.example.notification_service.repository.UserNotificationPreferencesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    private final JavaMailSender mailSender;
    private final NotificationRepository notificationRepository;
    private final UserNotificationPreferencesRepository preferencesRepository;

    @Value("${spring.mail.username}")
    private String senderEmail;

    @Autowired
    public NotificationService(JavaMailSender mailSender,
                               NotificationRepository notificationRepository,
                               UserNotificationPreferencesRepository preferencesRepository) {
        this.mailSender = mailSender;
        this.notificationRepository = notificationRepository;
        this.preferencesRepository = preferencesRepository;
    }

    // User Preferences Methods
    public UserNotificationPreferences savePreferences(UserNotificationPreferences preferences) {
        if (preferences.getUserId() == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }

        // Validate notification channel based on contact info
        if (preferences.getPreferredChannel() == NotificationChannel.EMAIL
                && (preferences.getEmail() == null || preferences.getEmail().isBlank())) {
            throw new IllegalArgumentException("Email is required for email notifications");
        }

        if (preferences.getPreferredChannel() == NotificationChannel.SMS
                && (preferences.getPhoneNumber() == null || preferences.getPhoneNumber().isBlank())) {
            throw new IllegalArgumentException("Phone number is required for SMS notifications");
        }

        if (preferences.getPreferredChannel() == NotificationChannel.PUSH
                && (preferences.getDeviceToken() == null || preferences.getDeviceToken().isBlank())) {
            throw new IllegalArgumentException("Device token is required for push notifications");
        }

        // Set timestamps
        if (preferences.getId() == null) {
            preferences.setCreatedAt(LocalDateTime.now());
        }
        preferences.setUpdatedAt(LocalDateTime.now());

        return preferencesRepository.save(preferences);
    }

    public Optional<UserNotificationPreferences> getPreferences(Long userId) {
        return preferencesRepository.findByUserId(userId);
    }

    public UserNotificationPreferences createDefaultPreferences(Long userId) {
        UserNotificationPreferences preferences = new UserNotificationPreferences();
        preferences.setUserId(userId);
        preferences.setPreferredChannel(NotificationChannel.EMAIL);
        preferences.setReceiveReminders(true);
        preferences.setReceiveChangeAlerts(true);
        return savePreferences(preferences);
    }

    // Notification Scheduling Methods
    @Scheduled(fixedRate = 60000) // Run every minute
    public void checkForScheduledNotifications() {
        List<Notification> pendingNotifications = notificationRepository
                .findBySentFalseAndScheduledTimeBefore(LocalDateTime.now());

        pendingNotifications.forEach(this::sendNotification);
    }

    public void scheduleInterventionReminder(Long interventionId, Long userId, LocalDateTime interventionTime) {
        UserNotificationPreferences preferences = preferencesRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreferences(userId));

        if (preferences.isReceiveReminders()) {
            Notification notification = new Notification();
            notification.setUserId(userId);
            notification.setInterventionId(interventionId);
            notification.setChannel(preferences.getPreferredChannel());
            notification.setMessage("Rappel: Vous avez une intervention prévue demain");
            notification.setType(NotificationType.REMINDER);
            notification.setScheduledTime(interventionTime.minusHours(24));
            notification.setSent(false);

            notificationRepository.save(notification);
        }
    }

    public void sendChangeNotification(Long interventionId, Long userId, String changeDescription) {
        UserNotificationPreferences preferences = preferencesRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreferences(userId));

        if (preferences.isReceiveChangeAlerts()) {
            Notification notification = new Notification();
            notification.setUserId(userId);
            notification.setInterventionId(interventionId);
            notification.setChannel(preferences.getPreferredChannel());
            notification.setMessage("Changement d'intervention: " + changeDescription);
            notification.setType(NotificationType.CHANGE_ALERT);
            notification.setScheduledTime(LocalDateTime.now());
            notification.setSent(false);

            notificationRepository.save(notification);
        }
    }

    // Notification Sending Methods
    private void sendNotification(Notification notification) {
        try {
            switch (notification.getChannel()) {
                case EMAIL:
                    sendEmail(notification);
                    break;
                case SMS:
                    sendSms(notification);
                    break;
                case PUSH:
                    sendPush(notification);
                    break;
            }

            notification.setSent(true);
            notification.setSentTime(LocalDateTime.now());
        } catch (Exception e) {
            logger.error("Failed to send notification: {}", e.getMessage());
            notification.setErrorMessage(e.getMessage());
        } finally {
            notificationRepository.save(notification);
        }
    }

    private boolean sendEmail(Notification notification) {
        try {
            UserNotificationPreferences preferences = preferencesRepository.findByUserId(notification.getUserId())
                    .orElseThrow(() -> new RuntimeException("Préférences utilisateur non trouvées"));

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(preferences.getEmail());
            message.setSubject("Notification Médicale");
            message.setText(notification.getMessage());

            mailSender.send(message);
            logger.info("Email envoyé à {}", preferences.getEmail());
            return true;
        } catch (Exception e) {
            logger.error("Échec envoi email: {}", e.getMessage());
            return false;
        }
    }
    private void sendSms(Notification notification) {
        // Implement actual SMS sending logic
        logger.info("Sending SMS to user: {}, Message: {}", notification.getUserId(), notification.getMessage());
    }

    private void sendPush(Notification notification) {
        // Implement actual push notification logic
        logger.info("Sending push notification to user: {}, Message: {}", notification.getUserId(), notification.getMessage());
    }

    // Event Handling
    public void handleInterventionEvent(InterventionEvent event) {
        switch (event.getEventType()) {
            case CREATED:
                scheduleInterventionReminder(
                        event.getInterventionId(),
                        event.getUserId(),
                        event.getInterventionTime()
                );
                break;
            case UPDATED:
                sendChangeNotification(
                        event.getInterventionId(),
                        event.getUserId(),
                        event.getChangeDescription()
                );
                break;
            case CANCELLED:
                sendChangeNotification(
                        event.getInterventionId(),
                        event.getUserId(),
                        "Intervention annulée"
                );
                break;
        }
    }
}
