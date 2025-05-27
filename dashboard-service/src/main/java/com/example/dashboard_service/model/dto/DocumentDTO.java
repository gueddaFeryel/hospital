package com.example.dashboard_service.model.dto;

import java.time.LocalDateTime;

public class DocumentDTO {
    private Long id;
    private String nomFichier;
    private String typeMime;
    private Long taille;
    private LocalDateTime dateCreation;

    public DocumentDTO(Long id, String nomFichier, String typeMime, Long taille, LocalDateTime dateCreation) {
        this.id = id;
        this.nomFichier = nomFichier;
        this.typeMime = typeMime;
        this.taille = taille;
        this.dateCreation = dateCreation;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNomFichier() { return nomFichier; }
    public void setNomFichier(String nomFichier) { this.nomFichier = nomFichier; }
    public String getTypeMime() { return typeMime; }
    public void setTypeMime(String typeMime) { this.typeMime = typeMime; }
    public Long getTaille() { return taille; }
    public void setTaille(Long taille) { this.taille = taille; }
    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
}
