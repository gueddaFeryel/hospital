package com.example.dashboard_service.Service;



import com.example.dashboard_service.Repository.InterventionRepository;
import com.example.dashboard_service.Repository.MaterielRepository;
import com.example.dashboard_service.Repository.MedicalStaffRepository;
import com.example.dashboard_service.model.*;
import com.example.dashboard_service.model.dto.InterventionRequest;
import com.example.dashboard_service.model.dto.MaterielAssignmentDTO;
import jakarta.transaction.Transactional;
import org.apache.catalina.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InterventionService {
    @Autowired
    private EmailService emailService;
    @Autowired
    private InterventionRepository interventionRepository;
   @Autowired
    private MaterielRepository materielRepository;
    @Autowired
    private NotificationClient notificationClient;

    public InterventionChirurgicale creerIntervention(InterventionChirurgicale intervention) {
        InterventionChirurgicale saved = interventionRepository.save(intervention);

        // Envoyer notification
        sendInterventionNotification(saved, "CREATED", "Nouvelle intervention créée");
        return saved;
    }

    public List<InterventionChirurgicale> getInterventionsParDate(LocalDate date) {
        return interventionRepository.findByDate(date);
    }


    // Ajoutez cette méthode
    public List<InterventionChirurgicale> getAllInterventions() {
        return interventionRepository.findAll();
    }

    public List<InterventionChirurgicale> getInterventionsParStatut(StatutIntervention statut) {
        return interventionRepository.findByStatut(statut);
    }

    public List<InterventionChirurgicale> getInterventionsParType(TypeIntervention type) {
        return interventionRepository.findByType(type);
    }

    public List<InterventionChirurgicale> getInterventionsEntreDates(LocalDate debut, LocalDate fin) {
        return interventionRepository.findByDateBetween(debut, fin);
    }




    public InterventionChirurgicale annulerIntervention(Long id) {
        InterventionChirurgicale intervention = interventionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        intervention.setStatut(StatutIntervention.ANNULEE);
        interventionRepository.save(intervention);
        sendInterventionNotification(intervention, "CANCELLED", "Intervention annulée");
        return intervention;
    }

    public void supprimerIntervention(Long id) {
        interventionRepository.deleteById(id);
    }

    public Optional<InterventionChirurgicale> getInterventionById(Long id) {
        return interventionRepository.findById(id);
    }

    @Transactional
    public InterventionChirurgicale modifierIntervention(Long id, Map<String, Object> updates) {
        InterventionChirurgicale intervention = interventionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        // Appliquer modifications
        updates.forEach((key, value) -> {
            switch (key) {
                case "date": intervention.setDate(LocalDate.parse(value.toString())); break;
                case "statut": intervention.setStatut(StatutIntervention.valueOf(value.toString())); break;
                // ... autres cas
            }
        });

        InterventionChirurgicale updated = interventionRepository.save(intervention);
        sendInterventionNotification(updated, "UPDATED", "Intervention modifiée");
        return updated;
    }
    private void sendInterventionNotification(InterventionChirurgicale intervention,
                                              String eventType, String message) {
        try {
            InterventionEvent event = new InterventionEvent();
            event.setEventType(InterventionEventType.valueOf(eventType));
            event.setInterventionId(intervention.getId());

            event.setInterventionTime(intervention.getStartTime());
            event.setChangeDescription(message);

            notificationClient.sendInterventionEvent(event);
        } catch (Exception e) {
            // Log error but don't break flow
        }
    }

    private void validerTypeIntervention(TypeIntervention type) {
        try {
            TypeIntervention.valueOf(type.name()); // Vérifie que le type est valide
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Type d'intervention invalide: " + type);
        }
    }





    // Ajoutez ces méthodes à InterventionService

    @Autowired
    private MaterielService materielService;

    @Transactional
    public InterventionChirurgicale assignerMateriel(Long interventionId, Set<Long> materielIds) {
        // 1. Charger l'intervention
        InterventionChirurgicale intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Intervention non trouvée"));

        // 2. Désassocier les matériels existants
        Set<Materiel> anciensMateriels = new HashSet<>(intervention.getMateriels());
        for (Materiel ancienMateriel : anciensMateriels) {
            ancienMateriel.getInterventions().remove(intervention);
            ancienMateriel.setQuantiteDisponible(ancienMateriel.getQuantiteDisponible() + 1);
            materielRepository.save(ancienMateriel);
        }
        intervention.getMateriels().clear();

        // 3. Associer les nouveaux matériels
        for (Long materielId : materielIds) {
            Materiel materiel = materielService.getMaterielById(materielId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Matériel non trouvé: " + materielId));

            // Vérifier la disponibilité
            if (materiel.getQuantiteDisponible() <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Matériel non disponible: " + materiel.getNom());
            }

            // Mettre à jour la quantité disponible
            materiel.setQuantiteDisponible(materiel.getQuantiteDisponible() - 1);

            // Ajouter la relation des deux côtés
            materiel.getInterventions().add(intervention);
            intervention.getMateriels().add(materiel);

            materielRepository.save(materiel);
        }

        return interventionRepository.save(intervention);
    }
    public InterventionChirurgicale updateMaterielForIntervention(Long interventionId, Set<Long> materielIds) {
        return assignerMateriel(interventionId, materielIds);
    }



    @Autowired
    private MedicalStaffRepository medicalStaffRepository;

    @Transactional
    public InterventionChirurgicale assignerEquipeMedicale(Long interventionId, Map<RoleMedical, Long> staffIds) {
        InterventionChirurgicale intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Intervention non trouvée"));

        // Vérifier les disponibilités
        LocalDateTime start = intervention.getStartTime() != null ?
                intervention.getStartTime() : intervention.getDate().atStartOfDay();
        LocalDateTime end = intervention.getEndTime() != null ?
                intervention.getEndTime() : intervention.getDate().atTime(23, 59);

        for (Map.Entry<RoleMedical, Long> entry : staffIds.entrySet()) {
            RoleMedical role = entry.getKey();
            Long staffId = entry.getValue();

            MedicalStaff staff = medicalStaffRepository.findById(staffId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, role + " non trouvé"));

            if (!staff.getRole().equals(role)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Le personnel " + staffId + " n'est pas un " + role);
            }

            // Vérifier disponibilité
            boolean estDisponible = interventionRepository
                    .findByEquipeMedicaleIdAndDateTimeRange(staffId, start, end)
                    .isEmpty();

            if (!estDisponible) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        role + " " + staffId + " n'est pas disponible pour cette plage horaire");
            }
        }

        // Assigner le nouveau personnel
        intervention.getEquipeMedicale().removeIf(staff ->
                staffIds.keySet().contains(staff.getRole()));

        for (Map.Entry<RoleMedical, Long> entry : staffIds.entrySet()) {
            MedicalStaff staff = medicalStaffRepository.findById(entry.getValue()).get();
            intervention.getEquipeMedicale().add(staff);
        }

        return interventionRepository.save(intervention);
    }

    public Set<MedicalStaff> getEquipeMedicale(Long interventionId) {
        return interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Intervention non trouvée"))
                .getEquipeMedicale();
    }
    @Transactional
    public InterventionChirurgicale assignerStaffAvecDisponibilite(
            Long interventionId,
            Map<RoleMedical, Long> staffAssignments) {

        // 1. Récupérer l'intervention
        InterventionChirurgicale intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Intervention non trouvée"));

        // 2. Vérifier les disponibilités pour chaque membre du staff
        LocalDateTime start = intervention.getStartTime() != null ?
                intervention.getStartTime() : intervention.getDate().atStartOfDay();
        LocalDateTime end = intervention.getEndTime() != null ?
                intervention.getEndTime() : intervention.getDate().atTime(23, 59);

        for (Map.Entry<RoleMedical, Long> entry : staffAssignments.entrySet()) {
            RoleMedical role = entry.getKey();
            Long staffId = entry.getValue();

            // Vérifier que le staff existe
            MedicalStaff staff = medicalStaffRepository.findById(staffId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, role + " non trouvé"));

            // Vérifier que le rôle correspond
            if (!staff.getRole().equals(role)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Le personnel " + staffId + " n'est pas un " + role);
            }

            // Vérifier la disponibilité
            List<InterventionChirurgicale> conflits = interventionRepository
                    .findByEquipeMedicaleIdAndDateTimeRange(staffId, start, end)
                    .stream()
                    .filter(i -> !i.getId().equals(interventionId)) // Exclure l'intervention actuelle
                    .toList();

            if (!conflits.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        role + " " + staff.getNom() + " " + staff.getPrenom() +
                                " n'est pas disponible pour cette plage horaire");
            }
        }

        // 3. Mettre à jour l'équipe médicale
        // D'abord supprimer les anciennes affectations pour les rôles concernés
        intervention.getEquipeMedicale().removeIf(staff ->
                staffAssignments.keySet().contains(staff.getRole()));

        // Puis ajouter les nouveaux membres
        for (Map.Entry<RoleMedical, Long> entry : staffAssignments.entrySet()) {
            MedicalStaff staff = medicalStaffRepository.findById(entry.getValue())
                    .orElseThrow(); // Normalement déjà vérifié plus haut
            intervention.getEquipeMedicale().add(staff);
        }

        return interventionRepository.save(intervention);
    }


    public List<MedicalStaff> findAvailableStaff(LocalDateTime start, LocalDateTime end, RoleMedical role) {
        // 1. Get all staff with the specified role
        List<MedicalStaff> allStaff = medicalStaffRepository.findByRole(role);

        // 2. Filter out staff who are already assigned to interventions during this time
        List<MedicalStaff> availableStaff = new ArrayList<>();

        for (MedicalStaff staff : allStaff) {
            List<InterventionChirurgicale> conflictingInterventions = interventionRepository
                    .findByEquipeMedicaleIdAndDateTimeRange(staff.getId(), start, end);

            if (conflictingInterventions.isEmpty()) {
                availableStaff.add(staff);
            }
        }

        return availableStaff;
    }







    public Map<Long, Integer> checkMaterielAvailability(Set<Long> materielIds) {
        Map<Long, Integer> unavailableMateriels = new HashMap<>();

        for (Long materielId : materielIds) {
            Materiel materiel = materielRepository.findById(materielId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Matériel non trouvé: " + materielId
                    ));

            // Vérifier si la quantité disponible est suffisante
            int required = 1; // ou la quantité nécessaire
            if (materiel.getQuantiteDisponible() < required) {
                unavailableMateriels.put(materielId, required - materiel.getQuantiteDisponible());
            }
        }

        return unavailableMateriels;
    }

    public void returnMaterielsToStock(Long interventionId) {
        InterventionChirurgicale intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Intervention non trouvée: " + interventionId
                ));

        // Vérifier que l'intervention est bien terminée
        if (intervention.getStatut() != StatutIntervention.TERMINEE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "L'intervention n'est pas terminée"
            );
        }

        // Pour chaque matériel, incrémenter le stock
        for (Materiel materiel : intervention.getMateriels()) {
            materiel.setQuantiteDisponible(materiel.getQuantiteDisponible() + 1); // ou la quantité à retourner
            materielRepository.save(materiel);
        }

        // Optionnel: vider les matériels de l'intervention
        intervention.getMateriels().clear();
        interventionRepository.save(intervention);
    }
    @Transactional
    public InterventionChirurgicale assignMaterials(Long interventionId, List<MaterielAssignmentDTO> assignments) {
        InterventionChirurgicale intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Intervention non trouvée"));

        // Récupérer tous les matériels en une seule requête
        List<Long> materialIds = assignments.stream()
                .map(MaterielAssignmentDTO::getMaterialId)
                .collect(Collectors.toList());

        List<Materiel> materiels = materielRepository.findAllById(materialIds);

        // Vérifier que tous les matériels existent
        if (materiels.size() != assignments.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Un ou plusieurs matériels n'existent pas");
        }

        // Vérifier les quantités disponibles
        for (MaterielAssignmentDTO assignment : assignments) {
            Materiel materiel = materiels.stream()
                    .filter(m -> m.getId().equals(assignment.getMaterialId()))
                    .findFirst()
                    .orElseThrow();

            if (materiel.getQuantiteDisponible() < assignment.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Quantité insuffisante pour le matériel: " + materiel.getNom());
            }
        }

        // Associer les matériels à l'intervention
        intervention.setMateriels((Set<Materiel>) materiels);
        return interventionRepository.save(intervention);
    }

    @Scheduled(cron = "0 0 9 * * ?") // Tous les jours à 9h
    public void sendInterventionReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<InterventionChirurgicale> interventions = interventionRepository.findByDate(tomorrow);

        for (InterventionChirurgicale intervention : interventions) {
            emailService.sendReminder(intervention);
        }
    }
}


