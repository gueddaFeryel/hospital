package com.example.dashboard_service.model.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RapportPostOperatoireRequest {
    private String diagnostic;
    private String complications;
    private String recommandations;
    private String notesInfirmier;
    private Long medecinId;
    // Default constructor
    public RapportPostOperatoireRequest() {
    }

    // Getters and Setters
    public String getDiagnostic() {
        return diagnostic;
    }

    public void setDiagnostic(String diagnostic) {
        this.diagnostic = diagnostic;
    }

    public String getComplications() {
        return complications;
    }

    public void setComplications(String complications) {
        this.complications = complications;
    }

    public String getRecommandations() {
        return recommandations;
    }

    public void setRecommandations(String recommandations) {
        this.recommandations = recommandations;
    }

    public String getNotesInfirmier() {
        return notesInfirmier;
    }

    public void setNotesInfirmier(String notesInfirmier) {
        this.notesInfirmier = notesInfirmier;
    }

    @Override
    public String toString() {
        return "RapportPostOperatoireRequest{" +
                "diagnostic='" + diagnostic + '\'' +
                ", complications='" + complications + '\'' +
                ", recommandations='" + recommandations + '\'' +
                ", notesInfirmier='" + notesInfirmier + '\'' +
                '}';
    }
}
