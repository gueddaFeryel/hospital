package com.example.dashboard_service.model.dto;

import com.example.dashboard_service.model.StatutIntervention;
import com.example.dashboard_service.model.TypeIntervention;
import com.example.dashboard_service.model.UrgencyLevel;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data



public class DoctorInterventionRequestDTO {
    private LocalDate date;
    private TypeIntervention type;
    private StatutIntervention statut;
    private Long doctorId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String description;
    private UrgencyLevel urgencyLevel;
    private boolean isRequest;

    // Getter et Setter pour date
    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    // Getter et Setter pour type
    public TypeIntervention getType() {
        return type;
    }

    public void setType(TypeIntervention type) {
        this.type = type;
    }

    // Getter et Setter pour statut
    public StatutIntervention getStatut() {
        return statut;
    }

    public void setStatut(StatutIntervention statut) {
        this.statut = statut;
    }

    // Getter et Setter pour doctorId
    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    // Getter et Setter pour startTime
    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    // Getter et Setter pour endTime
    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    // Getter et Setter pour description
    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    // Getter et Setter pour urgencyLevel
    public UrgencyLevel getUrgencyLevel() {
        return urgencyLevel;
    }

    public void setUrgencyLevel(UrgencyLevel urgencyLevel) {
        this.urgencyLevel = urgencyLevel;
    }

    // Getter et Setter pour isRequest
    public boolean isRequest() {
        return isRequest;
    }

    public void setRequest(boolean isRequest) {
        this.isRequest = isRequest;
    }
}
