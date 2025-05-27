package com.example.dashboard_service.model;
public enum StatutRapport {
    BROUILLON("Brouillon"),
    SOUMIS("Soumis"),
    FINALISE("Finalisé");

    private final String libelle;

    StatutRapport(String libelle) {
        this.libelle = libelle;
    }

    public String getLibelle() {
        return libelle;
    }

    public static StatutRapport fromString(String text) {
        for (StatutRapport s : StatutRapport.values()) {
            if (s.name().equalsIgnoreCase(text)) {
                return s;
            }
        }
        throw new IllegalArgumentException("No constant with text " + text + " found");
    }
}