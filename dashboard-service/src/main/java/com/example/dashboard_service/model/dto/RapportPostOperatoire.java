package com.example.dashboard_service.model.dto;

import com.example.dashboard_service.model.InterventionChirurgicale;
import com.example.dashboard_service.model.MedicalStaff;
import com.example.dashboard_service.model.StatutRapport;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "rapports_postoperatoires")
public class RapportPostOperatoire {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "intervention_id", nullable = false)
    private InterventionChirurgicale intervention;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String diagnostic;

    @Column(columnDefinition = "TEXT")
    private String complications;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String recommandations;

    @Column(columnDefinition = "TEXT")
    private String notesInfirmier;

    @ManyToOne
    @JoinColumn(name = "medecin_id", nullable = false)
    private MedicalStaff medecin;

    @ManyToOne
    @JoinColumn(name = "infirmier_id")
    private MedicalStaff infirmier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutRapport statut = StatutRapport.BROUILLON;

    @Column(nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    private LocalDateTime dateSoumission;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public InterventionChirurgicale getIntervention() {
        return intervention;
    }

    public void setIntervention(InterventionChirurgicale intervention) {
        this.intervention = intervention;
    }

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

    public MedicalStaff getMedecin() {
        return medecin;
    }

    public void setMedecin(MedicalStaff medecin) {
        this.medecin = medecin;
    }

    public MedicalStaff getInfirmier() {
        return infirmier;
    }

    public void setInfirmier(MedicalStaff infirmier) {
        this.infirmier = infirmier;
    }

    public StatutRapport getStatut() {
        return statut;
    }

    public void setStatut(StatutRapport statut) {
        this.statut = statut;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }

    public LocalDateTime getDateSoumission() {
        return dateSoumission;
    }

    public void setDateSoumission(LocalDateTime dateSoumission) {
        this.dateSoumission = dateSoumission;
    }

    // Méthode utilitaire pour vérifier si le rapport peut encore être modifié
    public boolean isEditable() {
        return this.statut == StatutRapport.BROUILLON &&
                this.dateCreation.plusHours(24).isAfter(LocalDateTime.now());
    }

    // Méthode toString pour le débogage
    @Override
    public String toString() {
        return "RapportPostOperatoire{" +
                "id=" + id +
                ", intervention=" + intervention.getId() +
                ", diagnostic='" + diagnostic + '\'' +
                ", complications='" + complications + '\'' +
                ", recommandations='" + recommandations + '\'' +
                ", notesInfirmier='" + notesInfirmier + '\'' +
                ", medecin=" + medecin.getId() +
                ", infirmier=" + (infirmier != null ? infirmier.getId() : "null") +
                ", statut=" + statut +
                ", dateCreation=" + dateCreation +
                ", dateSoumission=" + dateSoumission +
                '}';
    }
}