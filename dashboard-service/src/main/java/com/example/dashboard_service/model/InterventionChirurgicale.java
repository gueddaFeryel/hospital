package com.example.dashboard_service.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.AssertTrue;
import javax.validation.constraints.FutureOrPresent;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@Table(name = "interventions")
public class InterventionChirurgicale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "doctor_id")
    private MedicalStaff doctor;
    @FutureOrPresent(message = "La date ne peut pas être dans le passé")
    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutIntervention statut;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeIntervention type;

    @Column(name = "room_id")
    private Long roomId;
    @ManyToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;
    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;



    @ManyToMany
    @JsonManagedReference
    @JoinTable(
            name = "intervention_materiel",
            joinColumns = @JoinColumn(name = "intervention_id"),
            inverseJoinColumns = @JoinColumn(name = "materiel_id")
    )
    private Set<Materiel> materiels = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "intervention_medical_staff",
            joinColumns = @JoinColumn(name = "intervention_id"),
            inverseJoinColumns = @JoinColumn(name = "medical_staff_id")
    )
    private Set<MedicalStaff> equipeMedicale = new HashSet<>();

    // Validation methods
    @AssertTrue(message = "La durée ne doit pas dépasser 24 heures")
    public boolean isDurationValid() {
        if (startTime == null || endTime == null) {
            return true;
        }
        Duration duration = Duration.between(startTime, endTime);
        return !duration.isNegative() && duration.toHours() <= 24;
    }

    // Constructors
    public InterventionChirurgicale() {}

    public InterventionChirurgicale(LocalDate date, StatutIntervention statut, TypeIntervention type) {
        this.date = date;
        this.statut = statut;
        this.type = type;
    }

    // Getters and Setters
    // (Lombok @Getter and @Setter will generate these)
}
