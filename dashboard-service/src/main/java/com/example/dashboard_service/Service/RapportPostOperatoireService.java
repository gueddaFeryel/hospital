package com.example.dashboard_service.Service;

import com.example.dashboard_service.Repository.InterventionRepository;
import com.example.dashboard_service.Repository.MedicalStaffRepository;
import com.example.dashboard_service.Repository.RapportPostOperatoireRepository;
import com.example.dashboard_service.model.InterventionChirurgicale;
import com.example.dashboard_service.model.MedicalStaff;
import com.example.dashboard_service.model.RoleMedical;
import com.example.dashboard_service.model.StatutRapport;
import com.example.dashboard_service.model.dto.RapportPostOperatoire;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
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

    public RapportPostOperatoire mettreAJourRapport(Long id, Map<String, Object> updates, Long userId) {
        // Récupération du rapport
        RapportPostOperatoire rapport = rapportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rapport non trouvé"));

        // Récupération de l'utilisateur
        MedicalStaff user = medicalStaffRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur non trouvé"));

        // Validation: seul le médecin associé peut modifier
        if (!user.getRole().equals(RoleMedical.MEDECIN)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Seuls les médecins peuvent modifier ce rapport"
            );
        }

        // Validation: délai de 24h
        if (rapport.getDateCreation().plusHours(24).isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Modification impossible après 24h"
            );
        }

        // Traitement des champs autorisés
        updates.forEach((key, value) -> {
            switch (key) {
                case "diagnostic":
                    rapport.setDiagnostic((String) value);
                    break;
                case "complications":
                    rapport.setComplications(value != null ? value.toString() : null);
                    break;
                case "recommandations":
                    rapport.setRecommandations((String) value);
                    break;
                case "statut":
                    if (value != null) {
                        try {
                            StatutRapport statut = StatutRapport.valueOf((String) value);
                            rapport.setStatut(statut);
                            if (statut == StatutRapport.SOUMIS) {
                                rapport.setDateSoumission(LocalDateTime.now());
                            }
                        } catch (IllegalArgumentException e) {
                            throw new ResponseStatusException(
                                    HttpStatus.BAD_REQUEST,
                                    "Statut invalide"
                            );
                        }
                    }
                    break;
                default:
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Champ non autorisé: " + key
                    );
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
        // Vérification que l'utilisateur est bien un médecin
        MedicalStaff medecin = medicalStaffRepository.findById(medecinId)
                .orElseThrow(() -> new RuntimeException("Medical staff not found"));

        if (!medecin.getRole().equals(RoleMedical.MEDECIN)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seuls les médecins peuvent créer des rapports");
        }

        InterventionChirurgicale intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new RuntimeException("Intervention not found"));

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

    public RapportPostOperatoire ajouterNotesInfirmier(Long id, String notes, Long infirmierId) {
        // Récupération du rapport
        RapportPostOperatoire rapport = rapportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rapport non trouvé"));

        // Récupération de l'infirmier
        MedicalStaff infirmier = medicalStaffRepository.findById(infirmierId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Infirmier non trouvé"));

        // Validation du rôle
        if (!infirmier.getRole().equals(RoleMedical.INFIRMIER)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Seuls les infirmiers peuvent modifier les notes"
            );
        }

        // Si aucun infirmier n'est associé, l'associer
        if (rapport.getInfirmier() == null) {
            rapport.setInfirmier(infirmier);
        }
        // Si un autre infirmier est déjà associé, vérifier que c'est le même
        else if (!rapport.getInfirmier().getId().equals(infirmierId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Vous ne pouvez modifier que vos propres notes"
            );
        }

        // Mise à jour des notes
        rapport.setNotesInfirmier(notes);
        return rapportRepository.save(rapport);
    }






    public List<RapportPostOperatoire> findByInterventionIdAndMedecinId(Long interventionId, Long medecinId) {
        return rapportRepository.findByInterventionIdAndMedecinId(interventionId, medecinId);
    }


    public List<RapportPostOperatoire> findByStaffId(Long staffId) {
        return rapportRepository.findByStaffId(staffId);
    }



    public List<RapportPostOperatoire> findAll() {
        return rapportRepository.findAll();
    }
}
