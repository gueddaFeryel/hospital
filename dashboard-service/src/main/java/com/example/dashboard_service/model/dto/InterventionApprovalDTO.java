package com.example.dashboard_service.model.dto;
import java.time.LocalDateTime;

public class InterventionApprovalDTO {
    private Long roomId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    // Constructeur par défaut
    public InterventionApprovalDTO() {
    }

    // Constructeur avec paramètres
    public InterventionApprovalDTO(Long roomId, LocalDateTime startTime, LocalDateTime endTime) {
        this.roomId = roomId;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    // Getters
    public Long getRoomId() {
        return roomId;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    // Setters
    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    // Méthode toString pour le débogage
    @Override
    public String toString() {
        return "InterventionApprovalDTO{" +
                "roomId=" + roomId +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                '}';
    }
}