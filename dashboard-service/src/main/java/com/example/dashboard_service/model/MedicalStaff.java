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
    @Column(name = "firebase_uid", nullable = false, unique = true, updatable = false)
    private String firebaseUid; // Champ obligatoire et immuable // Doit être annoté correctement
    @Column(nullable = false, unique = true) // Email unique
    private String email; // Nouveau champ
    @ManyToMany(mappedBy = "equipeMedicale", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JsonBackReference
    private Set<InterventionChirurgicale> interventions = new HashSet<>();
    // Constructeur requis
    public MedicalStaff() {}

    // Méthode spéciale pour l'initialisation
    public void initializeWithFirebaseUid(String firebaseUid) {
        if (this.firebaseUid == null && firebaseUid != null) {
            this.firebaseUid = firebaseUid;
        }
    }  public void initialize(String firebaseUid, String email, String nom, String prenom, RoleMedical role) {
        this.firebaseUid = Objects.requireNonNull(firebaseUid);
        this.email = email;
        this.nom = nom;
        this.prenom = prenom;
        this.role = role;
    }
    public Long getId() {

        return id;
    }

    public void setId(Long id) {
        this.id=id;
    }

    public RoleMedical getRole() {
        return role;
    }
    public void setRole(RoleMedical role){
        this.role=role;
    }
    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    public void setFirebaseUid(String firebaseUid) {this.firebaseUid=firebaseUid;
    }


}

