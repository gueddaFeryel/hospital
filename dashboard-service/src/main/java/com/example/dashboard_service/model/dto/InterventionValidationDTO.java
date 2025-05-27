package com.example.dashboard_service.model.dto;

import com.example.dashboard_service.model.TypeIntervention;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Getter
@Setter
public class InterventionValidationDTO {
    private LocalDate date;
    private Long roomId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Set<Long> materielIds;
    private Map<String, Long> equipeMedicale;
    private TypeIntervention type;
    private Long doctorId;
    private Long patientId;
    // Ajoutez d'autres champs si nécessaire (matériel, équipe, etc.)
// Ajoutez ces méthodes pour faciliter le traitement
    public boolean hasRoom() {
        return roomId != null;
    }

    public boolean hasMaterials() {
        return materielIds != null && !materielIds.isEmpty();
    }

    public boolean hasStaff() {
        return equipeMedicale != null && !equipeMedicale.isEmpty();
    }

}
