package com.example.dashboard_service.model.dto;

import com.example.dashboard_service.model.StatutIntervention;
import com.example.dashboard_service.model.TypeIntervention;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class InterventionRequest {
    private LocalDate date;
    private StatutIntervention statut;
    private TypeIntervention type;
    private Long roomId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long userId;
}
