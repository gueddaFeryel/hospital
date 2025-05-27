package com.example.dashboard_service.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@Setter
@Getter
@Entity
@Table(name = "medical_staff")
public class MedicalStaff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleMedical role;

    @Column(name = "firebase_uid", unique = true)
    private String firebaseUid;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(length = 1000000)
    private String image;
    // Spécialité pour les médecins
    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private SpecialiteMedecin specialiteMedecin;

    // Spécialité pour les anesthésistes
    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private SpecialiteAnesthesiste specialiteAnesthesiste;

    @ManyToMany(mappedBy = "equipeMedicale", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JsonBackReference
    private Set<InterventionChirurgicale> interventions = new HashSet<>();

    public MedicalStaff() {}
    public void initialize(String firebaseUid, String email, String nom, String prenom,
                           RoleMedical role, String image, String password) {
        this.firebaseUid = firebaseUid;
        this.email = Objects.requireNonNull(email, "Email is required");
        this.nom = Objects.requireNonNull(nom, "Nom is required");
        this.prenom = Objects.requireNonNull(prenom, "Prenom is required");
        this.role = Objects.requireNonNull(role, "Role is required");
        this.image = image;

    }

    public void initializeWithFirebaseUid(String firebaseUid) {
        if (this.firebaseUid == null && firebaseUid != null) {
            this.firebaseUid = firebaseUid;
        }
    }

    public void initialize(String firebaseUid, String email, String nom, String prenom, RoleMedical role) {
        this.firebaseUid = Objects.requireNonNull(firebaseUid);
        this.email = email;
        this.nom = nom;
        this.prenom = prenom;
        this.role = role;
    }

    // Méthode utilitaire pour obtenir la spécialité appropriée
    public String getSpecialite() {
        switch (this.role) {
            case MEDECIN:

                return specialiteMedecin != null ? specialiteMedecin.name() : "Non spécifiée";
            case ANESTHESISTE:
                return specialiteAnesthesiste != null ? specialiteAnesthesiste.name() : "Non spécifiée";
            default:
                return "Non applicable";
        }
    }
}
