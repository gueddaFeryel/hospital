package com.example.dashboard_service.model.dto;
public class RejectionDTO {
    private String reason;

    // Constructeur par défaut
    public RejectionDTO() {
    }

    // Constructeur avec paramètre
    public RejectionDTO(String reason) {
        this.reason = reason;
    }

    // Getter
    public String getReason() {
        return reason;
    }

    // Setter
    public void setReason(String reason) {
        this.reason = reason;
    }

    // Méthode toString pour le débogage
    @Override
    public String toString() {
        return "RejectionDTO{" +
                "reason='" + reason + '\'' +
                '}';
    }
}