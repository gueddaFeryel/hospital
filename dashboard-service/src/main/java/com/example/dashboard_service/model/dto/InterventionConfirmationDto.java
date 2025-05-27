package com.example.dashboard_service.model.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InterventionConfirmationDto {
    private String doctorId;
    private String interventionId;
    private String additionalMessage;

    // Constructeurs, getters, setters...
}

