package com.example.dashboard_service.model;


import jakarta.persistence.*;

import javax.validation.constraints.Min;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "intervention_materiel")
public class InterventionMateriel {

    @EmbeddedId
    private InterventionMaterielId id;

    @ManyToOne
    @MapsId("interventionId")
    @JoinColumn(name = "intervention_id")
    private InterventionChirurgicale intervention;

    @ManyToOne
    @MapsId("materielId")
    @JoinColumn(name = "materiel_id")
    private Materiel materiel;

    @Column(nullable = false)
    @Min(value = 1, message = "La quantité doit être au moins 1")
    private Integer quantity;

    // Constructeurs, getters et setters
    public InterventionMateriel() {}

    public InterventionMateriel(InterventionChirurgicale intervention, Materiel materiel, Integer quantity) {
        this.id = new InterventionMaterielId(intervention.getId(), materiel.getId());
        this.intervention = intervention;
        this.materiel = materiel;
        this.quantity = quantity;
    }

    // Getters et Setters
    public InterventionMaterielId getId() { return id; }
    public void setId(InterventionMaterielId id) { this.id = id; }
    public InterventionChirurgicale getIntervention() { return intervention; }
    public void setIntervention(InterventionChirurgicale intervention) { this.intervention = intervention; }
    public Materiel getMateriel() { return materiel; }
    public void setMateriel(Materiel materiel) { this.materiel = materiel; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}

@Embeddable
class InterventionMaterielId implements Serializable {

    @Column(name = "intervention_id")
    private Long interventionId;

    @Column(name = "materiel_id")
    private Long materielId;

    // Constructeurs
    public InterventionMaterielId() {}

    public InterventionMaterielId(Long interventionId, Long materielId) {
        this.interventionId = interventionId;
        this.materielId = materielId;
    }

    // Getters, Setters, equals, hashCode
    public Long getInterventionId() { return interventionId; }
    public void setInterventionId(Long interventionId) { this.interventionId = interventionId; }
    public Long getMaterielId() { return materielId; }
    public void setMaterielId(Long materielId) { this.materielId = materielId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof InterventionMaterielId)) return false;
        InterventionMaterielId that = (InterventionMaterielId) o;
        return Objects.equals(interventionId, that.interventionId) &&
                Objects.equals(materielId, that.materielId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(interventionId, materielId);
    }
}
