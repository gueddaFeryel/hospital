package com.example.dashboard_service.Service;


import com.example.dashboard_service.model.InterventionChirurgicale;
import com.example.dashboard_service.model.InterventionEvent;
import com.example.dashboard_service.model.InterventionEventType;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class InterventionEventPublisher {

    private final ApplicationEventPublisher eventPublisher;
    private final EmailService emailService;

    public InterventionEventPublisher(ApplicationEventPublisher eventPublisher, EmailService emailService) {
        this.eventPublisher = eventPublisher;
        this.emailService = emailService;
    }

    public void publishInterventionCreated(InterventionChirurgicale intervention) {
        publishEvent(intervention, InterventionEventType.CREATED, "Nouvelle intervention créée");
        emailService.sendInterventionNotification(intervention,
                "Nouvelle intervention programmée",
                "Vous avez été assigné à une nouvelle intervention.");
    }

    public void publishInterventionUpdated(InterventionChirurgicale intervention, String changes) {
        publishEvent(intervention, InterventionEventType.UPDATED, changes);
        emailService.sendInterventionNotification(intervention,
                "Modification d'intervention",
                "L'intervention a été modifiée. Changements: " + changes);
    }

    public void publishInterventionCancelled(InterventionChirurgicale intervention) {
        publishEvent(intervention, InterventionEventType.CANCELLED, "Intervention annulée");
        emailService.sendInterventionNotification(intervention,
                "Annulation d'intervention",
                "L'intervention a été annulée.");
    }

    private void publishEvent(InterventionChirurgicale intervention, InterventionEventType eventType, String description) {
        InterventionEvent event = new InterventionEvent();
        event.setInterventionId(intervention.getId());

        event.setInterventionTime(LocalDateTime.now());
        event.setEventType(eventType);
        event.setChangeDescription(description);

        eventPublisher.publishEvent(event);
    }
}