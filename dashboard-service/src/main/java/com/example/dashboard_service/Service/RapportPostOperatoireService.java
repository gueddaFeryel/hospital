package com.example.dashboard_service.Service;

import com.example.dashboard_service.Repository.InterventionRepository;
import com.example.dashboard_service.Repository.MedicalStaffRepository;
import com.example.dashboard_service.Repository.RapportPostOperatoireRepository;
import com.example.dashboard_service.model.InterventionChirurgicale;
import com.example.dashboard_service.model.MedicalStaff;
import com.example.dashboard_service.model.StatutRapport;
import com.example.dashboard_service.model.dto.RapportPostOperatoire;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class RapportPostOperatoireService {
    @Autowired
    private RapportPostOperatoireRepository rapportRepository;

    @Autowired
    private InterventionRepository interventionRepository;

    @Autowired
    private MedicalStaffRepository medicalStaffRepository;

    public RapportPostOperatoire creerRapport(Long interventionId, Long medecinId, Map<String, Object> rapportData) {
        InterventionChirurgicale intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        MedicalStaff medecin = medicalStaffRepository.findById(medecinId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        RapportPostOperatoire rapport = new RapportPostOperatoire();
        rapport.setIntervention(intervention);
        rapport.setMedecin(medecin);
        return rapportRepository.save(rapport);
    }

    public RapportPostOperatoire mettreAJourRapport(Long id, Map<String, String> updates, Long userId) {
        RapportPostOperatoire rapport = rapportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        // Vérifier si l'utilisateur a le droit de modifier
        if (!canUserModify(rapport, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        updates.forEach((key, value) -> {
            switch (key) {
                case "diagnostic": rapport.setDiagnostic((String) value); break;
                case "complications": rapport.setComplications((String) value); break;
                case "recommandations": rapport.setRecommandations((String) value); break;
                case "notesInfirmier":
                    if (userIsInfirmier(userId)) {
                        rapport.setNotesInfirmier((String) value);
                    }
                    break;
                case "statut":
                    if (userIsMedecin(userId)) {
                        rapport.setStatut(StatutRapport.valueOf((String) value));
                        if (rapport.getStatut() == StatutRapport.SOUMIS) {
                            rapport.setDateSoumission(LocalDateTime.now());
                        }
                    }
                    break;
            }
        });

        return rapportRepository.save(rapport);
    }

    private boolean canUserModify(RapportPostOperatoire rapport, Long userId) {
        // Le médecin peut modifier dans les 24h
        if (rapport.getMedecin().getId().equals(userId)) {
            return rapport.getDateCreation().plusHours(24).isAfter(LocalDateTime.now());
        }
        // L'infirmier peut toujours ajouter des notes
        if (rapport.getInfirmier() != null && rapport.getInfirmier().getId().equals(userId)) {
            return true;
        }
        return false;
    }

    private boolean userIsMedecin(Long userId) {
        // Implémentez la logique de vérification
        return false;
    }

    private boolean userIsInfirmier(Long userId) {
        // Implémentez la logique de vérification
        return false;
    }
    public Optional<RapportPostOperatoire> findByInterventionId(Long interventionId) {
        return rapportRepository.findByInterventionId(interventionId);
    }

    public List<RapportPostOperatoire> findByMedecinId(Long medecinId) {
        return rapportRepository.findByMedecinId(medecinId);
    }

    public List<RapportPostOperatoire> findByInfirmierId(Long infirmierId) {
        return rapportRepository.findByInfirmierId(infirmierId);
    }
    public RapportPostOperatoire createRapport(Long interventionId, Long medecinId, RapportPostOperatoire request) {
        // Fetch related entities
        InterventionChirurgicale intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new RuntimeException("Intervention not found"));

        MedicalStaff medecin = medicalStaffRepository.findById(medecinId)
                .orElseThrow(() -> new RuntimeException("Medical staff not found"));

        // Create new rapport
        RapportPostOperatoire rapport = new RapportPostOperatoire();
        rapport.setDiagnostic(request.getDiagnostic());
        rapport.setComplications(request.getComplications());
        rapport.setRecommandations(request.getRecommandations());
        rapport.setNotesInfirmier(request.getNotesInfirmier());
        rapport.setStatut(StatutRapport.BROUILLON);
        rapport.setIntervention(intervention);
        rapport.setMedecin(medecin);
        rapport.setDateCreation(LocalDateTime.now());

        return rapportRepository.save(rapport);
    }

}
