package com.example.dashboard_service.Service;



import com.example.dashboard_service.Repository.InterventionRepository;
import com.example.dashboard_service.Repository.MaterielRepository;
import com.example.dashboard_service.Repository.MedicalStaffRepository;
import com.example.dashboard_service.Repository.PatientRepository;
import com.example.dashboard_service.model.*;
import com.example.dashboard_service.model.dto.InterventionDTO;
import com.example.dashboard_service.model.dto.InterventionRequest;
import com.example.dashboard_service.model.dto.InterventionValidationDTO;
import com.example.dashboard_service.model.dto.MaterielAssignmentDTO;
import jakarta.transaction.Transactional;
import org.apache.catalina.User;
import org.hibernate.Hibernate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    private PatientRepository patientRepository;
   @Autowired
    private MaterielRepository materielRepository;
    @Autowired
    private NotificationClient notificationClient;
    private static final Logger log = LoggerFactory.getLogger(InterventionService.class);
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
    public Page<InterventionDTO> getAllInterventions(Pageable pageable) {
        log.info("Fetching interventions with pagination: page={}, size={}",
                pageable.getPageNumber(), pageable.getPageSize());
        Page<InterventionChirurgicale> interventions = interventionRepository.findAll(pageable);
        Page<InterventionDTO> dtoPage = interventions.map(intervention -> {
            InterventionDTO dto = new InterventionDTO();
            dto.setId(intervention.getId());
            dto.setDate(intervention.getDate());
            dto.setStatut(intervention.getStatut());
            dto.setType(intervention.getType());
            dto.setRoomId(intervention.getRoomId());
            dto.setStartTime(intervention.getStartTime());
            dto.setEndTime(intervention.getEndTime());
            dto.setPatientId(intervention.getPatient() != null ? intervention.getPatient().getId() : null);
            dto.setDoctorId(intervention.getDoctor() != null ? intervention.getDoctor().getId() : null);
            return dto;
        });
        log.info("Found {} interventions, total elements: {}",
                dtoPage.getContent().size(), dtoPage.getTotalElements());
        return dtoPage;
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




    @Transactional
    public InterventionChirurgicale annulerIntervention(Long id) {
        log.info("Attempting to cancel intervention ID: {}", id);

        InterventionChirurgicale intervention = interventionRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Intervention ID: {} not found", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Intervention non trouvée");
                });

        // Validate status transition
        if (intervention.getStatut() == StatutIntervention.TERMINEE ||
                intervention.getStatut() == StatutIntervention.ANNULEE) {
            log.warn("Cannot cancel intervention ID: {} with status: {}", id, intervention.getStatut());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Impossible d'annuler une intervention terminée ou déjà annulée");
        }

        // Retourner les matériels au stock
        log.debug("Returning materials to stock for intervention ID: {}", id);
        returnMaterielsToStock(intervention);

        // Update status
        intervention.setStatut(StatutIntervention.ANNULEE);
        InterventionChirurgicale saved = interventionRepository.save(intervention);
        log.info("Intervention ID: {} status updated to ANNULEE", id);

        // Send notification
        log.debug("Sending cancellation notification for intervention ID: {}", id);
        sendInterventionNotification(saved, "CANCELLED", "Intervention annulée");

        return saved;
    }
    @Transactional
    public InterventionChirurgicale completeIntervention(Long id) {
        InterventionChirurgicale intervention = interventionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (intervention.getStatut() != StatutIntervention.EN_COURS) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Seules les interventions EN_COURS peuvent être terminées"
            );
        }

        // Retourner les matériels au stock
        returnMaterielsToStock(intervention);  // <-- Ceci est la clé

        intervention.setStatut(StatutIntervention.TERMINEE);
        return interventionRepository.save(intervention);
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Intervention non trouvée"));

        log.info("Processing updates for intervention ID: {}, Updates: {}", id, updates);

        // Appliquer modifications
        updates.forEach((key, value) -> {
            try {
                switch (key) {
                    case "type":
                        intervention.setType(TypeIntervention.valueOf(value.toString()));
                        log.debug("Updated type to: {}", value);
                        break;
                    case "date":
                        intervention.setDate(LocalDate.parse(value.toString()));
                        log.debug("Updated date to: {}", value);
                        break;
                    case "statut":
                        intervention.setStatut(StatutIntervention.valueOf(value.toString()));
                        log.debug("Updated statut to: {}", value);
                        break;
                    case "roomId":
                        intervention.setRoomId(value instanceof Number ? ((Number) value).longValue() : Long.parseLong(value.toString()));
                        log.debug("Updated roomId to: {}", value);
                        break;
                    case "startTime":
                        intervention.setStartTime(LocalDateTime.parse(value.toString()));
                        log.debug("Updated startTime to: {}", value);
                        break;
                    case "endTime":
                        intervention.setEndTime(LocalDateTime.parse(value.toString()));
                        log.debug("Updated endTime to: {}", value);
                        break;
                    default:
                        log.warn("Unrecognized update field: {}", key);
                }
            } catch (IllegalArgumentException e) {
                log.error("Invalid value for field {}: {}", key, value, e);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valeur invalide pour " + key + ": " + value, e);
            } catch (Exception e) {
                log.error("Error processing field {}: {}", key, value, e);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Erreur lors du traitement de " + key + ": " + value, e);
            }
        });

        InterventionChirurgicale updated = interventionRepository.save(intervention);
        log.info("Saved intervention ID: {} with updated values: type={}, date={}, statut={}, roomId={}, startTime={}, endTime={}",
                id, updated.getType(), updated.getDate(), updated.getStatut(),
                updated.getRoomId(), updated.getStartTime(), updated.getEndTime());
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
        InterventionChirurgicale intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Intervention non trouvée"));

        // Charger tous les matériels
        List<Materiel> nouveauxMateriels = materielRepository.findAllById(materielIds);

        if (nouveauxMateriels.size() != materielIds.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Certains matériels n'existent pas");
        }

        // Vérifier les quantités disponibles (sans modifier les quantités)
        for (Materiel materiel : nouveauxMateriels) {
            // Calculer la quantité réellement disponible
            long enUsage = interventionRepository.countMaterielInNonCompletedInterventions(materiel.getId());
            int disponibleReel = materiel.getQuantiteDisponible() - (int)enUsage;

            if (disponibleReel <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Matériel non disponible: " + materiel.getNom());
            }
        }

        // Mettre à jour les associations sans modifier les quantités
        intervention.setMateriels(new HashSet<>(nouveauxMateriels));
        return interventionRepository.save(intervention);
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
                            "Matériel non trouvé: " + materielId));

            // Calculer la quantité réellement disponible
            long enUsage = interventionRepository.countMaterielInNonCompletedInterventions(materielId);
            int disponibleReel = materiel.getQuantiteDisponible() - (int)enUsage;

            if (disponibleReel <= 0) {
                unavailableMateriels.put(materielId, 1 - disponibleReel);
            }
        }

        return unavailableMateriels;
    }

    // Version avec ID (existante)


    // Nouvelle version avec InterventionChirurgicale

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






    @Scheduled(fixedRate = 60000) // Exécuté toutes les minutes
    public void updateInterventionStatusesAutomatically() {
        LocalDateTime now = LocalDateTime.now();
        log.info("Début de la vérification automatique des statuts des interventions - {}", now);

        // 1. Mettre à jour les interventions PLANIFIEE -> EN_COURS (si l'heure de début est passée)
        List<InterventionChirurgicale> toStart = interventionRepository
                .findByStatutAndStartTimeLessThanEqual(StatutIntervention.PLANIFIEE, now);

        if (!toStart.isEmpty()) {
            log.info("{} intervention(s) à démarrer automatiquement", toStart.size());

            toStart.forEach(intervention -> {
                try {
                    intervention.setStatut(StatutIntervention.EN_COURS);
                    interventionRepository.save(intervention);

                    log.info("Intervention {} démarrée automatiquement (début prévu: {})",
                            intervention.getId(), intervention.getStartTime());

                    // Envoyer une notification
                    sendInterventionNotification(
                            intervention,
                            "STARTED",
                            "Intervention démarrée automatiquement"
                    );

                    // Envoyer un email à l'équipe
                    sendStatusChangeEmail(intervention, "démarrée");

                } catch (Exception e) {
                    log.error("Erreur lors du démarrage automatique de l'intervention {}",
                            intervention.getId(), e);
                }
            });
        }

        // 2. Mettre à jour les interventions EN_COURS -> TERMINEE (si l'heure de fin est passée)
        List<InterventionChirurgicale> toComplete = interventionRepository
                .findByStatutAndEndTimeLessThan(StatutIntervention.EN_COURS, now);

        if (!toComplete.isEmpty()) {
            log.info("{} intervention(s) à terminer automatiquement", toComplete.size());

            toComplete.forEach(intervention -> {
                try {
                    intervention.setStatut(StatutIntervention.TERMINEE);

                    // Retourner les matériels au stock
                    returnMaterielsToStock(intervention);

                    interventionRepository.save(intervention);

                    log.info("Intervention {} terminée automatiquement (fin prévue: {}). Matériels retournés au stock.",
                            intervention.getId(), intervention.getEndTime());

                    // Envoyer une notification
                    sendInterventionNotification(
                            intervention,
                            "COMPLETED",
                            "Intervention terminée automatiquement"
                    );

                    // Envoyer un email à l'équipe
                    sendStatusChangeEmail(intervention, "terminée");

                } catch (Exception e) {
                    log.error("Erreur lors de la terminaison automatique de l'intervention {}",
                            intervention.getId(), e);
                }
            });
        }

        log.info("Fin de la vérification automatique des statuts des interventions");
    }

    private void sendStatusChangeEmail(InterventionChirurgicale intervention, String status) {
        try {
            String subject = String.format("Intervention #%d %s", intervention.getId(), status);
            String content = String.format(
                    "L'intervention #%d prévue le %s a été %s automatiquement.\n\n" +
                            "Type: %s\n" +
                            "Salle: %s\n" +
                            "Statut: %s",
                    intervention.getId(),
                    intervention.getDate(),
                    status,
                    intervention.getType(),
                    intervention.getRoomId(),
                    intervention.getStatut()
            );

            // Envoyer à l'équipe médicale
            intervention.getEquipeMedicale().forEach(staff -> {
                if (staff.getEmail() != null) {
                    emailService.sendEmail(staff.getEmail(), subject, content);
                }
            });

        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de changement de statut", e);
        }
    }

    @Transactional
    public void returnMaterielsToStock(InterventionChirurgicale intervention) {
        if (intervention == null) {
            throw new IllegalArgumentException("L'intervention ne peut pas être null");
        }

        if (intervention.getMateriels() == null || intervention.getMateriels().isEmpty()) {
            return;
        }

        // Seulement diminuer les quantités si l'intervention est terminée
        if (intervention.getStatut() == StatutIntervention.TERMINEE) {
            for (Materiel materiel : intervention.getMateriels()) {
                if (materiel != null) {
                    int quantiteUtilisee = (materiel.getQuantiteUtilisee() != null && materiel.getQuantiteUtilisee() > 0)
                            ? materiel.getQuantiteUtilisee()
                            : 1;

                    materiel.setQuantiteDisponible(materiel.getQuantiteDisponible() - quantiteUtilisee);
                    materielRepository.save(materiel);
                }
            }
        }

        // Vider la liste des matériels dans tous les cas
        intervention.getMateriels().clear();
        interventionRepository.save(intervention);
    }
    // Méthode pour envoyer un email de confirmation
    private void sendCompletionEmail(InterventionChirurgicale intervention) {
        try {
            String subject = "Intervention #" + intervention.getId() + " terminée";
            String content = "L'intervention du " + intervention.getDate() + " a été marquée comme terminée.\n\n" +
                    "Tous les matériels ont été retournés au stock automatiquement.";

            // Envoyer à l'équipe médicale
            intervention.getEquipeMedicale().forEach(staff -> {
                if (staff.getEmail() != null) {
                    emailService.sendEmail(staff.getEmail(), subject, content);
                }
            });

            // Envoyer au responsable
            emailService.sendEmail("responsable@hopital.com", subject, content);

        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de confirmation", e);
        }
    }












    @Transactional
    public InterventionChirurgicale updateInterventionStatus(Long id, StatutIntervention newStatus) {
        InterventionChirurgicale intervention = interventionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        // Valider la transition de statut
        if (intervention.getStatut() == StatutIntervention.TERMINEE ||
                intervention.getStatut() == StatutIntervention.ANNULEE) {
            throw new IllegalStateException("Cannot change status from TERMINEE/ANNULEE");
        }

        intervention.setStatut(newStatus);

        // Si on passe à TERMINEE, retourner les matériels
        if (newStatus == StatutIntervention.TERMINEE) {
            returnMaterielsToStock(intervention);
        }

        return interventionRepository.save(intervention);
    }







    public void validateDoctorAssignment(MedicalStaff staff, TypeIntervention interventionType) {
        if (!MedicalRoleValidator.isRoleValidForIntervention(staff.getRole(), interventionType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    String.format(
                            "Le rôle %s ne peut pas être assigné à une intervention de type %s",
                            staff.getRole(),
                            interventionType
                    )
            );
        }
    }









    public List<InterventionChirurgicale> findByStatut(StatutIntervention statut) {
        return interventionRepository.findByStatut(statut);
    }

    public InterventionChirurgicale updateStatus(Long id, StatutIntervention newStatus) {
        InterventionChirurgicale intervention = interventionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Intervention non trouvée"));

        intervention.setStatut(newStatus);
        return interventionRepository.save(intervention);
    }















    @Transactional
    public InterventionChirurgicale validerEtPlanifierDemande(Long id, InterventionValidationDTO validationDTO) {
        log.info("Début de planification - ID: {}", id);

        try {
            InterventionChirurgicale demande = interventionRepository.findById(id)
                    .orElseThrow(() -> {
                        log.error("Intervention non trouvée");
                        return new ResponseStatusException(HttpStatus.NOT_FOUND);
                    });

            log.info("Ancien statut: {}", demande.getStatut());

            // Validation et modification
            demande.setStatut(StatutIntervention.PLANIFIEE);
            // ... autres modifications ...

            InterventionChirurgicale saved = interventionRepository.saveAndFlush(demande);
            log.info("Nouveau statut après save: {}", saved.getStatut());

            // Vérification directe
            InterventionChirurgicale freshCheck = interventionRepository.findById(id).orElseThrow();
            log.info("Statut après rechargement: {}", freshCheck.getStatut());

            return saved;
        } catch (Exception e) {
            log.error("Erreur lors de la persistance", e);
            throw e;
        }
    }

    public List<InterventionChirurgicale> getDemandesEnAttente() {
        return interventionRepository.findByStatut(StatutIntervention.DEMANDE);
    }







    public void validateDoctorSpecialty(MedicalStaff staff, TypeIntervention interventionType) {
        if (staff == null || interventionType == null) {
            throw new IllegalArgumentException("Paramètres ne peuvent pas être null");
        }

        switch (staff.getRole()) {
            case MEDECIN:
                validateMedecinSpecialty(staff, interventionType);
                break;
            case ANESTHESISTE:
                validateAnesthesisteSpecialty(staff, interventionType);
                break;
            default:
                // Pas de validation pour les autres rôles
                break;
        }
    }

    private void validateMedecinSpecialty(MedicalStaff staff, TypeIntervention interventionType) {
        if (staff.getSpecialiteMedecin() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Le médecin/chirurgien doit avoir une spécialité définie");
        }

        switch (interventionType) {
            case CHIRURGIE_CARDIAQUE:
                if (staff.getSpecialiteMedecin() != SpecialiteMedecin.CARDIOLOGIE) {
                    throwSpecialiteException(staff, "cardiologie");
                }
                break;
            case ORTHOPEDIQUE:
                if (staff.getSpecialiteMedecin() != SpecialiteMedecin.ORTHOPEDIE) {
                    throwSpecialiteException(staff, "orthopédie");
                }
                break;
            case NEUROCHIRURGIE:
                if (staff.getSpecialiteMedecin() != SpecialiteMedecin.NEUROLOGIE) {
                    throwSpecialiteException(staff, "neurologie");
                }
                break;
            case OPHTALMOLOGIQUE:
                if (staff.getSpecialiteMedecin() != SpecialiteMedecin.OPHTALMOLOGIE) {
                    throwSpecialiteException(staff, "ophtalmologie");
                }
                break;
            case UROLOGIE:
                if (staff.getSpecialiteMedecin() != SpecialiteMedecin.UROLOGIE) {
                    throwSpecialiteException(staff, "urologie");
                }
                break;
            case GYNECOLOGIQUE:
                if (staff.getSpecialiteMedecin() != SpecialiteMedecin.GYNECOLOGIE) {
                    throwSpecialiteException(staff, "gynécologie");
                }
                break;
            case AUTRE:
                // Pas de validation spécifique pour les interventions de type AUTRE
                break;
        }
    }

    private void validateAnesthesisteSpecialty(MedicalStaff staff, TypeIntervention interventionType) {
        if (staff.getSpecialiteAnesthesiste() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "L'anesthésiste doit avoir une spécialité définie");
        }

        switch (interventionType) {
            case CHIRURGIE_CARDIAQUE:
                if (staff.getSpecialiteAnesthesiste() != SpecialiteAnesthesiste.ANESTHESIE_CARDIOTHORACIQUE) {
                    throwSpecialiteException(staff, "anesthésie cardiothoracique");
                }
                break;
            case ORTHOPEDIQUE:
                if (staff.getSpecialiteAnesthesiste() != SpecialiteAnesthesiste.ANESTHESIE_ORTHOPEDIQUE) {
                    throwSpecialiteException(staff, "anesthésie orthopédique");
                }
                break;
            case NEUROCHIRURGIE:
                if (staff.getSpecialiteAnesthesiste() != SpecialiteAnesthesiste.ANESTHESIE_NEUROCHIRURGICALE) {
                    throwSpecialiteException(staff, "anesthésie neurochirurgicale");
                }
                break;
            case GYNECOLOGIQUE:
                if (staff.getSpecialiteAnesthesiste() != SpecialiteAnesthesiste.ANESTHESIE_OBSTETRICALE) {
                    throwSpecialiteException(staff, "anesthésie obstétricale");
                }
                break;
            // Ajoutez d'autres cas selon vos besoins
        }
    }

    private void throwSpecialiteException(MedicalStaff staff, String specialiteRequise) {
        String roleName = staff.getRole() == RoleMedical.MEDECIN ? "médecin" :
                staff.getRole().toString().toLowerCase();

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                String.format("Le %s %s %s doit être spécialisé en %s pour ce type d'intervention",
                        roleName,
                        staff.getNom(),
                        staff.getPrenom(),
                        specialiteRequise));
    }















    public List<MedicalStaff> findAvailableStaffBySpecialite(LocalDateTime start, LocalDateTime end,
                                                             RoleMedical role, TypeIntervention interventionType) {
        List<MedicalStaff> availableStaff = findAvailableStaff(start, end, role);

        return availableStaff.stream()
                .filter(staff -> isStaffCompatible(staff, role, interventionType))
                .collect(Collectors.toList());
    }

    private boolean isStaffCompatible(MedicalStaff staff, RoleMedical role, TypeIntervention interventionType) {
        // Les infirmiers sont toujours compatibles
        if (role == RoleMedical.INFIRMIER) {
            return true;
        }

        // Vérifier la compatibilité selon le type d'intervention
        switch (interventionType) {
            case CHIRURGIE_CARDIAQUE:
                return (role == RoleMedical.MEDECIN && staff.getSpecialiteMedecin() == SpecialiteMedecin.CARDIOLOGIE) ||
                        (role == RoleMedical.ANESTHESISTE && staff.getSpecialiteAnesthesiste() == SpecialiteAnesthesiste.ANESTHESIE_CARDIOTHORACIQUE);
            case ORTHOPEDIQUE:
                return (role == RoleMedical.MEDECIN &&
                        (staff.getSpecialiteMedecin() == SpecialiteMedecin.ORTHOPEDIE ||
                                staff.getSpecialiteMedecin() == SpecialiteMedecin.TRAUMATOLOGIE)) ||
                        (role == RoleMedical.ANESTHESISTE && staff.getSpecialiteAnesthesiste() == SpecialiteAnesthesiste.ANESTHESIE_ORTHOPEDIQUE);
            case NEUROCHIRURGIE:
                return (role == RoleMedical.MEDECIN && staff.getSpecialiteMedecin() == SpecialiteMedecin.NEUROLOGIE) ||
                        (role == RoleMedical.ANESTHESISTE && staff.getSpecialiteAnesthesiste() == SpecialiteAnesthesiste.ANESTHESIE_NEUROCHIRURGICALE);
            case OPHTALMOLOGIQUE:
                return (role == RoleMedical.MEDECIN && staff.getSpecialiteMedecin() == SpecialiteMedecin.OPHTALMOLOGIE) ||
                        (role == RoleMedical.ANESTHESISTE && staff.getSpecialiteAnesthesiste() == SpecialiteAnesthesiste.ANESTHESIE_GENERALE);
            case UROLOGIE:
                return (role == RoleMedical.MEDECIN && staff.getSpecialiteMedecin() == SpecialiteMedecin.UROLOGIE) ||
                        (role == RoleMedical.ANESTHESISTE && staff.getSpecialiteAnesthesiste() == SpecialiteAnesthesiste.ANESTHESIE_GENERALE);
            case GYNECOLOGIQUE:
                return (role == RoleMedical.MEDECIN && staff.getSpecialiteMedecin() == SpecialiteMedecin.GYNECOLOGIE) ||
                        (role == RoleMedical.ANESTHESISTE && staff.getSpecialiteAnesthesiste() == SpecialiteAnesthesiste.ANESTHESIE_GENERALE);
            case AUTRE:
                return true; // Pour les autres types, on accepte toutes les spécialités
            default:
                return false;
        }
    }


    @Transactional
    public InterventionChirurgicale assignerStaffMultiple(Long interventionId, Map<RoleMedical, List<Long>> staffAssignments) {
        // 1. Récupérer l'intervention
        InterventionChirurgicale intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Intervention non trouvée"));

        // 2. Vérifier les disponibilités
        LocalDateTime start = intervention.getStartTime() != null ?
                intervention.getStartTime() : intervention.getDate().atStartOfDay();
        LocalDateTime end = intervention.getEndTime() != null ?
                intervention.getEndTime() : intervention.getDate().atTime(23, 59);

        // Vérification des disponibilités pour tous les staffs
        for (Map.Entry<RoleMedical, List<Long>> entry : staffAssignments.entrySet()) {
            RoleMedical role = entry.getKey();
            List<Long> staffIds = entry.getValue();

            for (Long staffId : staffIds) {
                MedicalStaff staff = medicalStaffRepository.findById(staffId)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND, role + " non trouvé: " + staffId));

                if (!staff.getRole().equals(role)) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Le personnel " + staffId + " n'est pas un " + role);
                }

                // Vérifier disponibilité
                boolean estDisponible = interventionRepository
                        .findByEquipeMedicaleIdAndDateTimeRange(staffId, start, end)
                        .stream()
                        .noneMatch(i -> !i.getId().equals(interventionId));

                if (!estDisponible) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            role + " " + staff.getNom() + " " + staff.getPrenom() +
                                    " n'est pas disponible pour cette plage horaire");
                }
            }
        }

        // 3. Mettre à jour l'équipe médicale
        // D'abord supprimer les anciennes affectations pour les rôles concernés
        intervention.getEquipeMedicale().removeIf(staff ->
                staffAssignments.keySet().contains(staff.getRole()));

        // Puis ajouter les nouveaux membres
        for (Map.Entry<RoleMedical, List<Long>> entry : staffAssignments.entrySet()) {
            RoleMedical role = entry.getKey();
            for (Long staffId : entry.getValue()) {
                MedicalStaff staff = medicalStaffRepository.findById(staffId).get();
                intervention.getEquipeMedicale().add(staff);
            }
        }

        return interventionRepository.save(intervention);
    }








    public void updateEquipeMedicale(InterventionChirurgicale intervention, Map<RoleMedical, MedicalStaff> staffMap) {
        // Clear existing staff assignments for this intervention
        intervention.getEquipeMedicale().clear();

        // Add new staff assignments
        staffMap.forEach((role, staff) -> {
            staff.getInterventions().add(intervention);
            intervention.getEquipeMedicale().add(staff);
        });

        interventionRepository.save(intervention);
    }










    @Scheduled(fixedRate = 1000) // Exécuté toutes les minutes
    @Transactional
    public void updatesInterventionStatusesAutomatically() {
        LocalDateTime now = LocalDateTime.now();
        log.info("Vérification automatique des statuts des interventions - {}", now);

        // 1. Mettre à jour PLANIFIEE -> EN_COURS
        List<InterventionChirurgicale> toStart = interventionRepository
                .findByStatutAndStartTimeLessThanEqual(StatutIntervention.PLANIFIEE, now);

        if (!toStart.isEmpty()) {
            log.info("{} intervention(s) à démarrer", toStart.size());

            toStart.forEach(intervention -> {
                intervention.setStatut(StatutIntervention.EN_COURS);
                interventionRepository.save(intervention);
                log.info("Intervention {} démarrée (prévue: {})",
                        intervention.getId(), intervention.getStartTime());
            });
        }

        // 2. Mettre à jour EN_COURS -> TERMINEE
        List<InterventionChirurgicale> toComplete = interventionRepository
                .findByStatutAndEndTimeLessThan(StatutIntervention.EN_COURS, now);

        if (!toComplete.isEmpty()) {
            log.info("{} intervention(s) à terminer", toComplete.size());

            toComplete.forEach(intervention -> {
                intervention.setStatut(StatutIntervention.TERMINEE);
                returnMaterielsToStock(intervention); // Retour des matériels
                interventionRepository.save(intervention);
                log.info("Intervention {} terminée (prévue: {})",
                        intervention.getId(), intervention.getEndTime());
            });
        }
    }




    @Transactional
    public InterventionChirurgicale assignerPatient(Long interventionId, Long patientId) {
        InterventionChirurgicale intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new RuntimeException("Intervention non trouvée: " + interventionId));

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient non trouvé: " + patientId));

        intervention.setPatient(patient);
        return interventionRepository.save(intervention);
    }

}


