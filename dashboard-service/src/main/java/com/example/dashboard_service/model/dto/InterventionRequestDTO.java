package com.example.dashboard_service.model.dto;


import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.FutureOrPresent;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
@Getter
@Setter
public class InterventionRequestDTO {
    private String interventionId;
    private String doctorId;
    private String type;
    @FutureOrPresent(message = "La date ne peut pas être dans le passé")
    private LocalDate date;
    private Long roomId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private Map<String, String> equipeMedicale;
    private List<Long> materielIds;
    private String mysqlInterventionId;
    // Constructor matching the parameters
    public InterventionRequestDTO(String interventionId, String doctorId, String type, LocalDate date,
                                  Long roomId, LocalDateTime startTime, LocalDateTime endTime, String status) {
        this.interventionId = interventionId;
        this.doctorId = doctorId;
        this.type = type;
        this.date = date;
        this.roomId = roomId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
    }

    // Getters and Setters
    public String getInterventionId() {
        return interventionId;
    }

    public void setInterventionId(String interventionId) {
        this.interventionId = interventionId;
    }

    public String getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(String doctorId) {
        this.doctorId = doctorId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
