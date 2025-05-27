package com.example.dashboard_service.model.dto;

import java.time.LocalDate;
import java.util.List;

public class PatientWithDocumentsDTO {
    private Long id;
    private String nom;
    private String prenom;
    private LocalDate dateNaissance;
    private String adresse;
    private String telephone;
    private String email;
    private List<DocumentDTO> documents;

    // Constructeurs, getters et setters
}

