package com.example.dashboard_service.model.dto;

import java.util.Set;

public class MaterielInterventionDTO {
    private Long interventionId;
    private Set<Long> materielIds;

    // Getters et Setters
    public Long getInterventionId() {
        return interventionId;
    }

    public void setInterventionId(Long interventionId) {
        this.interventionId = interventionId;
    }

    public Set<Long> getMaterielIds() {
        return materielIds;
    }

    public void setMaterielIds(Set<Long> materielIds) {
        this.materielIds = materielIds;
    }
}
