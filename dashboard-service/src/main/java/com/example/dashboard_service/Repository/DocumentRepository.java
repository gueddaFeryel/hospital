package com.example.dashboard_service.Repository;

import com.example.dashboard_service.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {


    @Query("SELECT d.nomFichier FROM Document d WHERE d.patient.id = :patientId")
    List<String> findFilenamesByPatientId(@Param("patientId") Long patientId);
    List<Document> findByPatientId(Long patientId);
}
