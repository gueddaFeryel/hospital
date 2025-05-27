package com.example.dashboard_service.Repository;

import com.example.dashboard_service.model.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;


import java.util.List;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    @Query("SELECT p FROM Patient p WHERE LOWER(p.nom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(p.prenom) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Patient> findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCase(@Param("searchTerm") String searchTerm);

    @Query("SELECT p FROM Patient p WHERE LOWER(p.nom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(p.prenom) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<Patient> findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCase(@Param("searchTerm") String searchTerm, Pageable pageable);}
