package com.example.dashboard_service.model;

import java.time.LocalDateTime;

public class InterventionEvent {
    private Long interventionId;
    private Long userId;
    private LocalDateTime interventionTime;
    private InterventionEventType eventType;
    private String changeDescription;

    // Getters and Setters
    public Long getInterventionId() {
        return interventionId;
    }

    public void setInterventionId(Long interventionId) {
        this.interventionId = interventionId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public LocalDateTime getInterventionTime() {
        return interventionTime;
    }

    public void setInterventionTime(LocalDateTime interventionTime) {
        this.interventionTime = interventionTime;
    }

    public InterventionEventType getEventType() {
        return eventType;
    }

    public void setEventType(InterventionEventType eventType) {
        this.eventType = eventType;
    }

    public String getChangeDescription() {
        return changeDescription;
    }

    public void setChangeDescription(String changeDescription) {
        this.changeDescription = changeDescription;
    }
}
