package com.example.dashboard_service.model.dto;

 // ou un autre package approprié

public class Notification {
    private Long interventionId;
    private String userId;
    private String message;
    private Long timestamp;

    public Notification() {
        // constructeur par défaut requis pour RestTemplate
    }

    public Long getInterventionId() {
        return interventionId;
    }

    public void setInterventionId(Long interventionId) {
        this.interventionId = interventionId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }
}
