package com.example.dashboard_service.Repository;

import com.example.dashboard_service.model.StatutRapport;
import com.example.dashboard_service.model.dto.RapportPostOperatoire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RapportPostOperatoireRepository extends JpaRepository<RapportPostOperatoire, Long> {
    Optional<RapportPostOperatoire> findByInterventionId(Long interventionId);

    @Query("SELECT r FROM RapportPostOperatoire r WHERE r.medecin.id = :medecinId")
    List<RapportPostOperatoire> findByMedecinId(@Param("medecinId") Long medecinId);

    @Query("SELECT r FROM RapportPostOperatoire r WHERE r.infirmier.id = :infirmierId")
    List<RapportPostOperatoire> findByInfirmierId(@Param("infirmierId") Long infirmierId);

    @Query("SELECT r FROM RapportPostOperatoire r WHERE r.intervention.id = :interventionId AND r.medecin.id = :medecinId")
    List<RapportPostOperatoire> findByInterventionIdAndMedecinId(@Param("interventionId") Long interventionId, @Param("medecinId") Long medecinId);

    @Query("SELECT r FROM RapportPostOperatoire r WHERE r.medecin.id = :staffId OR r.infirmier.id = :staffId")
    List<RapportPostOperatoire> findByStaffId(@Param("staffId") Long staffId);



}
