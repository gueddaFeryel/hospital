package com.example.notification_service.controller;

import com.example.notification_service.model.*;
import com.example.notification_service.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @PostMapping("/preferences")
    public ResponseEntity<UserNotificationPreferences> savePreferences(
            @RequestBody UserNotificationPreferences preferences) {
        return ResponseEntity.ok(notificationService.savePreferences(preferences));
    }

    @GetMapping("/preferences/{userId}")
    public ResponseEntity<UserNotificationPreferences> getPreferences(
            @PathVariable Long userId) {
        return notificationService.getPreferences(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/default-preferences/{userId}")
    public ResponseEntity<UserNotificationPreferences> createDefaultPreferences(
            @PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.createDefaultPreferences(userId));
    }

    @PostMapping("/intervention-event")
    public ResponseEntity<Void> handleInterventionEvent(
            @RequestBody InterventionEvent event) {
        notificationService.handleInterventionEvent(event);
        return ResponseEntity.ok().build();
    }
}
