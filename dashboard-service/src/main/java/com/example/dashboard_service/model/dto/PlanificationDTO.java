package com.example.dashboard_service.model.dto;

import com.example.dashboard_service.model.RoleMedical;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
@Getter
@Setter
public class PlanificationDTO {
    private Long roomId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Map<RoleMedical, Long> staffAssignments; // Rôle → ID du staff
    private Set<Long> materialIds;

    // Getters et Setters
}
