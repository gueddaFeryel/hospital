package com.example.dashboard_service.model;


import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "materiel")
public class Materiel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    @NotBlank(message = "Le nom est obligatoire")
    @Size(min = 2, max = 100, message = "Le nom doit contenir entre 2 et 100 caractères")
    private String nom;

    @Column(nullable = false)
    @NotBlank(message = "La description est obligatoire")
    @Size(min = 5, max = 255, message = "La description doit contenir entre 5 et 255 caractères")
    private String description;

    @Column(nullable = false)
    @Min(value = 1, message = "La quantité doit être au moins 1")
    private Integer quantiteDisponible;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategorieMateriel categorie;
    @Column(name = "quantite_utilisee")
    private Integer quantiteUtilisee=0;
    @ManyToMany(mappedBy = "materiels")
    @JsonBackReference
    private Set<InterventionChirurgicale> interventions = new HashSet<>();

    // Modifiez la méthode addIntervention pour gérer la quantité
    public void addIntervention(InterventionChirurgicale intervention) {
        if (this.quantiteDisponible > 0) {
            this.interventions.add(intervention);
            intervention.getMateriels().add(this);
            this.quantiteDisponible--;
        } else {
            throw new IllegalStateException("Quantité insuffisante pour ce matériel");
        }
    }
    public Integer getQuantiteUtilisee() {
        return quantiteUtilisee;
    }
    public void setQuantiteUtilisee(Integer quantiteUtilisee) {
        this.quantiteUtilisee = quantiteUtilisee;
    }
    public void removeIntervention(InterventionChirurgicale intervention) {
        this.interventions.remove(intervention);
        intervention.getMateriels().remove(this);
    }
    // Getters and Setters
    public Long getId() { return id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public void setId( Long id) { this.id = id; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getQuantiteDisponible() { return quantiteDisponible; }
    public void setQuantiteDisponible(Integer quantiteDisponible) { this.quantiteDisponible = quantiteDisponible; }
    public CategorieMateriel getCategorie() { return categorie; }
    public void setCategorie(CategorieMateriel categorie) { this.categorie = categorie; }
    public Set<InterventionChirurgicale> getInterventions() { return interventions; }
    public void setInterventions(Set<InterventionChirurgicale> interventions) { this.interventions = interventions; }



    @PrePersist
    @PreUpdate
    private void validateQuantity() {
        if (this.quantiteDisponible == null || this.quantiteDisponible < 0) {
            throw new IllegalStateException("La quantité disponible doit être positive");
        }
    }

    // Méthode sécurisée pour ajouter une intervention
    public boolean addInterventionSafely(InterventionChirurgicale intervention) {
        if (this.quantiteDisponible > 0) {
            this.interventions.add(intervention);
            this.quantiteDisponible--;
            return true;
        }
        return false;
    }
}
