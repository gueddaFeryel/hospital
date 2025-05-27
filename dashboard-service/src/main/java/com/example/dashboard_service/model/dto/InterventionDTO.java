package com.example.dashboard_service.model.dto;

import com.example.dashboard_service.model.StatutIntervention;
import com.example.dashboard_service.model.TypeIntervention;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class InterventionDTO {
    private Long id;
    private LocalDate date;
    private StatutIntervention statut;
    private TypeIntervention type;
    private Long roomId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long patientId;
    private Long doctorId;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public StatutIntervention getStatut() { return statut; }
    public void setStatut(StatutIntervention statut) { this.statut = statut; }
    public TypeIntervention getType() { return type; }
    public void setType(TypeIntervention type) { this.type = type; }
    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
}
