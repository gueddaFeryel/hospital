package com.example.dashboard_service.model.dto;

import com.example.dashboard_service.model.StatutIntervention;
import com.example.dashboard_service.model.TypeIntervention;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
@Getter
@Setter
public class InterventionDetailDTO {
    private Long id;
    private LocalDate date;
    private StatutIntervention statut;
    private TypeIntervention type;
    private String demandeur;
    private String description;
    // getters/setters
}
