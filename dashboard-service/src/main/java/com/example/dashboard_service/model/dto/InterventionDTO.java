package com.example.dashboard_service.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// InterventionDTO.java
@Getter
@Setter
public class InterventionDTO {
    private Long id;
    private String userId;  // Devrait probablement être Long pour correspondre aux autres classes
    private String userEmail;
    private String type;
    private LocalDateTime startTime;
    private String roomNumber;
    // Ajoutez d'autres champs si nécessaire
}
