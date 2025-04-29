package com.example.dashboard_service.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;

@Getter
@Setter
public class MedicalStaffSyncDto {
    private String firebase_uid;
    private String nom;         // Obligatoire (vu votre modèle)
    private String prenom;      // Obligatoire
    private String role;        // "MEDECIN", "INFIRMIER" etc.
    private String email;

    // Getters/Setters
}
