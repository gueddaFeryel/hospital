package com.example.dashboard_service.Repository;

import com.example.dashboard_service.model.StatutRapport;
import com.example.dashboard_service.model.dto.RapportPostOperatoire;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RapportPostOperatoireRepository extends JpaRepository<RapportPostOperatoire, Long> {
    Optional<RapportPostOperatoire> findByInterventionId(Long interventionId);
    List<RapportPostOperatoire> findByMedecinId(Long medecinId);
    List<RapportPostOperatoire> findByInfirmierId(Long infirmierId);
    List<RapportPostOperatoire> findByStatut(StatutRapport statut);
}
