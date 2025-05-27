package com.example.dashboard_service.model.dto;

import com.example.dashboard_service.model.SpecialiteAnesthesiste;
import com.example.dashboard_service.model.SpecialiteMedecin;
import jakarta.persistence.Column;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.AssertFalse;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

@Getter
@Setter
public class MedicalStaffSyncDto {

    private String firebase_uid;
    private String nom;         // Obligatoire (vu votre modèle)
    private String prenom;      // Obligatoire
    private String role;        // "MEDECIN", "INFIRMIER" etc.
    private String email;

    @NotEmpty(message = "Le mot de passe est requis")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String specialiteMedecin;
    private String specialiteAnesthesiste;
    @NotEmpty(message = "L'image est requise")
    @Size(max = 800000, message = "L'image ne doit pas dépasser 800KB")
    @Pattern(
            regexp = "^data:image/(jpeg|png|gif);base64,[a-zA-Z0-9+/]+={0,2}$",
            message = "Format Base64 invalide"
    )

    private String image;
    public SpecialiteMedecin getSpecialiteMedecinAsEnum() {
        try {
            return specialiteMedecin != null ? SpecialiteMedecin.valueOf(specialiteMedecin) : null;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    public SpecialiteAnesthesiste getSpecialiteAnesthesisteAsEnum() {
        try {
            return specialiteAnesthesiste != null ? SpecialiteAnesthesiste.valueOf(specialiteAnesthesiste) : null;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @AssertFalse(message = "Un admin ne peut pas avoir de spécialité")
    public boolean isSpecialitePresentForAdmin() {
        return (role != null && role.equals("ADMIN") &&
                (specialiteMedecin != null || specialiteAnesthesiste != null));
    }  // Getters/Setters
}
